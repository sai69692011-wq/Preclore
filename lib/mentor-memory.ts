// src/lib/mentor-memory.ts
// ─────────────────────────────────────────────────────────────────────────────
// The "Advisor" Layer v1 — Mentor Memory & Personalization
//
// Server-side only: greetings and streaks are computed here (not in the
// client bundle) so personalization is consistent, cache-safe, and
// tamper-proof.
//
// Data sources (see supabase/migration.sql):
//   mentor_memory(user_id, selected_mentor, projects_completed, last_active)
//   streaks(user_id, current_streak, longest_streak, last_active_date)
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from "./supabase-server";

/** Camel-case shape handed to the UI — no DB column names leak upward. */
export interface MentorMemory {
  /** Completed projects — drives the greeting tiers. */
  projects: number;
  /** Current consecutive-day streak — drives 🔥 fire mode at ≥ 7. */
  streak: number;
  longestStreak: number;
  /** Selected advisor id, e.g. "vyrn". */
  mentor: string;
  lastActive: string | null;
}

/** Streak length at which the 🔥 "legendary" state activates (rule 3). */
export const FIRE_STREAK_THRESHOLD = 7;

/**
 * Greeting copy, centralized so swapping wording is a one-line change.
 *
 * NOTE — the master prompt's literal strings differ slightly from the
 * "Required Code" strings. This file implements the Required Code; the
 * prompt variants are kept here as comments — swap either in if preferred:
 *   tier "second":     "Great to see you again! Ready for project #2?"
 *   tier "fireStreak": "You're on a {streak}-day streak! You're on fire! 🔥"
 */
export const MENTOR_GREETINGS = {
  /** Rule 1 — brand-new researcher (0 projects, or no memory row yet). */
  firstVisit: "Welcome, researcher. Let's start your first interview.",
  /** Rule 2 — exactly one project completed. */
  secondProject: "Great work on project #1! Ready to find a new problem?",
  /** 2+ projects. */
  returning: (projects: number) =>
    `Welcome back! You've already documented ${projects} problems.`,
  /** Rule 3 — appended (never replaces) when streak ≥ 7. */
  fireStreak: (streak: number) => `\n\nYour ${streak}-day streak is legendary! 🔥`,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Fetch
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads the mentor memory for a user, joining their streak row.
 * Returns null for brand-new users or on failure — callers treat null as
 * "projects = 0" via the greeting rules, so the UI never breaks.
 */
export async function fetchUserMentorMemory(
  userId: string
): Promise<MentorMemory | null> {
  const supabase = await createClient();

  // Embed streaks via the 1:1 user_id relationship
  // (requires the streaks_mentor_memory_fkey constraint in migration.sql).
  const { data, error } = await supabase
    .from("mentor_memory")
    .select("*, streaks(current_streak, longest_streak)")
    .eq("user_id", userId)
    .single();

  if (error) {
    // PGRST116 = "Results contain 0 rows" — a brand-new researcher with no
    // mentor_memory row yet. That is an expected state, not a failure.
    if (error.code !== "PGRST116") {
      console.warn("[mentor-memory] fetch failed:", error.message);
    }
    return null;
  }

  // 1:1 because streaks.user_id is UNIQUE, but normalize defensively in
  // case PostgREST hands back a single-element array instead of an object.
  const streakRow = Array.isArray(data.streaks)
    ? data.streaks[0]
    : data.streaks;

  return {
    projects: data.projects_completed ?? 0,
    streak: streakRow?.current_streak ?? 0,
    longestStreak: streakRow?.longest_streak ?? 0,
    mentor: data.selected_mentor ?? "vyrn",
    lastActive: data.last_active ?? null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Greeting rules (pure — unit-testable)
// ─────────────────────────────────────────────────────────────────────────────

export function generatePersonalizedGreeting(
  memory: MentorMemory | null
): string {
  // Rule 1 — 0 projects (null memory counts as a first visit).
  if (!memory || memory.projects === 0)
    return MENTOR_GREETINGS.firstVisit;

  // Rules 2 / 2+.
  let greeting =
    memory.projects === 1
      ? MENTOR_GREETINGS.secondProject
      : MENTOR_GREETINGS.returning(memory.projects);

  // Rule 3 — fire-streak addendum.
  if (memory.streak >= FIRE_STREAK_THRESHOLD) {
    greeting += MENTOR_GREETINGS.fireStreak(memory.streak);
  }

  return greeting;
}

/**
 * Convenience one-liner combining fetch + generate — the function the
 * master prompt calls `getMentorGreeting`.
 */
export async function getMentorGreeting(userId: string): Promise<string> {
  return generatePersonalizedGreeting(await fetchUserMentorMemory(userId));
}

// ─────────────────────────────────────────────────────────────────────────────
// Floating-guide state (pure — drives the bottom-right Vyrn guide UI)
// ─────────────────────────────────────────────────────────────────────────────

export type MentorGuideMode = "new" | "second" | "veteran";

export interface MentorGuideState {
  /** Display name, e.g. "Vyrn". */
  mentorName: string;
  mode: MentorGuideMode;
  projects: number;
  streak: number;
  /** true at streak ≥ 7 — the guide shows its animated 🔥 state. */
  fireMode: boolean;
  /** Small chip under the greeting; null when there's nothing worth showing. */
  streakChip: string | null;
  /** CTA button label, tiered to nudge the next retention-driving action. */
  ctaLabel: string;
}

export function getMentorGuideState(
  memory: MentorMemory | null
): MentorGuideState {
  const projects = memory?.projects ?? 0;
  const streak = memory?.streak ?? 0;
  const mentorId = memory?.mentor ?? "vyrn";

  const mode: MentorGuideMode =
    projects === 0 ? "new" : projects === 1 ? "second" : "veteran";

  const fireMode = streak >= FIRE_STREAK_THRESHOLD;

  const streakChip = fireMode
    ? `🔥 ${streak}-day streak — you're on fire!`
    : streak >= 3
      ? `${streak}-day streak — ${FIRE_STREAK_THRESHOLD - streak} more day${
          FIRE_STREAK_THRESHOLD - streak === 1 ? "" : "s"
        } to fire mode`
      : null;

  const ctaLabel =
    mode === "new"
      ? "Start interview #1"
      : mode === "second"
        ? "Start project #2"
        : "Find a new problem";

  return {
    mentorName: mentorId.charAt(0).toUpperCase() + mentorId.slice(1),
    mode,
    projects,
    streak,
    fireMode,
    streakChip,
    ctaLabel,
  };
}
