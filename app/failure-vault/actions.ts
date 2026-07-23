// src/app/failure-vault/actions.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server action: accept a reflection and pay Resilience Points.
// Server re-validates the 200-word minimums — client validation is UX only.
// Anti-farming: one paid reflection per user per project (partial unique
// index in migration.sql); points are credited via a read-add-upsert on
// user_points under the student's own key.
// ─────────────────────────────────────────────────────────────────────────────

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-server";
import {
  validateReflection,
  type ReflectionInput,
} from "@/lib/failure-vault";
import { RESILIENCE_POINTS_AWARD } from "@/lib/constants";

export interface SubmitReflectionResult {
  ok: boolean;
  error?: string;
  pointsAwarded?: number;
  totalPoints?: number;
}

export async function submitReflection(
  input: ReflectionInput & {
    projectId: string | null;
    projectTitle: string | null;
  }
): Promise<SubmitReflectionResult> {
  const validation = validateReflection(input);
  if (!validation.valid) {
    return {
      ok: false,
      error:
        `Every section needs at least 200 words. ` +
        `Current: ${validation.sections.map((s) => s.words).join(" / ")}.`,
    };
  }
  if (!input.projectId && !input.projectTitle?.trim()) {
    return { ok: false, error: "Tell us which attempt failed." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to log a failure." };

  const { error: insertError } = await supabase.from("failure_vault").insert({
    user_id: user.id,
    project_id: input.projectId,
    project_title: input.projectTitle?.trim() || null,
    what_went_wrong: input.whatWentWrong.trim(),
    lessons_learned: input.lessonsLearned.trim(),
    do_differently: input.doDifferently.trim(),
    points_awarded: RESILIENCE_POINTS_AWARD,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        ok: false,
        error: "You've already banked a reflection for this project. Fail forward somewhere new!",
      };
    }
    console.warn("[failure-vault] insert failed:", insertError.message);
    return { ok: false, error: insertError.message };
  }

  // Credit +200. Read-modify-write is acceptable under the per-project
  // uniqueness above (no concurrent increments for the same project).
  const { data: existing } = await supabase
    .from("user_points")
    .select("resilience_points")
    .eq("user_id", user.id)
    .maybeSingle();
  const totalPoints = (existing?.resilience_points ?? 0) + RESILIENCE_POINTS_AWARD;

  const { error: pointsError } = await supabase.from("user_points").upsert({
    user_id: user.id,
    resilience_points: totalPoints,
    updated_at: new Date().toISOString(),
  });
  if (pointsError) {
    console.warn("[failure-vault] points upsert failed:", pointsError.message);
  }

  revalidatePath("/failure-vault");
  return { ok: true, pointsAwarded: RESILIENCE_POINTS_AWARD, totalPoints };
}
