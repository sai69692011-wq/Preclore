// src/lib/jury.ts
// ─────────────────────────────────────────────────────────────────────────────
// Shadow Jury v1 — pure similarity-highlight logic for the side-by-side
// comparison view. The Semantic Plagiarism Layer decides WHAT matched; this
// module only helps a human juror SEE the overlap.
// ─────────────────────────────────────────────────────────────────────────────

/** Common English stopwords — excluded so highlights show real overlap.
 *  (exported for the Semantic Plagiarism Layer, which tokenizes on the same
 *  vocabulary so jury highlighting matches what the scanner measured) */
export const STOPWORDS = new Set([
  "about", "above", "after", "again", "against", "along", "among", "because",
  "before", "being", "below", "between", "could", "during", "every", "from",
  "have", "into", "other", "over", "same", "should", "some", "such", "than",
  "that", "their", "them", "then", "there", "these", "they", "this", "those",
  "through", "under", "until", "very", "what", "when", "where", "which",
  "while", "with", "within", "would",
]);

const WORD_RE = /[A-Za-z][A-Za-z'-]{3,}/g;

/** Normalized significant tokens of a text (lowercase, ≥5 chars, no stopwords). */
function significantTokens(text: string): string[] {
  return (text.toLowerCase().match(WORD_RE) ?? [])
    .filter((w) => w.length >= 5 && !STOPWORDS.has(w));
}

/**
 * Case-insensitive terms appearing in BOTH texts — the highlight set.
 * Capped at 60 so enormous overlaps stay renderable.
 */
export function findSharedTerms(a: string, b: string, cap = 60): Set<string> {
  const setB = new Set(significantTokens(b));
  const shared = new Set<string>();
  for (const w of significantTokens(a)) {
    if (setB.has(w)) shared.add(w);
    if (shared.size >= cap) break;
  }
  return shared;
}

export interface HighlightPart {
  text: string;
  /** true when this segment is one of the shared terms. */
  hit: boolean;
}

/**
 * Splits a text into clickable-sized segments marking shared terms.
 * Matching is whole-word on the LOWERCASED token, so the original casing is
 * preserved in the output segment.
 */
export function highlightParts(text: string, terms: Set<string>): HighlightPart[] {
  if (terms.size === 0 || !text) return [{ text, hit: false }];

  const parts: HighlightPart[] = [];
  let last = 0;
  for (const m of text.matchAll(WORD_RE)) {
    const idx = m.index ?? 0;
    if (idx > last) parts.push({ text: text.slice(last, idx), hit: false });
    parts.push({ text: m[0], hit: terms.has(m[0].toLowerCase()) });
    last = idx + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false });
  return parts;
}

/** Whole-paper convenience: shared terms across problem + solution of both. */
export function compareProjects(
  a: { problem?: string | null; solution?: string | null },
  b: { problem?: string | null; solution?: string | null }
): Set<string> {
  return findSharedTerms(
    `${a.problem ?? ""}\n${a.solution ?? ""}`,
    `${b.problem ?? ""}\n${b.solution ?? ""}`
  );
}
