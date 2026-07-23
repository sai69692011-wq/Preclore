// src/lib/admin-guard.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shared server-side admin check for the "Audit" layer. Used by BOTH the
// jury page (render gate) and its server actions (enforcement gate) — a
// hidden UI is UX; the action check is the security boundary.
//
// ASSUMPTION: public.users has verification_tier and users.id == auth.uid().
// Adjust the column/table names here if your schema differs.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "./supabase-server";

export interface AdminContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: { id: string; email?: string } | null;
  isAdmin: boolean;
}

export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, isAdmin: false };

  const { data: profile, error } = await supabase
    .from("users")
    .select("verification_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("[admin-guard] tier lookup failed:", error.message);
    return { supabase, user, isAdmin: false };
  }

  return { supabase, user, isAdmin: profile?.verification_tier === "admin" };
}
