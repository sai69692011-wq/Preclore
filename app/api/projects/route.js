import { NextResponse } from 'next/server';
import { deriveAccessProfile } from '@/lib/access';
import { PROJECT_TAG_COMPAT } from '@/lib/constants';
import { readJsonObject } from '@/lib/request';
import { createClient } from '@/lib/supabase/server';
import { normalizeText, slugify, splitEvidence } from '@/lib/utils';
import { scoreProject } from '@/lib/vq-engine';

function canonicalProjectTag(projectTag) {
  return projectTag === 'Needs Funding' ? 'Project: Needs Funding' : projectTag;
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in before publishing.' }, { status: 401 });
  }

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  if (body.confirmPublicGood !== true) {
    return NextResponse.json(
      { error: 'Please confirm before publishing.' },
      { status: 400 }
    );
  }

  if (!PROJECT_TAG_COMPAT.includes(body.projectTag)) {
    return NextResponse.json({ error: 'Invalid project type.' }, { status: 400 });
  }

  const projectDocumentUrl = normalizeText(body.projectDocumentUrl).slice(0, 2000);

  if (projectDocumentUrl && !isHttpUrl(projectDocumentUrl)) {
    return NextResponse.json({ error: 'Project file/link must be a valid public URL.' }, { status: 400 });
  }

  const normalized = {
    title: normalizeText(body.title).slice(0, 160),
    regionLabel: normalizeText(body.regionLabel).slice(0, 120),
    summary: normalizeText(body.summary).slice(0, 4000),
    projectDocumentUrl,
    evidenceUrls: String(body.evidenceUrls || '').slice(0, 4000),
    citations: normalizeText(body.citations).slice(0, 2000),
    systemsImpact: normalizeText(body.systemsImpact).slice(0, 2000),
    publicGoodCase: normalizeText(body.publicGoodCase).slice(0, 2000),
    reproducibilityNote: normalizeText(body.reproducibilityNote).slice(0, 2000),
    projectTag: canonicalProjectTag(body.projectTag),
    confirmPublicGood: true,
    aiRiskFlag: body.aiRiskFlag === true
  };

  const required = ['title', 'summary', 'projectTag'];
  const missing = required.find((field) => !normalized[field]);

  if (missing) {
    return NextResponse.json({ error: `Missing required field: ${missing}` }, { status: 400 });
  }

  const evidenceUrls = splitEvidence(normalized.evidenceUrls);
  const invalidEvidenceUrl = evidenceUrls.find((url) => !isHttpUrl(url));

  if (invalidEvidenceUrl) {
    return NextResponse.json({ error: `Invalid evidence URL: ${invalidEvidenceUrl}` }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(
      'display_name, school_name, institution_name, role, birth_year, verification_status'
    )
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  const access = deriveAccessProfile(profile || {});
  if (!access.canSubmit) {
    return NextResponse.json(
      { error: 'This account cannot publish submissions.' },
      { status: 403 }
    );
  }

  const publicName = normalizeText(profile?.display_name).slice(0, 80);
  if (!publicName) {
    return NextResponse.json(
      { error: 'Please complete your profile with a public display name before publishing.' },
      { status: 400 }
    );
  }

  const score = scoreProject(normalized);
  const baseSlug = slugify(normalized.title) || 'research-project';
  const slug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const payload = {
    researcher_id: user.id,
    researcher_name: publicName,
    researcher_school: profile?.institution_name || profile?.school_name || null,
    researcher_avatar_url: null,
    slug,
    title: normalized.title,
    summary: normalized.summary,
    problem_statement: null,
    hypothesis: null,
    methodology: null,
    evidence_urls: evidenceUrls.slice(0, 20),
    region_label: normalized.regionLabel || null,
    systems_impact: normalized.systemsImpact || null,
    public_good_case: normalized.publicGoodCase || null,
    reproducibility_note: normalized.reproducibilityNote || null,
    citations: normalized.citations || null,
    project_tag: normalized.projectTag,
    pdf_path: null,
    pdf_url: normalized.projectDocumentUrl || null,
    pdf_filename: null,
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
