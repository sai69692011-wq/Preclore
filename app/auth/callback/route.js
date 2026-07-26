import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function safeRedirectPath(value) {
  if (!value || typeof value !== 'string') return '/profile';
  if (!value.startsWith('/')) return '/profile';
  if (value.startsWith('//')) return '/profile';
  return value;
}

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = safeRedirectPath(requestUrl.searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) {
      const safeHandle = `researcher-${user.id.slice(0, 8)}`;
      await supabase.from('users').upsert({
        id: user.id,
        display_name: null,
        username: safeHandle,
        created_at: new Date().toISOString()
      });
    }
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
