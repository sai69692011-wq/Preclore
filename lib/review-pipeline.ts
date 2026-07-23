// src/lib/review-pipeline.ts
// ─────────────────────────────────────────────────────────────────────────────
// Academic Reviewer Pipeline v1 — shared, pure logic.
// Kept out of the route files so email rules, lane bucketing, and rating math
// are unit-testable and identical everywhere they're used.
// ─────────────────────────────────────────────────────────────────────────────

import {
  ELITE_VQ_THRESHOLD,
  JUNIOR_AGE_BAND,
  SENIOR_AGE_BAND,
  RATING_SCORE,
} from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Faculty email verification
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Institutional email gate for faculty onboarding.
 *
 * ⚠️ FIX vs. the provided snippet: `/.(edu|ac.in|edu.in)$/i` had two bugs —
 *   1. the leading `.` matched ANY character (so "notedu" passed), and
 *   2. the dots in `ac.in` / `edu.in` were unescaped (so "acXin" passed).
 * This version anchors on a literal dot before the suffix and escapes the
 * inner dots, so only real *.edu / *.ac.in / *.edu.in domains pass.
 */
export const EDU_EMAIL_PATTERN = /\.(edu|ac\.in|edu\.in)$/i;

export function isEduEmail(email: string): boolean {
  return EDU_EMAIL_PATTERN.test(email.trim());
}

/** Preset expertise domains shown on the onboarding form (free-text is fine too). */
export const EXPERTISE_AREAS = [
  "Water",
  "Agriculture",
  "Energy",
  "Health",
  "Waste",
  "Air Quality",
  "Mobility",
  "Education",
  "Other",
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Multi-criteria rating math
// ─────────────────────────────────────────────────────────────────────────────

export type RatingCriterionKey =
  | "rigor"
  | "innovation"
  | "impact"
  | "presentation";

export interface RatingCriterion {
  key: RatingCriterionKey;
  label: string;
  hint: string;
}

/** The four scored criteria, in display order — the form renders from this. */
export const RATING_CRITERIA: readonly RatingCriterion[] = [
  { key: "rigor",        label: "Rigor",        hint: "Method depth, data quality, reproducibility" },
  { key: "innovation",   label: "Innovation",   hint: "Novelty of the problem framing and solution" },
  { key: "impact",       label: "Impact",       hint: "Scale and durability of real-world benefit" },
  { key: "presentation", label: "Presentation", hint: "Clarity of documentation and evidence" },
] as const;

export type RatingScores = Record<RatingCriterionKey, number>;

export function isValidScore(n: unknown): n is number {
  return (
    typeof n === "number" &&
    Number.isInteger(n) &&
    n >= RATING_SCORE.MIN &&
    n <= RATING_SCORE.MAX
  );
}

export function isValidRatingSet(s: Partial<RatingScores>): s is RatingScores {
  return RATING_CRITERIA.every((c) => isValidScore(s[c.key]));
}

/** Overall = rounded mean of the four criteria (matches the spec's formula). */
export function computeOverallRating(s: RatingScores): number {
  return Math.round(
    (s.rigor + s.innovation + s.impact + s.presentation) / 4
  );
}

/**
 * Mean of the `overall` values across all reviewers of a project, to 2 dp —
 * this is what lands in projects.academic_rating_avg.
 */
export function averageOverall(overalls: readonly number[]): number {
  if (overalls.length === 0) return 0;
  const mean = overalls.reduce((a, b) => a + b, 0) / overalls.length;
  return Math.round(mean * 100) / 100;
}

// Re-export so UI code has a single import surface for rating logic.
export { RATING_SCORE } from "./constants";

// ─────────────────────────────────────────────────────────────────────────────
// 3. The 4-Lane Reviewer Feed
// ─────────────────────────────────────────────────────────────────────────────

/** Normalized project for lane bucketing. `vqScore` is the EFFECTIVE score
 *  (raw VQ with the 1.1× academic multiplier already applied). */
export interface FeedProject {
  id: string;
  title: string;
  category: string | null;
  studentAge: number | null; // null when author age isn't queryable
  vqScore: number;
  academicallyReviewed: boolean;
  status?: string | null;
  alreadyRatedByMe?: boolean;
}

export type LaneId = "expertise" | "junior" | "senior" | "elite";

export interface ReviewerLane {
  id: LaneId;
  title: string;
  subtitle: string;
  projects: FeedProject[];
}

function inBand(age: number | null, band: { MIN: number; MAX: number }): boolean {
  return age !== null && age >= band.MIN && age <= band.MAX;
}

/**
 * Assigns feed projects into the four review lanes. A project may appear in
 * more than one lane (e.g. a 16-year-old's elite project) — that is by
 * design: lanes are lenses, not partitions.
 */
export function assignToLanes(
  projects: readonly FeedProject[],
  expertise: readonly string[]
): ReviewerLane[] {
  const wanted = new Set(expertise.map((e) => e.trim().toLowerCase()));

  return [
    {
      id: "expertise",
      title: "Expertise Matches",
      subtitle: "Aligned with your declared domains",
      projects: projects.filter(
        (p) => p.category !== null && wanted.has(p.category.toLowerCase())
      ),
    },
    {
      id: "junior",
      title: `Junior Lane (${JUNIOR_AGE_BAND.MIN}–${JUNIOR_AGE_BAND.MAX})`,
      subtitle: "Young researchers — coach, don't just score",
      projects: projects.filter((p) => inBand(p.studentAge, JUNIOR_AGE_BAND)),
    },
    {
      id: "senior",
      title: `Senior Lane (${SENIOR_AGE_BAND.MIN}–${SENIOR_AGE_BAND.MAX})`,
      subtitle: "Pre-collegiate researchers, full academic bar",
      projects: projects.filter((p) => inBand(p.studentAge, SENIOR_AGE_BAND)),
    },
    {
      id: "elite",
      title: "Elite Candidates",
      subtitle: `Effective VQ above ${ELITE_VQ_THRESHOLD} (post-multiplier)`,
      projects: projects.filter((p) => p.vqScore > ELITE_VQ_THRESHOLD),
    },
  ];
}
