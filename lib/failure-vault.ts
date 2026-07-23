// src/lib/failure-vault.ts
// ─────────────────────────────────────────────────────────────────────────────
// Failure Vault v1 — pure reflection logic. Word counting and validation live
// here (not in the form) so they are unit-testable and enforced identically
// client-side (UX) and server-side (enforcement).
// ─────────────────────────────────────────────────────────────────────────────

import { REFLECTION_MIN_WORDS } from "./constants";

export { REFLECTION_MIN_WORDS, RESILIENCE_POINTS_AWARD } from "./constants";

export type ReflectionSectionKey =
  | "whatWentWrong"
  | "lessonsLearned"
  | "doDifferently";

export interface ReflectionSection {
  key: ReflectionSectionKey;
  label: string;
  hint: string;
}

/** The three reflection prompts, in display order — the form renders from this. */
export const REFLECTION_SECTIONS: readonly ReflectionSection[] = [
  {
    key: "whatWentWrong",
    label: "What went wrong?",
    hint: "Describe the failure honestly — what broke, when, and why you think it happened.",
  },
  {
    key: "lessonsLearned",
    label: "What did you learn?",
    hint: "What did the failure teach you about the problem, the users, or your method?",
  },
  {
    key: "doDifferently",
    label: "What would you do differently?",
    hint: "Be concrete: what will you change in your next attempt?",
  },
] as const;

export type ReflectionInput = Record<ReflectionSectionKey, string>;

/** Whitespace-tokenized word count; newlines and stray spaces don't inflate it. */
export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface SectionValidation {
  key: ReflectionSectionKey;
  words: number;
  /** words >= REFLECTION_MIN_WORDS */
  valid: boolean;
  /** 0..1 progress toward the minimum, for the UI progress bar. */
  progress: number;
}

export interface ReflectionValidation {
  sections: SectionValidation[];
  /** True only when ALL three sections meet the 200-word minimum. */
  valid: boolean;
  totalWords: number;
}

export function validateReflection(input: ReflectionInput): ReflectionValidation {
  const sections = REFLECTION_SECTIONS.map(({ key }) => {
    const words = countWords(input[key] ?? "");
    return {
      key,
      words,
      valid: words >= REFLECTION_MIN_WORDS,
      progress: Math.min(1, words / REFLECTION_MIN_WORDS),
    };
  });
  return {
    sections,
    valid: sections.every((s) => s.valid),
    totalWords: sections.reduce((n, s) => n + s.words, 0),
  };
}
