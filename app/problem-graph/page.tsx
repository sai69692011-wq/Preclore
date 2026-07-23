// src/app/problem-graph/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The Problem Graph — how research connects. Server shell: loads graph nodes
// and edges, builds the clean thresholded graph via the pure buildGraph(),
// and hands it to the client canvas running d3-force.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { buildGraph, type GraphNodeDatum, type GraphEdgeDatum } from "@/lib/problem-graph";
import { GraphCanvas } from "./graph-canvas";

export const metadata: Metadata = {
  title: "Problem Graph — Preclore",
  description: "See how research projects connect, and find collaborators working on similar problems.",
};

export default async function ProblemGraphPage() {
  const supabase = await createClient();

  const [{ data: nodeRows, error: nErr }, { data: edgeRows, error: eErr }] =
    await Promise.all([
      supabase
        .from("problem_graph_nodes")
        .select("project_id, category, projects(title)")
        .limit(150),
      supabase
        .from("problem_graph_edges")
        .select("source_project_id, target_project_id, similarity_score")
        .limit(500),
    ]);

  if (nErr) console.warn("[problem-graph] nodes failed:", nErr.message);
  if (eErr) console.warn("[problem-graph] edges failed:", eErr.message);

  const nodes: GraphNodeDatum[] = (nodeRows ?? []).map((n: any) => {
    const proj = Array.isArray(n.projects) ? n.projects[0] : n.projects;
    return {
      id: n.project_id,
      title: proj?.title ?? "Untitled project",
      category: n.category ?? null,
    };
  });

  const edges: GraphEdgeDatum[] = (edgeRows ?? []).map((e: any) => ({
    source: e.source_project_id,
    target: e.target_project_id,
    similarity: e.similarity_score ?? 0,
  }));

  const graph = buildGraph(nodes, edges);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf6ef",
        color: "#292524",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "56px 24px 72px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 28 }}>
          <p style={{ fontSize: 12, letterSpacing: "0.3em", textTransform: "uppercase", color: "#9a6b3f", margin: "0 0 10px" }}>
            The Connectivity Layer
          </p>
          <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 38, fontWeight: 400, margin: "0 0 10px" }}>
            The Problem Graph
          </h1>
          <p style={{ fontSize: 15, color: "#78716c", margin: 0 }}>
            {graph.nodes.length} projects, {graph.links.length} connections stronger
            than 0.4 similarity. Click a node to meet a potential collaborator.
          </p>
        </header>

        {graph.nodes.length === 0 ? (
          <p style={{ textAlign: "center", color: "#a8a29e", fontStyle: "italic" }}>
            Not enough connected research yet — as more projects publish, the
            graph will weave itself.
          </p>
        ) : (
          <GraphCanvas nodes={graph.nodes} links={graph.links} />
        )}
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
