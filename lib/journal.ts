// src/lib/journal.ts
// ─────────────────────────────────────────────────────────────────────────────
// Preclore Research Journal v1 — shared, pure logic.
// Citation formatting, keyword search, and impact sorting live here (not in
// the route files) so they are unit-testable and identical on every page.
// ─────────────────────────────────────────────────────────────────────────────

/** Normalized paper shape handed to the UI — no PostgREST embed leakage. */
export interface PublishedPaper {
  id: string;
  projectId: string | null;
  title: string;
  abstract: string | null;
  /** Display name; falls back to "Preclore Researcher" when unknown. */
  authorName: string;
  /** Publication year (from publishedAt) — used in citations. */
  year: number;
  city: string | null;
  vqScore: number;
  viewCount: number;
  citationCount: number;
  /** ISO timestamp. */
  publishedAt: string;
}

export const JOURNAL_NAME = "Preclore Research Journal";

// ─────────────────────────────────────────────────────────────────────────────
// Citation formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * APA-style author inversion: "Priya Sharma" → "Sharma, P.",
 * "Anika Rao Iyer" → "Iyer, A. R.", single names pass through ("Rao" → "Rao").
 * Multi-word surnames ("van der Berg") are treated naively — last word wins;
 * acceptable for a student journal, upgrade to a name parser if needed.
 */
export function toApaAuthor(fullName?: string | null): string {
  const name = (fullName ?? "").trim().replace(/\s+/g, " ");
  if (!name) return "Preclore Research Collective";
  // Smart casing: all-caps tokens ("ANIKA") are normalized to "Anika", while
  // mixed-case tokens ("McDonald") keep their internal capitals. Sloppy
  // lowercase input ("meera nair") still title-cases cleanly.
  const parts = name.split(" ").map((p) =>
    p.length > 1 && p === p.toUpperCase()
      ? p.charAt(0) + p.slice(1).toLowerCase()
      : p.charAt(0).toUpperCase() + p.slice(1)
  );
  if (parts.length === 1) return parts[0];
  const surname = parts[parts.length - 1];
  const initials = parts
    .slice(0, -1)
    .map((p) => `${p.charAt(0)}.`)
    .join(" ");
  return `${surname}, ${initials}`;
}

/**
 * Formal academic reference, e.g.:
 *   Rao, A. (2026). The 17-minute water walk. Preclore Research Journal.
 */
export function formatCitation(p: {
  authorName?: string | null;
  year: number;
  title: string;
}): string {
  // Strip trailing periods before joining — otherwise inverted authors
  // ("Rao, A.") and dotted titles produce "A.. (2026)" style double stops.
  const author = toApaAuthor(p.authorName).replace(/\.$/, "");
  const title = p.title.trim().replace(/\.$/, "");
  return `${author}. (${p.year}). ${title}. ${JOURNAL_NAME}.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyword search (client-side over the ≤50-paper window — instant, no index
// needed at this scale; move to Postgres FTS when the corpus outgrows it)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Tokenized AND search across title, abstract, author, and city.
 * "water chennai" matches only papers containing both tokens.
 */
export function searchPapers(
  papers: readonly PublishedPaper[],
  query: string
): PublishedPaper[] {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [...papers];

  return papers.filter((p) => {
    const haystack =
      `${p.title} ${p.abstract ?? ""} ${p.authorName} ${p.city ?? ""}`.toLowerCase();
    return tokens.every((t) => haystack.includes(t));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Impact sorting
// ─────────────────────────────────────────────────────────────────────────────

export type SortMode = "newest" | "views" | "citations";

export const SORT_MODES: readonly { id: SortMode; label: string }[] = [
  { id: "newest",    label: "Newest" },
  { id: "views",     label: "Most Viewed" },
  { id: "citations", label: "Most Cited" },
] as const;

/** Stable copy sort; impact modes tie-break by recency. */
export function sortPapers(
  papers: readonly PublishedPaper[],
  mode: SortMode
): PublishedPaper[] {
  const byNewest = (a: PublishedPaper, b: PublishedPaper) =>
    b.publishedAt.localeCompare(a.publishedAt);

  return [...papers].sort((a, b) => {
    if (mode === "views") return b.viewCount - a.viewCount || byNewest(a, b);
    if (mode === "citations")
      return b.citationCount - a.citationCount || byNewest(a, b);
    return byNewest(a, b);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Journal-level metrics (feed sidebar)
// ─────────────────────────────────────────────────────────────────────────────

export function journalTotals(papers: readonly PublishedPaper[]): {
  papers: number;
  views: number;
  citations: number;
} {
  return {
    papers: papers.length,
    views: papers.reduce((n, p) => n + p.viewCount, 0),
    citations: papers.reduce((n, p) => n + p.citationCount, 0),
  };
}

export function topCited(
  papers: readonly PublishedPaper[],
  n = 3
): PublishedPaper[] {
  return sortPapers(papers, "citations")
    .filter((p) => p.citationCount > 0)
    .slice(0, n);
}
