// src/app/actions/integrity.ts
// ─────────────────────────────────────────────────────────────────────────────
// Semantic Plagiarism Layer — scanner action.
// Scans a project's problem+solution against the corpus (TF-IDF + cosine,
// pure math in src/lib/plagiarism.ts) and persists the verdict:
//   > 0.75 → status 'blocked' · ≥ 0.55 → 'flagged' (Shadow Jury queue)
//   < 0.55 → similarity recorded, status untouched.
// Run it at submission time, and re-run it from the Jury console as the
// corpus grows.
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import { createClient } from "@/lib/supabase-server";
import {
  scanCandidate,
  type SimilarityVerdict,
} from "@/lib/plagiarism";

export interface ScanActionResult {
  ok: boolean;
  error?: string;
  score?: number;
  verdict?: SimilarityVerdict;
  bestMatchId?: string | null;
}

export async function runPlagiarismScan(
  projectId: string
): Promise<ScanActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in required." };

  const { data: candidate, error: fetchError } = await supabase
    .from("projects")
    .select("id, problem, solution, status")
    .eq("id", projectId)
    .maybeSingle();

  if (fetchError || !candidate)
    return { ok: false, error: "Project not found." };

  // Corpus: every OTHER project's text. Empty strings are cheap to skip.
  const { data: others } = await supabase
    .from("projects")
    .select("id, problem, solution")
    .neq("id", projectId)
    .limit(500);

  const corpus = (others ?? [])
    .filter((p) => (p.problem ?? "").trim() || (p.solution ?? "").trim())
    .map((p) => ({
      id: p.id,
      text: `${p.problem ?? ""}\n${p.solution ?? ""}`,
    }));

  const scan = scanCandidate(
    `${candidate.problem ?? ""}\n${candidate.solution ?? ""}`,
    corpus
  );

  // Persist the verdict. Only auto-escalate status when the scan demands it —
  // never un-block/un-flag a project a human juror is already handling.
  const update: Record<string, unknown> = {
    similarity_score: scan.score,
    matched_project_id: scan.bestMatchId,
  };
  if (scan.verdict === "blocked") update.status = "blocked";
  else if (scan.verdict === "flagged" && candidate.status !== "blocked")
    update.status = "flagged";

  const { error: updateError } = await supabase
    .from("projects")
    .update(update)
    .eq("id", projectId);

  if (updateError) {
    // NOTE: owner-vs-admin UPDATE rights on projects vary by schema. If RLS
    // blocks this, wrap the update in a SECURITY DEFINER function instead.
    console.warn("[integrity] verdict write failed:", updateError.message);
    return { ok: false, error: updateError.message };
  }

  return {
    ok: true,
    score: scan.score,
    verdict: scan.verdict,
    bestMatchId: scan.bestMatchId,
  };
}
