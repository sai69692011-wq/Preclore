// src/app/dashboard/reviewer/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Reviewer Dashboard — the 4-Lane Feed.
//   Expertise Matches · Junior Lane (10–14) · Senior Lane (15–20) ·
//   Elite Candidates (effective VQ > 850, post 1.1× multiplier)
// Server component: all data arrives pre-bucketed from the pure
// assignToLanes() in src/lib/review-pipeline.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { assignToLanes, type FeedProject } from "@/lib/review-pipeline";
import { getEffectiveVqScore } from "@/lib/vq-engine";

export const metadata: Metadata = { title: "Reviewer Dashboard" };

const PROJECT_FIELDS =
  "id, title, category, status, vq_score, academic_rating_avg, academic_review_count";

export default async function ReviewerDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Shell>
        <h1 style={{ fontSize: 24 }}>Reviewer Dashboard</h1>
        <p style={{ color: "#94a3b8" }}>
          Please sign in — then <a href="/auth/reviewer" style={{ color: "#a5b4fc" }}>apply for reviewer access</a>.
        </p>
      </Shell>
    );
  }

  const { data: reviewer } = await supabase
    .from("reviewers")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!reviewer) {
    return (
      <Shell>
        <h1 style={{ fontSize: 24 }}>Reviewer Dashboard</h1>
        <p style={{ color: "#94a3b8" }}>
          No reviewer profile found.{" "}
          <a href="/auth/reviewer" style={{ color: "#a5b4fc" }}>Start faculty onboarding →</a>
        </p>
      </Shell>
    );
  }

  // ── Feed query ────────────────────────────────────────────────────────────
  // NOTE: the age lanes need the author's age, assumed here as an embeddable
  // `users(age)` relation (projects.user_id → users.id). If your schema names
  // these differently, adjust this one select — everything downstream adapts.
  let rows: any[] = [];
  let agesAvailable = true;

  const withAuthors = await supabase
    .from("projects")
    .select(`${PROJECT_FIELDS}, users(age, full_name)`)
    .order("vq_score", { ascending: false })
    .limit(100);

  if (withAuthors.error) {
    // Graceful fallback: age lanes will be empty, everything else still works.
    console.warn("[reviewer-feed] author embed failed:", withAuthors.error.message);
    agesAvailable = false;
    const plain = await supabase
      .from("projects")
      .select(PROJECT_FIELDS)
      .order("vq_score", { ascending: false })
      .limit(100);
    rows = plain.data ?? [];
  } else {
    rows = withAuthors.data ?? [];
  }

  const { data: myRatings } = await supabase
    .from("project_ratings")
    .select("project_id")
    .eq("reviewer_id", user.id);
  const ratedByMe = new Set((myRatings ?? []).map((r) => r.project_id));

  const feedProjects: FeedProject[] = rows.map((p) => {
    const author = Array.isArray(p.users) ? p.users[0] : p.users;
    const academicallyReviewed = (p.academic_review_count ?? 0) > 0;
    return {
      id: p.id,
      title: p.title ?? "Untitled project",
      category: p.category ?? null,
      studentAge: author?.age ?? null,
      vqScore: getEffectiveVqScore({
        vq_score: p.vq_score ?? 0,
        academicallyReviewed,
        academicRatingAvg: p.academic_rating_avg ?? 0,
      }),
      academicallyReviewed,
      status: p.status ?? null,
      alreadyRatedByMe: ratedByMe.has(p.id),
    };
  });

  const lanes = assignToLanes(feedProjects, reviewer.expertise ?? []);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Shell>
      <header style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#818cf8", margin: "0 0 8px" }}>
          Academic Reviewer Pipeline
        </p>
        <h1 style={{ margin: "0 0 8px", fontSize: 28 }}>
          Welcome, {reviewer.name ?? "Reviewer"}
          {reviewer.is_verified ? (
            <Badge color="#22c55e">✓ Verified</Badge>
          ) : (
            <Badge color="#f59e0b">Verification pending</Badge>
          )}
        </h1>
        <p style={{ margin: 0, fontSize: 14, color: "#94a3b8" }}>
          {reviewer.institution} · {(reviewer.expertise ?? []).join(", ") || "no expertise set"}
        </p>
        {!reviewer.is_verified && (
          <p style={{ fontSize: 13, color: "#fbbf24", marginTop: 8 }}>
            Rating unlocks once an admin verifies your institutional standing.
          </p>
        )}
        {!agesAvailable && (
          <p style={{ fontSize: 13, color: "#f87171", marginTop: 8 }}>
            Author ages unavailable — Junior/Senior lanes need the users(age)
            relation. See the comment in this file.
          </p>
        )}
      </header>

      <div style={{ display: "grid", gap: 32 }}>
        {lanes.map((lane) => (
          <section key={lane.id}>
            <h2 style={{ margin: "0 0 4px", fontSize: 18 }}>
              {lane.title}{" "}
              <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400 }}>
                ({lane.projects.length})
              </span>
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#64748b" }}>{lane.subtitle}</p>

            {lane.projects.length === 0 ? (
              <p style={{ fontSize: 14, color: "#475569", fontStyle: "italic" }}>
                No projects in this lane right now.
              </p>
            ) : (
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }}>
                {lane.projects.map((p) => (
                  <a
                    key={`${lane.id}-${p.id}`}
                    href={`/reviewer/projects/${p.id}`}
                    style={{
                      minWidth: 260,
                      maxWidth: 260,
                      textDecoration: "none",
                      color: "inherit",
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 12,
                      padding: 16,
                      display: "block",
                    }}
                  >
                    <strong style={{ display: "block", fontSize: 14, marginBottom: 6 }}>
                      {p.title}
                    </strong>
                    <span style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 10 }}>
                      {p.category ?? "General"}
                      {p.studentAge !== null && ` · age ${p.studentAge}`}
                    </span>
                    <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge color="#818cf8">VQ {p.vqScore}</Badge>
                      {p.academicallyReviewed && <Badge color="#f59e0b">1.1×</Badge>}
                      {p.alreadyRatedByMe && <Badge color="#22c55e">Reviewed ✓</Badge>}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
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
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>{children}</div>
    </main>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 999,
        marginLeft: 8,
        color,
        border: `1px solid ${color}`,
        background: "transparent",
      }}
    >
      {children}
    </span>
  );
}

export const dynamic = "force-dynamic";
