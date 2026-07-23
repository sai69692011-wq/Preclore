// src/app/admin/jury/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Shadow Jury Command Center — reviews projects flagged by the Semantic
// Plagiarism Layer. ACCESS GATE: verification_tier = 'admin' (checked here
// for render AND again inside the server actions for enforcement).
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { getAdminContext } from "@/lib/admin-guard";
import { JuryConsole, type FlaggedProject } from "./jury-console";

export const metadata: Metadata = { title: "Shadow Jury — Admin" };

export default async function ShadowJuryPage() {
  const { supabase, isAdmin } = await getAdminContext();

  if (!isAdmin) {
    return (
      <Shell>
        <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Restricted: Shadow Jury</h1>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>
          This command center requires <code>verification_tier = 'admin'</code>.
          If you believe that's an error, contact the platform steward.
        </p>
      </Shell>
    );
  }

  // 1) Flagged projects. ASSUMPTION: the plagiarism layer writes
  //    matched_project_id + similarity_score onto the flagged row
  //    (columns added in migration.sql).
  const { data: flaggedRows, error } = await supabase
    .from("projects")
    .select(
      "id, title, problem, solution, category, status, similarity_score, matched_project_id, created_at, users(name)"
    )
    .eq("status", "flagged")
    .order("similarity_score", { ascending: false })
    .limit(50);

  if (error) console.warn("[jury] flagged fetch failed:", error.message);

  // 2) The matched originals — fetched by id list to avoid fragile
  //    self-join FK hints; joined in JS below.
  const matchIds = [
    ...new Set(
      (flaggedRows ?? [])
        .map((r: any) => r.matched_project_id)
        .filter(Boolean)
    ),
  ] as string[];

  let matchesById = new Map<string, any>();
  if (matchIds.length > 0) {
    const { data: matchRows } = await supabase
      .from("projects")
      .select("id, title, problem, solution, category, created_at, users(name)")
      .in("id", matchIds);
    matchesById = new Map((matchRows ?? []).map((m: any) => [m.id, m]));
  }

  const flagged: FlaggedProject[] = (flaggedRows ?? []).map((r: any) => {
    const author = Array.isArray(r.users) ? r.users[0] : r.users;
    const m = r.matched_project_id ? matchesById.get(r.matched_project_id) : null;
    const mAuthor = m ? (Array.isArray(m.users) ? m.users[0] : m.users) : null;
    return {
      id: r.id,
      title: r.title ?? "Untitled project",
      problem: r.problem ?? "",
      solution: r.solution ?? "",
      category: r.category ?? null,
      authorName: author?.name ?? "Unknown",
      createdAt: r.created_at ?? "",
      similarity: r.similarity_score ?? null,
      matched: m
        ? {
            id: m.id,
            title: m.title ?? "Untitled project",
            problem: m.problem ?? "",
            solution: m.solution ?? "",
            authorName: mAuthor?.name ?? "Unknown",
            createdAt: m.created_at ?? "",
          }
        : null,
    };
  });

  return (
    <Shell>
      <p style={{ fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase", color: "#f59e0b", margin: "0 0 8px" }}>
        The Audit Layer
      </p>
      <h1 style={{ fontSize: 28, margin: "0 0 6px" }}>Shadow Jury Command Center</h1>
      <p style={{ color: "#94a3b8", fontSize: 14, margin: "0 0 28px" }}>
        {flagged.length} flagged submission{flagged.length === 1 ? "" : "s"} awaiting
        a verdict. The Quality Seal holds until you rule.
      </p>
      <JuryConsole flagged={flagged} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        color: "#e2e8f0",
        padding: "48px 24px 96px",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1240, margin: "0 auto" }}>{children}</div>
    </main>
  );
}

export const dynamic = "force-dynamic";
