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

function safeFilename(name = 'avatar') {
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
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const formData = await request.formData();

  const { data: existingProfile } = await supabase
    .from('users')
    .select('role, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const currentRole = existingProfile?.role || 'student';
  const isStudent = currentRole === 'student';
  const isMentor = currentRole === 'mentor';
  const canStoreInstitutionFields = isStudent || isMentor;

  const displayName = normalizeText(formData.get('display_name')).slice(0, 80) || null;
  const username = sanitizeUsername(formData.get('username'), `researcher-${user.id.slice(0, 8)}`);
  const schoolName = canStoreInstitutionFields ? normalizeText(formData.get('school_name')).slice(0, 120) || null : null;
  const gradeLevel = canStoreInstitutionFields ? normalizeText(formData.get('grade_level')).slice(0, 120) || null : null;
  const bio = normalizeText(formData.get('bio')).slice(0, 600) || null;
  const birthYear = isStudent && formData.get('birth_year') ? Number(formData.get('birth_year')) : null;
  const parentUpiId = isStudent ? normalizeText(formData.get('parent_upi_id')) || null : null;
  const avatar = formData.get('avatar');
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

  let avatarUrl = existingProfile?.avatar_url || null;

  if (avatar instanceof File && avatar.size > 0) {
    const avatarPath = `${user.id}/${Date.now()}-${safeFilename(avatar.name || 'avatar')}`;
    const uploadResult = await supabase.storage.from('profile-images').upload(avatarPath, avatar, {
      contentType: avatar.type || 'image/png',
      upsert: false
    });

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error.message }, { status: 400 });
    }

    const {
      data: { publicUrl }
    } = supabase.storage.from('profile-images').getPublicUrl(avatarPath);

    avatarUrl = publicUrl;
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
    avatar_url: avatarUrl,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('users').upsert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: 'Profile saved.' });
}
