// src/app/research/published/[id]/actions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Impact counter server actions (v2 — "Citation Moat").
//
// The actions now do exactly ONE thing: insert a unique event row. Counting
// is owned by the rollup_unique_counts() trigger in migration.sql, which
// recomputes view_count / citation_count from the event set on every insert.
//
// Unique-viewer identity:
//   - Signed-in users → their auth uid (cross-device dedupe via the PK).
//   - Guests → a cookie-minted "anon.<uuid>" written INTO the event table,
//     so the database itself enforces guest uniqueness — not just the cookie
//     jar. Clearing cookies and revisiting counts again (deliberate);
//     refreshes, StrictMode, and back-buttons never count (accidental).
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase-server";

export type CounterResult = { counted: boolean; error?: string };

const ONE_YEAR = 60 * 60 * 24 * 365;

async function recordEvent(
  paperId: string,
  kind: "view" | "citation"
): Promise<CounterResult> {
  const cookieName = `${kind === "view" ? "prv" : "prc"}_${paperId}`;
  const cookieStore = await cookies();

  // Fast path (all visitors): this browser already counted for this paper.
  if (cookieStore.get(cookieName)) return { counted: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS only permits a visitor's own uid or the 'anon.%' namespace.
  const viewerId = user ? user.id : `anon.${crypto.randomUUID()}`;
  const table = kind === "view" ? "paper_views" : "paper_citations";

  const { error } = await supabase
    .from(table)
    .insert({ paper_id: paperId, viewer_id: viewerId });

  if (error?.code === "23505") {
    // PK conflict — this viewer already counted (e.g. same account on another
    // browser). Remember locally so we skip the round-trip next time.
    cookieStore.set(cookieName, "1", { maxAge: ONE_YEAR, path: "/" });
    return { counted: false };
  }
  if (error) {
    console.warn(`[journal] ${kind} insert failed:`, error.message);
    return { counted: false, error: error.message };
  }

  // The trigger has already recomputed the denormalized counter — done.
  cookieStore.set(cookieName, "1", { maxAge: ONE_YEAR, path: "/" });
  return { counted: true };
}

/** Count a unique reader opening the paper. */
export async function recordPaperView(paperId: string): Promise<CounterResult> {
  return recordEvent(paperId, "view");
}

/** Count a citation (a "Copy Citation" = one presumed citation event). */
export async function recordCitation(paperId: string): Promise<CounterResult> {
  return recordEvent(paperId, "citation");
}
