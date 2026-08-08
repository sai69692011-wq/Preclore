import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isValidUpiId, normalizeText } from '@/lib/utils';

function sanitizeUsername(value, fallback) {
  const cleaned = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32);

  return cleaned || fallback;
}

function safeFilename(name = 'file') {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function deriveVerificationKind(role) {
  if (role === 'student') return 'student_id';
  if (role === 'mentor') return 'staff_id';
  return 'reviewer_id';
}

function allowedVerificationMime(file) {
  return ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'].includes(file.type);
}

function scoreVerification({ displayName, schoolName, institutionIdRef, hasFile }) {
  let score = 0;
  const flags = [];

  if (displayName) {
    score += 30;
  } else {
    flags.push('name_missing');
  }

  if (schoolName) {
    score += 25;
  } else {
    flags.push('institution_missing');
  }

  if (institutionIdRef) {
    score += 20;
  } else {
    flags.push('id_reference_missing');
  }

  if (hasFile) {
    score += 25;
  } else {
    flags.push('proof_file_missing');
  }

  return { score, flags };
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const formData = await request.formData();

  const { data: existingProfile } = await supabase
    .from('users')
    .select(
      'role, verification_status, verification_kind, institution_id_ref, school_name, verification_doc_path'
    )
    .eq('id', user.id)
    .maybeSingle();

  const currentRole = existingProfile?.role || 'student';
  const isStudent = currentRole === 'student';

  const displayName = normalizeText(formData.get('display_name')).slice(0, 80) || null;
  const username = sanitizeUsername(formData.get('username'), `researcher-${user.id.slice(0, 8)}`);
  const schoolName = normalizeText(formData.get('school_name')).slice(0, 120) || null;
  const gradeLevel = normalizeText(formData.get('grade_level')).slice(0, 120) || null;
  const bio = normalizeText(formData.get('bio')).slice(0, 600) || null;
  const birthYear = isStudent && formData.get('birth_year') ? Number(formData.get('birth_year')) : null;
  const parentUpiId = isStudent ? normalizeText(formData.get('parent_upi_id')) || null : null;

  const submittedInstitutionId = normalizeText(formData.get('institution_id_ref')).slice(0, 120);
  const verificationDoc = formData.get('verification_doc');
  const currentYear = new Date().getFullYear();

  if (displayName && displayName.length < 2) {
    return NextResponse.json({ error: 'Display name must be at least 2 characters.' }, { status: 400 });
  }

  if (
    birthYear !== null &&
    (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > currentYear)
  ) {
    return NextResponse.json({ error: 'Invalid birth year.' }, { status: 400 });
  }

  if (parentUpiId && !isValidUpiId(parentUpiId)) {
    return NextResponse.json({ error: 'Invalid parent UPI ID format.' }, { status: 400 });
  }

  let verificationStatus = existingProfile?.verification_status || 'unverified';
  let verificationKind = existingProfile?.verification_kind || null;
  let institutionIdRef = existingProfile?.institution_id_ref || null;
  let verificationDocPath = existingProfile?.verification_doc_path || null;
  let verificationFlags = [];
  let verificationScore = 0;

  if (submittedInstitutionId) {
    institutionIdRef = submittedInstitutionId;
  }

  let hasFile = false;

  if (verificationDoc instanceof File && verificationDoc.size > 0) {
    if (!allowedVerificationMime(verificationDoc)) {
      return NextResponse.json({ error: 'Verification proof must be an image or PDF.' }, { status: 400 });
    }

    const verificationPath = `${user.id}/${Date.now()}-${safeFilename(verificationDoc.name || 'verification')}`;
    const uploadResult = await supabase.storage
      .from('verification-docs')
      .upload(verificationPath, verificationDoc, {
        contentType: verificationDoc.type || 'application/pdf',
        upsert: false
      });

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error.message }, { status: 400 });
    }

    verificationDocPath = verificationPath;
    hasFile = true;
  } else if (existingProfile?.verification_doc_path) {
    hasFile = true;
  }

  const verificationRequested = Boolean(schoolName) || Boolean(institutionIdRef) || hasFile;

  if (verificationRequested) {
    const automation = scoreVerification({
      displayName,
      schoolName,
      institutionIdRef,
      hasFile
    });

    verificationScore = automation.score;
    verificationFlags = automation.flags;
    verificationKind = deriveVerificationKind(currentRole);

    if (verificationScore >= 90) {
      verificationStatus = 'auto_checked';
    } else {
      verificationStatus = 'needs_review';
    }
  }

  const payload = {
    id: user.id,
    display_name: displayName,
    username,
    school_name: schoolName,
    grade_level: gradeLevel,
    bio,
    birth_year: birthYear,
    parent_upi_id: parentUpiId,
    institution_name: schoolName,
    institution_id_ref: institutionIdRef,
    verification_kind: verificationKind,
    verification_status: verificationStatus,
    verification_doc_path: verificationDocPath,
    verification_flags: verificationFlags,
    verification_score: verificationScore,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('users').upsert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    message: verificationRequested
      ? 'Profile saved. Verification has been submitted for checking.'
      : 'Profile saved.',
    verificationStatus
  });
}
