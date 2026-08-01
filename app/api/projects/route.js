import { NextResponse } from 'next/server';
import { deriveAccessProfile } from '@/lib/access';
import { PROJECT_TAG_COMPAT } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import { normalizeText, slugify, splitEvidence } from '@/lib/utils';
import { scoreProject } from '@/lib/vq-engine';

function canonicalProjectTag(projectTag) {
  return projectTag === 'Needs Funding' ? 'Project: Needs Funding' : projectTag;
}

function safeFilename(name = 'submission.pdf') {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in before publishing.' }, { status: 401 });
  }

  const formData = await request.formData();

  const title = normalizeText(formData.get('title')).slice(0, 160);
  const regionLabel = normalizeText(formData.get('regionLabel')).slice(0, 120);
  const summary = normalizeText(formData.get('summary')).slice(0, 4000);
  const evidenceUrlsRaw = String(formData.get('evidenceUrls') || '').slice(0, 4000);
  const citations = normalizeText(formData.get('citations')).slice(0, 2000);
  const systemsImpact = normalizeText(formData.get('systemsImpact')).slice(0, 2000);
  const publicGoodCase = normalizeText(formData.get('publicGoodCase')).slice(0, 2000);
  const reproducibilityNote = normalizeText(formData.get('reproducibilityNote')).slice(0, 2000);
  const projectTag = canonicalProjectTag(formData.get('projectTag'));
  const confirmPublicGood = String(formData.get('confirmPublicGood')) === 'true';
  const pdf = formData.get('pdf');

  if (!confirmPublicGood) {
    return NextResponse.json({ error: 'Public-good publication confirmation is required.' }, { status: 400 });
  }

  if (!PROJECT_TAG_COMPAT.includes(projectTag)) {
    return NextResponse.json({ error: 'Invalid project tag.' }, { status: 400 });
  }

  if (!title || !summary) {
    return NextResponse.json({ error: 'Title and project abstract are required.' }, { status: 400 });
  }

  if (!(pdf instanceof File) || pdf.size === 0) {
    return NextResponse.json({ error: 'A PDF upload is required.' }, { status: 400 });
  }

  if (pdf.type !== 'application/pdf') {
    return NextResponse.json({ error: 'Only PDF uploads are supported.' }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('display_name, school_name, role, birth_year, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const access = deriveAccessProfile(profile || {});
  if (!access.canSubmit) {
    return NextResponse.json(
      { error: 'This account is in read-only or mentor mode and cannot publish submissions.' },
      { status: 403 }
    );
  }

  const publicName = normalizeText(profile?.display_name).slice(0, 80);
  if (!publicName) {
    return NextResponse.json(
      { error: 'Complete your profile with a public display name before publishing.' },
      { status: 400 }
    );
  }

  const pdfPath = `${user.id}/${Date.now()}-${safeFilename(pdf.name || 'project.pdf')}`;
  const uploadResult = await supabase.storage.from('project-pdfs').upload(pdfPath, pdf, {
    contentType: 'application/pdf',
    upsert: false
  });

  if (uploadResult.error) {
    return NextResponse.json({ error: uploadResult.error.message }, { status: 400 });
  }

  const {
    data: { publicUrl: pdfUrl }
  } = supabase.storage.from('project-pdfs').getPublicUrl(pdfPath);

  const normalized = {
    title,
    regionLabel,
    summary,
    evidenceUrls: evidenceUrlsRaw,
    citations,
    systemsImpact,
    publicGoodCase,
    reproducibilityNote,
    projectTag,
    pdfFilename: pdf.name,
    pdfUrl,
    confirmPublicGood: true
  };

  const score = scoreProject(normalized);
  const baseSlug = slugify(title) || 'research-project';
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
  const evidenceUrls = splitEvidence(evidenceUrlsRaw).slice(0, 20);

  const payload = {
    researcher_id: user.id,
    researcher_name: publicName,
    researcher_school: profile?.school_name || null,
    researcher_avatar_url: profile?.avatar_url || null,
    slug,
    title,
    summary,
    problem_statement: null,
    hypothesis: null,
    methodology: null,
    evidence_urls: evidenceUrls,
    region_label: regionLabel || null,
    systems_impact: systemsImpact || null,
    public_good_case: publicGoodCase || null,
    reproducibility_note: reproducibilityNote || null,
    citations: citations || null,
    project_tag: projectTag,
    pdf_path: pdfPath,
    pdf_url: pdfUrl,
    pdf_filename: pdf.name,
    vq_score: score.total,
    tier: score.tier,
    vq_breakdown: {
      ...score.breakdown,
      modifiers: score.modifiers
    },
    quest_answers: normalized,
    status: 'published',
    published_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(payload)
    .select('id, slug')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ project: data, score });
}
