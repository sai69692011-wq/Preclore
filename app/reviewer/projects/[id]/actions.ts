// src/app/reviewer/projects/[id]/actions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server action: persist an academic rating and propagate its effects.
//   1. upsert project_ratings (one rating per reviewer per project)
//   2. recompute the project's academic aggregate (avg + count)
//   3. return the 1.1×-boosted effective VQ (computed by the VQ engine)
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import {
  computeOverallRating,
  isValidRatingSet,
  averageOverall,
  type RatingScores,
} from "@/lib/review-pipeline";
import { getEffectiveVqScore } from "@/lib/vq-engine";

export interface SubmitRatingResult {
  ok: boolean;
  error?: string;
  overall?: number;
  academicAvg?: number;
  boostedVq?: number;
}

export async function submitRating(
  projectId: string,
  input: Partial<RatingScores> & { comment?: string }
): Promise<SubmitRatingResult> {
  const comment = input.comment ?? null; // capture before the type guard narrows `input`
  if (!isValidRatingSet(input)) {
    return { ok: false, error: "Each criterion must be an integer from 1 to 5." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in as a reviewer." };

  const overall = computeOverallRating(input);

  // 1) Idempotent upsert — UNIQUE(reviewer_id, project_id) drives the
  //    conflict target, so re-rating edits in place. RLS additionally
  //    requires the reviewer to be verified (see migration.sql).
  const { error: upsertError } = await supabase.from("project_ratings").upsert(
    {
      reviewer_id: user.id,
      project_id: projectId,
      rigor: input.rigor,
      innovation: input.innovation,
      impact: input.impact,
      presentation: input.presentation,
      overall,
      comment,
    },
    { onConflict: "reviewer_id,project_id" }
  );
  if (upsertError) {
    return {
      ok: false,
      error:
        upsertError.code === "42501"
          ? "Rating is locked until your reviewer account is verified."
          : upsertError.message,
    };
  }

  // 2) Recompute the project aggregate from ALL reviewer ratings.
  const { data: all } = await supabase
    .from("project_ratings")
    .select("overall")
    .eq("project_id", projectId);
  const overalls = (all ?? []).map((r) => r.overall).filter(isFinite);
  const academicAvg = averageOverall(overalls);
  const reviewCount = overalls.length;

  // NOTE: this UPDATE assumes the projects table permits reviewer updates
  // (RLS). If your policies restrict writes to owners, move this step into a
  // database trigger on project_ratings instead — see migration.sql notes.
  const [{ data: proj }, { error: updateError }] = await Promise.all([
    supabase.from("projects").select("vq_score").eq("id", projectId).single(),
    supabase
      .from("projects")
      .update({
        academic_rating_avg: academicAvg,
        academic_review_count: reviewCount,
      })
      .eq("id", projectId),
  ]);
  if (updateError) {
    console.warn("[submitRating] projects aggregate update failed:", updateError.message);
  }

  // 3) The VQ engine owns the multiplier — never hand-roll it in UI code.
  //    v2.3: the tier (1.1× boost vs 0.85× penalty) keys off this average.
  const boostedVq = getEffectiveVqScore({
    vq_score: proj?.vq_score ?? 0,
    academicallyReviewed: reviewCount > 0,
    academicRatingAvg: academicAvg,
  });

  revalidatePath(`/reviewer/projects/${projectId}`);
  revalidatePath("/dashboard/reviewer");

  return { ok: true, overall, academicAvg, boostedVq };
}
