// src/app/research/published/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The Preclore Research Journal — public feed.
// Server component: fetches the published window and hands normalized papers
// to the interactive JournalBrowser (keyword search + impact sorting happen
// client-side for instant response). Print-inspired "journal" aesthetic —
// cream paper, serif display type, warm pastel accents.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import type { PublishedPaper } from "@/lib/journal";
import { JournalBrowser } from "./journal-browser";

export const metadata: Metadata = {
  title: "Preclore Research Journal — Published Research",
  description:
    "The public gallery of student research: peer-style papers, citations, and impact metrics.",
};

export default async function PublishedResearchPage() {
  const supabase = await createClient();

  // NOTE: assumes projects(user_id → users.id) is embeddable and projects has
  // vq_score/city columns, per the pre-existing feed logic. Adjust the select
  // strings if your schema differs — normalization below isolates the rest.
  const { data, error } = await supabase
    .from("published_research")
    .select("*, projects(title, vq_score, city, users(name))")
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50);

  if (error) {
    console.warn("[journal] fetch failed:", error.message);
  }

  const papers: PublishedPaper[] = (data ?? []).map((row: any) => {
    const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
    const author = Array.isArray(project?.users) ? project.users[0] : project?.users;
    return {
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
  });

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf6ef", // cream paper
        color: "#292524",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "56px 24px 96px",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        {/* Masthead */}
        <header
          style={{
            borderBottom: "3px double #d6c7b2",
            paddingBottom: 24,
            marginBottom: 32,
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 12,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "#9a6b3f",
              margin: "0 0 10px",
            }}
          >
            Volume 1 · 2026 Edition
          </p>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontStyle: "italic",
              fontSize: 44,
              fontWeight: 400,
              color: "#364152",
              margin: 0,
            }}
          >
            Preclore Research Journal
          </h1>
          <p style={{ fontSize: 15, color: "#78716c", margin: "10px 0 0" }}>
            High-rigor research by young investigators — read, cited, and built
            upon in public.
          </p>
        </header>

        <JournalBrowser papers={papers} />
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
