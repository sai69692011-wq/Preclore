import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function POST(request) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
  }

  const { data: me } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!me || me.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  const body = await readJson(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { targetUserId, decision, note } = body;

  if (!targetUserId || !['approve', 'reject', 'expired'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid verification request.' }, { status: 400 });
  }

  const now = new Date();
  const oneYearLater = new Date(now);
  oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

  let updatePayload = {
    verification_note_internal: note || null,
    updated_at: now.toISOString()
  };

  if (decision === 'approve') {
    updatePayload = {
      ...updatePayload,
      verification_status: 'verified',
      verification_verified_at: now.toISOString(),
      verification_expires_at: oneYearLater.toISOString()
    };
  }

  if (decision === 'reject') {
    updatePayload = {
      ...updatePayload,
      verification_status: 'rejected',
      verification_verified_at: null,
      verification_expires_at: null
    };
  }

  if (decision === 'expired') {
    updatePayload = {
      ...updatePayload,
      verification_status: 'expired',
      verification_expires_at: now.toISOString()
    };
  }

  const { error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: `Verification ${decision}d successfully.` });
}
