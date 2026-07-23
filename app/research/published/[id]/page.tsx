// src/app/research/published/[id]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Paper detail view — the "journal page" for a single published project.
// Server component: fetches the paper, formats the citation, and mounts two
// small client islands — ViewTracker (unique-reader counter) and CitationCard
// (copy citation + citation counter). Warm Academic Pastel sidebar holds the
// impact metrics.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { formatCitation, type PublishedPaper } from "@/lib/journal";
import { ViewTracker } from "./view-tracker";
import { CitationCard } from "./citation-card";

export const metadata: Metadata = { title: "Preclore Research Journal" };

const SERIF = "Georgia, 'Times New Roman', serif";

export default async function PublishedResearchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row, error } = await supabase
    .from("published_research")
    .select("*, projects(title, vq_score, city, users(name))")
    .eq("id", id)
    .eq("status", "published")
    .single();

  if (error || !row) {
    return (
      <main style={{ minHeight: "100vh", background: "#faf6ef", padding: "56px 24px", color: "#292524" }}>
        <p style={{ fontFamily: SERIF, fontSize: 22 }}>Paper not found.</p>
        <a href="/research/published" style={{ color: "#9a6b3f" }}>← Back to the journal</a>
      </main>
    );
  }

  const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
  const author = Array.isArray(project?.users) ? project.users[0] : project?.users;

  const paper: PublishedPaper = {
    id: row.id,
    projectId: row.project_id ?? null,
    title: row.title ?? project?.title ?? "Untitled paper",
    abstract: row.abstract ?? null,
    authorName: author?.name ?? "Preclore Researcher",
    year: new Date(row.published_at ?? Date.now()).getFullYear(),
    city: project?.city ?? null,
    vqScore: project?.vq_score ?? 0,
    viewCount: row.view_count ?? 0,
    citationCount: row.citation_count ?? 0,
    publishedAt: row.published_at ?? new Date(0).toISOString(),
  };

  const citation = formatCitation(paper);
  const publishedDate = new Date(paper.publishedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf6ef",
        color: "#292524",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "48px 24px 96px",
      }}
    >
      {/* Unique-reader counter — invisible client island */}
      <ViewTracker paperId={paper.id} />

      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <a href="/research/published" style={{ fontSize: 13, color: "#9a6b3f", textDecoration: "none" }}>
          ← Preclore Research Journal
        </a>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 300px",
            gap: 40,
            alignItems: "start",
            marginTop: 20,
          }}
        >
          {/* ── Article ──────────────────────────────────────────────────── */}
          <article>
            <h1
              style={{
                fontFamily: SERIF,
                fontSize: 38,
                fontWeight: 400,
                lineHeight: 1.2,
                margin: "0 0 12px",
              }}
            >
              {paper.title}
            </h1>
            <p style={{ fontSize: 14, color: "#9a6b3f", margin: "0 0 28px" }}>
              {paper.authorName}
              {paper.city ? ` · ${paper.city}` : ""} · Published {publishedDate}
            </p>

            {paper.abstract && (
              <section
                style={{
                  borderTop: "1px solid #d6c7b2",
                  borderBottom: "1px solid #d6c7b2",
                  padding: "20px 0",
                  marginBottom: 28,
                }}
              >
                <h2 style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 400, color: "#7c4a21", margin: "0 0 10px" }}>
                  Abstract
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.75, color: "#44403c", whiteSpace: "pre-line", margin: 0 }}>
                  {paper.abstract}
                </p>
              </section>
            )}

            {/* Seam: full paper body / figures can render here when the
                schema grows a `body` column. The abstract-only layout already
                satisfies the journal format. */}

            {paper.projectId && (
              <p style={{ fontSize: 13, color: "#a8a29e" }}>
                Derived from field project{" "}
                <code style={{ background: "#f3ece0", padding: "2px 6px", borderRadius: 4 }}>
                  {paper.projectId}
                </code>
              </p>
            )}
          </article>

          {/* ── Warm Academic Pastel sidebar ─────────────────────────────── */}
          <aside style={{ display: "grid", gap: 16, position: "sticky", top: 24 }}>
            <section
              style={{
                background: "#f7e7d3",
                border: "1px solid #ecd9bf",
                borderRadius: 14,
                padding: 20,
              }}
            >
              <h3 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 400, margin: "0 0 14px", color: "#7c4a21" }}>
                Impact Metrics
              </h3>
              <dl style={{ margin: 0, display: "grid", gap: 10 }}>
                <Metric label="Reads" value={paper.viewCount} />
                <Metric label="Citations" value={paper.citationCount} />
                {paper.vqScore > 0 && <Metric label="VQ score" value={paper.vqScore} />}
              </dl>
              <p style={{ fontSize: 12, color: "#a08060", margin: "14px 0 0" }}>
                Reads count each unique reader once.
              </p>
            </section>

            <CitationCard paperId={paper.id} citation={citation} />
          </aside>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <dt style={{ fontSize: 13, color: "#a08060" }}>{label}</dt>
      <dd style={{ margin: 0, fontFamily: SERIF, fontSize: 22, color: "#7c4a21" }}>
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

export const dynamic = "force-dynamic";
