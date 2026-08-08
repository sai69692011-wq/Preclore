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
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  const body = await readJson(request);
  if (!body) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const { targetUserId, reason, note } = body;

  if (!targetUserId || !reason) {
    return NextResponse.json({ error: 'Missing report details.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('identity_reports')
    .insert({
      target_user_id: targetUserId,
      reporter_id: user.id,
      reason,
      note: note || null
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { count } = await supabase
    .from('identity_reports')
    .select('*', { count: 'exact', head: true })
    .eq('target_user_id', targetUserId)
    .eq('status', 'open');

  if ((count || 0) >= 3) {
    await supabase
      .from('users')
      .update({
        verification_status: 'needs_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId);
  }

  if (process.env.REPORT_WEBHOOK_URL) {
    try {
      await fetch(process.env.REPORT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'identity_report',
          targetUserId,
          reporterId: user.id,
          reason,
          note: note || ''
        })
      });
    } catch {
      // optional webhook only
    }
  }

  return NextResponse.json({
    message: 'Your report has been sent for review.'
  });
}
