import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { deriveAccessProfile } from '@/lib/access';

export async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return response;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, birth_year')
    .eq('id', user.id)
    .maybeSingle();

  const access = deriveAccessProfile(profile || {});
  const pathname = request.nextUrl.pathname;
  const blockedSubmissionPaths = ['/submit', '/project/new'];

  if (!access.canSubmit && (pathname === '/api/projects' || pathname.startsWith('/api/projects/'))) {
    return NextResponse.json(
      { error: 'This account is in read-only or mentor mode and cannot publish submissions.' },
      { status: 403 }
    );
  }

  if (!access.canSubmit && blockedSubmissionPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    const redirectUrl = new URL('/journal', request.url);
    redirectUrl.searchParams.set('view', 'readonly');
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
