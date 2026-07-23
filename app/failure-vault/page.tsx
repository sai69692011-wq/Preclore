// src/app/failure-vault/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The Failure Vault — where logged failures pay +200 Resilience Points.
// Server shell: loads the student's projects (for the selector) and renders
// the interactive reflection form. Warm Academic Pastel Peach (#FFDAB9)
// signals growth through struggle.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import { ReflectionForm } from "./reflection-form";

export const metadata: Metadata = {
  title: "The Failure Vault — Preclore",
  description: "Log a failed implementation, reflect rigorously, earn Resilience Points.",
};

const PEACH = "#FFDAB9";

export default async function FailureVaultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ASSUMPTION: projects.user_id is the owner column (consistent with the
  // platform's RLS patterns). If the query fails (anonymous / schema
  // mismatch), the form still works via its free-text title fallback.
  let projects: { id: string; title: string }[] = [];
  let points = 0;

  if (user) {
    const [{ data: projRows }, { data: pointRow }] = await Promise.all([
      supabase
        .from("projects")
        .select("id, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("user_points")
        .select("resilience_points")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    projects = (projRows ?? []).map((p) => ({
      id: p.id,
      title: p.title ?? "Untitled project",
    }));
    points = pointRow?.resilience_points ?? 0;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#fff8f2",
        color: "#3d2b1f",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "56px 24px 96px",
      }}
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 36 }}>
          <p
            style={{
              display: "inline-block",
              fontSize: 12,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#b4551f",
              background: PEACH,
              borderRadius: 999,
              padding: "6px 16px",
              margin: "0 0 16px",
            }}
          >
            The Failure Vault
          </p>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 36,
              fontWeight: 400,
              margin: "0 0 10px",
            }}
          >
            Failure is tuition, not defeat.
          </h1>
          <p style={{ fontSize: 15, color: "#8a6f5c", margin: 0, lineHeight: 1.6 }}>
            Log what broke, reflect in depth, and earn{" "}
            <strong style={{ color: "#b4551f" }}>+200 Resilience Points</strong>.
            Rigor is the price of the badge — 200 words minimum per section.
          </p>
          {user && (
            <p style={{ fontSize: 13, color: "#b4551f", marginTop: 12 }}>
              Your resilience balance: <strong>{points.toLocaleString()} pts</strong>
            </p>
          )}
        </header>

        {user ? (
          <ReflectionForm projects={projects} />
        ) : (
          <p style={{ textAlign: "center", color: "#8a6f5c" }}>
            Sign in to log a failure and claim your Resilience Points.
          </p>
        )}
      </div>
    </main>
  );
}

export const dynamic = "force-dynamic";
