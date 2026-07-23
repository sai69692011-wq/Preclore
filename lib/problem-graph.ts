// src/lib/problem-graph.ts
// ─────────────────────────────────────────────────────────────────────────────
// Problem Graph v1 — pure graph-building logic and the Warm Academic Pastel
// category palette. Physics (d3-force) lives in the canvas component; this
// module guarantees the DATA the layout receives is clean and thresholded.
// ─────────────────────────────────────────────────────────────────────────────

import { GRAPH_SIMILARITY_THRESHOLD } from "./constants";

export { GRAPH_SIMILARITY_THRESHOLD } from "./constants";

/**
 * Warm Academic Pastel node palette, keyed by lowercase category.
 * Spec mandates Water = Blue, Health = Pink; the rest extend the palette
 * in the same washed, paper-friendly register.
 */
export const CATEGORY_COLORS: Record<string, string> = {
  water: "#8fbde0",          // pastel blue (spec)
  health: "#f4a9c4",         // pastel pink (spec)
  agriculture: "#b5dba8",    // pastel green
  energy: "#f7d9a0",         // pastel amber
  waste: "#c9b6e2",          // pastel violet
  "air quality": "#a8dcd6",  // pastel teal
  mobility: "#f2b894",       // pastel orange
  education: "#f5e6a8",      // pastel yellow
  other: "#e2d8cb",          // warm neutral
};

export const DEFAULT_NODE_COLOR = "#e2d8cb";

export function colorForCategory(category: string | null | undefined): string {
  if (!category) return DEFAULT_NODE_COLOR;
  return CATEGORY_COLORS[category.trim().toLowerCase()] ?? DEFAULT_NODE_COLOR;
}

export interface GraphNodeDatum {
  /** project id */
  id: string;
  title: string;
  category: string | null;
}

export interface GraphEdgeDatum {
  source: string;
  target: string;
  similarity: number;
}

export interface BuiltGraph {
  nodes: GraphNodeDatum[];
  links: GraphEdgeDatum[];
}

/**
 * Builds the renderable graph:
 *  - keeps edges STRICTLY above the similarity threshold (spec: > 0.4),
 *  - drops dangling edges (endpoint missing from the node set),
 *  - dedupes mirror pairs (A→B and B→A collapse to one edge, max score wins).
 */
export function buildGraph(
  nodes: readonly GraphNodeDatum[],
  edges: readonly GraphEdgeDatum[],
  threshold = GRAPH_SIMILARITY_THRESHOLD
): BuiltGraph {
  const ids = new Set(nodes.map((n) => n.id));
  const seen = new Map<string, GraphEdgeDatum>();

  for (const e of edges) {
    if (e.similarity <= threshold) continue;
    if (!ids.has(e.source) || !ids.has(e.target)) continue;
    if (e.source === e.target) continue;

    const key = [e.source, e.target].sort().join("~");
    const prev = seen.get(key);
    if (!prev || e.similarity > prev.similarity) seen.set(key, e);
  }

  return { nodes: [...nodes], links: [...seen.values()] };
}

/** Each node's neighbors sorted by similarity — powers "potential collaborators". */
export function topNeighbors(
  nodeId: string,
  links: readonly GraphEdgeDatum[],
  n = 3
): { id: string; similarity: number }[] {
  return links
    .filter((l) => l.source === nodeId || l.target === nodeId)
    .map((l) => ({
      id: l.source === nodeId ? l.target : l.source,
      similarity: l.similarity,
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, n);
}
