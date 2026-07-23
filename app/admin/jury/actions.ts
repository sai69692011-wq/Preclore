// src/app/admin/jury/actions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shadow Jury verdicts. The admin tier is RE-CHECKED here (the hidden page is
// UX; this is the boundary). Each verdict updates the project's status and
// appends an immutable row to content_violations for auditability.
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext } from "@/lib/admin-guard";

export interface ResolveResult {
  ok: boolean;
  error?: string;
}

export async function resolveFlag(
  projectId: string,
  decision: "approved" | "rejected",
  note: string | null
): Promise<ResolveResult> {
  if (decision !== "approved" && decision !== "rejected") {
    return { ok: false, error: "Invalid verdict." };
  }

  const { supabase, user, isAdmin } = await getAdminContext();
  if (!user) return { ok: false, error: "Sign in required." };
  if (!isAdmin) return { ok: false, error: "Shadow Jury is admin-only." };

  // Snapshot the flag context BEFORE clearing it, so the violation log keeps
  // the evidence (matched original + similarity at time of ruling).
  const { data: proj } = await supabase
    .from("projects")
    .select("status, matched_project_id, similarity_score")
    .eq("id", projectId)
    .maybeSingle();

  if (!proj) return { ok: false, error: "Project not found." };
  if (proj.status !== "flagged") {
    return { ok: false, error: `Already resolved (status: ${proj.status}).` };
  }

  const newStatus = decision === "approved" ? "approved" : "rejected";

  const { error: updateError } = await supabase
    .from("projects")
    .update({ status: newStatus })
    .eq("id", projectId)
    .eq("status", "flagged"); // optimistic guard against double-ruling
  if (updateError) {
    console.warn("[jury] status update failed:", updateError.message);
    return { ok: false, error: updateError.message };
  }

  const { error: logError } = await supabase.from("content_violations").insert({
    project_id: projectId,
    matched_project_id: proj.matched_project_id,
    admin_id: user.id,
    action: decision,
    note,
    similarity_score: proj.similarity_score,
  });
  if (logError) {
    // The status already changed — log loudly; do NOT silently succeed.
    console.warn("[jury] violation log failed:", logError.message);
    return {
      ok: false,
      error: `Status updated to '${newStatus}' but the audit log failed: ${logError.message}`,
    };
  }

  revalidatePath("/admin/jury");
  return { ok: true };
}
