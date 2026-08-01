import { NextResponse } from 'next/server';
import { readJsonObject } from '@/lib/request';
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

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const body = await readJsonObject(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { data: existingProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const currentRole = existingProfile?.role || 'student';
  const isStudent = currentRole === 'student';
  const isMentor = currentRole === 'mentor';
  const canStoreInstitutionFields = isStudent || isMentor;

  const displayName = normalizeText(body.display_name).slice(0, 80) || null;
  const username = sanitizeUsername(body.username, `researcher-${user.id.slice(0, 8)}`);
  const schoolName = canStoreInstitutionFields ? normalizeText(body.school_name).slice(0, 120) || null : null;
  const gradeLevel = canStoreInstitutionFields ? normalizeText(body.grade_level).slice(0, 120) || null : null;
  const bio = normalizeText(body.bio).slice(0, 600) || null;

  const birthYear =
    isStudent && body.birth_year !== '' && body.birth_year !== null && body.birth_year !== undefined
      ? Number(body.birth_year)
      : null;

  const parentUpiId = isStudent ? normalizeText(body.parent_upi_id) || null : null;
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

  const payload = {
    id: user.id,
    display_name: displayName,
    username,
    school_name: schoolName,
    grade_level: gradeLevel,
    bio,
    birth_year: birthYear,
    parent_upi_id: parentUpiId,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('users').upsert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: 'Profile saved.' });
}
