import { NextResponse } from 'next/server';
import { isMentorRole } from '@/lib/access';
import { readJsonObject } from '@/lib/request';
import { createClient } from '@/lib/supabase/server';
import { normalizeText } from '@/lib/utils';

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
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

  if (!isUuid(body.researcherId) || body.researcherId === user.id) {
    return NextResponse.json({ error: 'Invalid researcher target.' }, { status: 400 });
  }

  const { data: me } = await supabase
    .from('users')
    .select('role, display_name')
    .eq('id', user.id)
    .maybeSingle();

  if (!me || !isMentorRole(me.role)) {
    return NextResponse.json(
      { error: 'Only mentor or admin accounts can request protected researcher funding access.' },
      { status: 403 }
    );
  }

  const { data: existing } = await supabase
    .from('mentorship_requests')
    .select('id, status')
    .eq('requester_id', user.id)
    .eq('researcher_id', body.researcherId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: `Follow request already ${existing.status}.` });
  }

  const requesterName = normalizeText(me.display_name) || `mentor-${user.id.slice(0, 8)}`;
  const payload = {
    requester_id: user.id,
    requester_name: requesterName,
    researcher_id: body.researcherId,
    researcher_name: 'Researcher',
    status: 'pending'
  };

  const { error } = await supabase.from('mentorship_requests').insert(payload);

  if (error) {
    if (error.code === '23503') {
      return NextResponse.json({ error: 'Researcher not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: 'Mentor access request sent.' });
}

export async function PATCH(request) {
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

  if (!['accepted', 'rejected'].includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  if (!isUuid(body.requestId)) {
    return NextResponse.json({ error: 'Invalid request id.' }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from('mentorship_requests')
    .select('id, researcher_id')
    .eq('id', body.requestId)
    .maybeSingle();

  if (!existing || existing.researcher_id !== user.id) {
    return NextResponse.json({ error: 'Only the researcher can respond.' }, { status: 403 });
  }

  const { error } = await supabase
    .from('mentorship_requests')
    .update({ status: body.status, responded_at: new Date().toISOString() })
    .eq('id', body.requestId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ message: `Request ${body.status}.` });
}
