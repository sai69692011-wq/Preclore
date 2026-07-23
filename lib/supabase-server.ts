// src/lib/supabase-server.ts
// ─────────────────────────────────────────────────────────────────────────────
// Standard Supabase server client for Next.js App Router (cookie-based).
//
// ⚠️ If your repo already has a server client (often utils/supabase/server.ts
// or lib/supabase-server.ts), SKIP this file and point the import in
// mentor-memory.ts at yours instead.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  // Next.js 15: cookies() is async. On Next.js ≤14 `await` on the sync
  // cookie store is still safe, so this signature works on both.
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies can't be set there.
            // Safe to ignore when middleware refreshes the session.
          }
        },
      },
    }
  );
}
