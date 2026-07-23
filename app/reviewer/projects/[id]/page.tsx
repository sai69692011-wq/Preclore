// src/app/reviewer/projects/[id]/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Project review page — shows the project and mounts the multi-criteria
// rating form. Server component: resolves the reviewer, the project, and any
// existing rating by this reviewer (for edit-in-place via the upsert).
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { RatingForm } from "./rating-form";

export const metadata: Metadata = { title: "Rate Project" };

// Next.js 15: params is a Promise in async server components.
export default async function RateProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: reviewer }, { data: project }] = await Promise.all([
    user
      ? supabase.from("reviewers").select("*").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null } as const),
    supabase
      .from("projects")
      .select(
        "id, title, problem, solution, category, vq_score, academic_rating_avg, academic_review_count"
      )
      .eq("id", id)
      .single(),
  ]);

  const { data: existing } = user
    ? await supabase
        .from("project_ratings")
        .select("rigor, innovation, impact, presentation, overall, comment")
        .eq("reviewer_id", user.id)
        .eq("project_id", id)
        .maybeSingle()
    : { data: null };

  const canSubmit = reviewer?.is_verified === true;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        padding: "48px 24px",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#818cf8", margin: "0 0 8px" }}>
          Academic review
        </p>

        {project ? (
          <>
            <h1 style={{ margin: "0 0 12px", fontSize: 26 }}>{project.title}</h1>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px" }}>
              {project.category ?? "General"} · VQ {project.vq_score ?? 0}
              {(project.academic_review_count ?? 0) > 0 &&
                ` · ${project.academic_review_count} academic review(s), avg ${project.academic_rating_avg}`}
            </p>
            {project.problem && (
              <Section heading="Problem">{project.problem}</Section>
            )}
            {project.solution && (
              <Section heading="Solution">{project.solution}</Section>
            )}

            {!user || !reviewer ? (
              <p style={{ color: "#fbbf24", fontSize: 14 }}>
                Sign in as a registered reviewer to rate.{" "}
                <a href="/auth/reviewer" style={{ color: "#a5b4fc" }}>Faculty onboarding →</a>
              </p>
            ) : (
              <RatingForm
                projectId={id}
                initial={existing ?? null}
                canSubmit={canSubmit}
              />
            )}
          </>
        ) : (
          <p style={{ color: "#f87171" }}>Project not found.</p>
        )}
      </div>
    </main>
  );
}

function Section({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: 14, color: "#818cf8" }}>{heading}</h2>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-line" }}>{children}</p>
    </section>
  );
}

export const dynamic = "force-dynamic";
