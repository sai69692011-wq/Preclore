// src/lib/plagiarism.ts
// ─────────────────────────────────────────────────────────────────────────────
// Semantic Plagiarism Layer v1 — TF-IDF + Cosine Similarity.
// Pure: no I/O. The scanner action (src/app/actions/integrity.ts) supplies
// texts; this module owns the math, so scores are deterministic and testable.
// Shares its stopword vocabulary with the Shadow Jury highlighter
// (src/lib/jury.ts) — what the scanner flags is what the juror sees marked.
// ─────────────────────────────────────────────────────────────────────────────

import { STOPWORDS } from "./jury";
import { PLAGIARISM_THRESHOLDS } from "./constants";

export { PLAGIARISM_THRESHOLDS } from "./constants";

const WORD_RE = /[A-Za-z][A-Za-z'-]{2,}/g;

/** Lowercase, stopword-free tokens; shorter floor (4 chars) than jury
 *  highlighting so mid-length terms still contribute to the vector. */
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(WORD_RE) ?? []).filter(
    (w) => w.length >= 4 && !STOPWORDS.has(w)
  );
}

/** Sublinear term frequency: 1 + ln(count) — repeated terms help, but with
 *  diminishing returns so padded text can't brute-force similarity. */
function termFrequencies(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  const tf = new Map<string, number>();
  for (const [t, c] of counts) tf.set(t, 1 + Math.log(c));
  return tf;
}

type Vector = Map<string, number>;

/** Smoothed IDF over the corpus (candidate included): ln((1+N)/(1+df)) + 1. */
function buildVectors(tokenizedDocs: string[][]): Vector[] {
  const n = tokenizedDocs.length;
  const df = new Map<string, number>();
  for (const doc of tokenizedDocs) {
    for (const term of new Set(doc)) df.set(term, (df.get(term) ?? 0) + 1);
  }
  const idf = (t: string) => Math.log((1 + n) / (1 + (df.get(t) ?? 0))) + 1;

  return tokenizedDocs.map((doc) => {
    const v: Vector = new Map();
    for (const [t, tf] of termFrequencies(doc)) v.set(t, tf * idf(t));
    return v;
  });
}

/** Cosine similarity, iterating the smaller vector for the dot product. */
export function cosineSimilarity(a: Vector, b: Vector): number {
  if (a.size === 0 || b.size === 0) return 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [t, w] of small) dot += w * (big.get(t) ?? 0);
  const mag = (v: Vector) =>
    Math.sqrt([...v.values()].reduce((s, w) => s + w * w, 0));
  const denom = mag(a) * mag(b);
  return denom === 0 ? 0 : dot / denom;
}

export type SimilarityVerdict = "clear" | "flagged" | "blocked";

/** > 0.75 blocked · ≥ 0.55 flagged · otherwise clear (spec bands). */
export function classifySimilarity(score: number): SimilarityVerdict {
  if (score > PLAGIARISM_THRESHOLDS.BLOCK) return "blocked";
  if (score >= PLAGIARISM_THRESHOLDS.FLAG) return "flagged";
  return "clear";
}

export interface CorpusDoc {
  id: string;
  text: string;
}

export interface ScanResult {
  /** Closest corpus document; null when the corpus is empty. */
  bestMatchId: string | null;
  /** Cosine similarity of the best match, 0..1 (rounded to 3 dp). */
  score: number;
  verdict: SimilarityVerdict;
  /** Top 3 closest matches, for the Jury's context. */
  ranking: { id: string; score: number }[];
}

/**
 * Scans a candidate text against the corpus. The candidate participates in
 * the IDF stats (standard for one-off scans), so rare shared terms weigh more.
 */
export function scanCandidate(
  candidateText: string,
  corpus: readonly CorpusDoc[]
): ScanResult {
  const docs = [candidateText, ...corpus.map((d) => d.text)].map(tokenize);
  const [candidateVec, ...corpusVecs] = buildVectors(docs);

  const ranking = corpus
    .map((d, i) => ({
      id: d.id,
      score: cosineSimilarity(candidateVec, corpusVecs[i]),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((r) => ({ id: r.id, score: Math.round(r.score * 1000) / 1000 }));

  const best = ranking[0] ?? null;
  const score = best?.score ?? 0;

  return {
    bestMatchId: best?.id ?? null,
    score,
    verdict: classifySimilarity(score),
    ranking,
  };
}
