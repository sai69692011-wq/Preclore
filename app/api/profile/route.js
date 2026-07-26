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

  const displayName = normalizeText(body.display_name).slice(0, 80) || null;
  const username = sanitizeUsername(body.username, `researcher-${user.id.slice(0, 8)}`);
  const schoolName = normalizeText(body.school_name).slice(0, 120) || null;
  const gradeLevel = normalizeText(body.grade_level).slice(0, 120) || null;
  const bio = normalizeText(body.bio).slice(0, 600) || null;
  const birthYear = body.birth_year === '' || body.birth_year === null || body.birth_year === undefined
    ? null
    : Number(body.birth_year);
  const upiId = normalizeText(body.parent_upi_id) || null;
  const currentYear = new Date().getFullYear();

  if (birthYear !== null && (!Number.isInteger(birthYear) || birthYear < 1900 || birthYear > currentYear)) {
    return NextResponse.json({ error: 'Invalid birth year.' }, { status: 400 });
  }

  if (upiId && !isValidUpiId(upiId)) {
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
    parent_upi_id: upiId,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('users').upsert(payload);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: 'Profile saved.' });
}
