// src/lib/vq-engine.ts
// ─────────────────────────────────────────────────────────────────────────────
// VQ Engine v2.3 — "Scalability Engine"
// v2.3.1 — adds the 1.1× Academic Multiplier: projects with ≥1 faculty
//          rating get their effective VQ boosted everywhere it is judged.
//
// Replaces the v2.2 placeholder `checkMillionDollar()`:
//   - OLD: single score gate + 4 loose keywords → binary boolean
//   - NEW: 6 weighted-equal criteria, ≥5 required → platinum is earned
//     through math and evidence, not human bias.
// ─────────────────────────────────────────────────────────────────────────────

import {
  MILLION_DOLLAR_KEYWORDS,
  VQ_PLATINUM_THRESHOLD,
  BUDGET_RANGE,
  MIN_EVIDENCE_PHOTOS,
  MIN_IMPACT_DESCRIPTION_LENGTH,
  MIN_ORIGINALITY_SCORE,
  PLATINUM_CRITERIA_REQUIRED,
  ACADEMIC_VQ_MULTIPLIER,
  ACADEMIC_VQ_PENALTY,
  ACADEMIC_BOOST_MIN_AVG,
} from "./constants";

/** Shape of a project as evaluated by the detector. */
export interface MillionDollarProject {
  vq_score: number;
  problem: string;
  solution: string;
  photoCount?: number;
  hasVideo?: boolean;
  hasBudget?: boolean;
  budgetAmount?: number; // ₹ INR
  originalityScore?: number; // 0–200 platform scale
  /** true once ≥1 verified academic rating exists → the 1.1×/0.85× tier applies. */
  academicallyReviewed?: boolean;
  /** Verified academic average (1–5); ≥ ACADEMIC_BOOST_MIN_AVG earns the boost. */
  academicRatingAvg?: number;
}

/** The six detector criteria, keyed for transparent, auditable results. */
export interface MillionDollarCriteria {
  /** VQ score meets the platinum threshold (≥ 900). */
  highScore: boolean;
  /** Problem/solution text contains a scalability keyword. */
  hasScalability: boolean;
  /** ≥ 3 evidence photos, or at least one video. */
  evidenceRich: boolean;
  /** Budget is set AND falls inside the realistic ₹5,000–₹50,000 window. */
  budgetRealistic: boolean;
  /** Problem+solution detail exceeds the systemic-impact length bar. */
  impactScale: boolean;
  /** Originality score ≥ 180 (high originality signal). */
  originality: boolean;
}

export interface MillionDollarVerdict {
  /** True when at least 5 of 6 criteria are met. */
  isMillionDollar: boolean;
  /** How many of the 6 criteria were met (0–6). */
  criteriaMet: number;
  /** Per-criterion pass/fail — surfaced in the UI so the verdict is explainable. */
  breakdown: MillionDollarCriteria;
}

/**
 * Tiered Academic Multiplier (v2.3 Perfection): faculty endorsement boosts,
 * faculty criticism deflates — peer review cuts both ways.
 *   reviewed & avg ≥ ACADEMIC_BOOST_MIN_AVG → ×1.1
 *   reviewed & avg below the bar            → ×0.85
 *   not reviewed                            → ×1.0
 * Pure and deterministic — applied at evaluation time (never stored), so a
 * project re-tier identically in platinum detection, elite lanes, and
 * leaderboards as reviews change.
 */
export function applyAcademicMultiplier(
  vqScore: number,
  opts: { academicallyReviewed?: boolean; academicRatingAvg?: number }
): number {
  if (opts.academicallyReviewed !== true) return vqScore;
  const avg = opts.academicRatingAvg ?? 0;
  const factor =
    avg >= ACADEMIC_BOOST_MIN_AVG ? ACADEMIC_VQ_MULTIPLIER : ACADEMIC_VQ_PENALTY;
  return Math.round(vqScore * factor);
}

/** Effective VQ = raw score with the academic multiplier applied if earned. */
export function getEffectiveVqScore(project: {
  vq_score: number;
  academicallyReviewed?: boolean;
  academicRatingAvg?: number;
}): number {
  return applyAcademicMultiplier(project.vq_score, {
    academicallyReviewed: project.academicallyReviewed === true,
    academicRatingAvg: project.academicRatingAvg ?? 0,
  });
}

/**
 * Million-Dollar Idea Detector (v2.3).
 *
 * Pure function: no I/O, no DB calls, fully deterministic — the same
 * project always yields the same verdict, which is what keeps the
 * "platinum" badge bias-free.
 */
export function detectMillionDollarIdea(
  project: MillionDollarProject
): MillionDollarVerdict {
  const text = `${project.problem} ${project.solution}`.toLowerCase();

  const breakdown: MillionDollarCriteria = {
    // v2.3.1: judged on effective VQ — the 1.1× academic multiplier counts.
    highScore: getEffectiveVqScore(project) >= VQ_PLATINUM_THRESHOLD,
    hasScalability: MILLION_DOLLAR_KEYWORDS.some((kw) => text.includes(kw)),
    evidenceRich:
      (project.photoCount ?? 0) >= MIN_EVIDENCE_PHOTOS ||
      project.hasVideo === true,
    budgetRealistic:
      project.hasBudget === true &&
      (project.budgetAmount ?? 0) >= BUDGET_RANGE.MIN &&
      (project.budgetAmount ?? 0) <= BUDGET_RANGE.MAX,
    impactScale: text.length > MIN_IMPACT_DESCRIPTION_LENGTH,
    originality: (project.originalityScore ?? 0) >= MIN_ORIGINALITY_SCORE,
  };

  const criteriaMet = Object.values(breakdown).filter(Boolean).length;

  return {
    isMillionDollar: criteriaMet >= PLATINUM_CRITERIA_REQUIRED,
    criteriaMet,
    breakdown,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase integration — platinum promotion
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal structural type so this file doesn't hard-depend on @supabase/supabase-js. */
interface SupabaseLike {
  from(table: string): {
    update(values: Record<string, unknown>): {
      eq(column: string, value: unknown): Promise<{ error: { message: string } | null }>;
    };
  };
}

/**
 * Immediately sets a project's status to `platinum_eligible` in Supabase.
 * Must be called the moment `detectMillionDollarIdea()` returns true —
 * per spec, promotion is instant, not queued for human review.
 */
export async function setPlatinumEligible(
  supabase: SupabaseLike,
  projectId: string
): Promise<void> {
  const { error } = await supabase
    .from("projects")
    .update({ status: "platinum_eligible" })
    .eq("id", projectId);

  if (error) {
    throw new Error(
      `Failed to set project ${projectId} to platinum_eligible: ${error.message}`
    );
  }
}

/**
 * Convenience pipeline: evaluate a project and, if it earns platinum,
 * flip its Supabase status in the same call.
 *
 * @returns the verdict (post-promotion), so callers can update UI state.
 */
export async function evaluateAndPromote(
  supabase: SupabaseLike,
  projectId: string,
  project: MillionDollarProject
): Promise<MillionDollarVerdict> {
  const verdict = detectMillionDollarIdea(project);

  if (verdict.isMillionDollar) {
    await setPlatinumEligible(supabase, projectId);
  }

  return verdict;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * REMOVED — v2.2 placeholder kept here for the git-less paper trail:
 *
 * /* Target: Replace this placeholder with the v2.3 Scalability Engine *\/
 * function checkMillionDollar(vqScore: number, problem: string, solution: string): boolean {
 *   if (vqScore < VQ.PLATINUM_MIN) return false;
 *   const text = `${problem} ${solution}`.toLowerCase();
 *   return ["scale", "patent", "enterprise", "sustainable"].some((kw) => text.includes(kw));
 * }
 * ──────────────────────────────────────────────────────────────────────────── */
