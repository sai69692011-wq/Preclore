// src/lib/supabase-browser.ts
// ─────────────────────────────────────────────────────────────────────────────
// Standard Supabase browser client for client components.
// ⚠️ If your repo already has one, SKIP this file and re-point imports.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
