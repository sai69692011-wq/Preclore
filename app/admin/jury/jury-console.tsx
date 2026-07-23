// src/app/admin/jury/jury-console.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Interactive juror console (client): flagged queue on the left, side-by-side
// comparison with shared-term highlighting, Approve/Reject verdicts with an
// optional juror note. Verdicts run through server actions that re-check the
// admin tier and log to content_violations.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { compareProjects, highlightParts } from "@/lib/jury";
import { resolveFlag, type ResolveResult } from "./actions";

export interface ComparedProject {
  id: string;
  title: string;
  problem: string;
  solution: string;
  authorName: string;
  createdAt: string;
}

export interface FlaggedProject extends ComparedProject {
  category: string | null;
  similarity: number | null;
  matched: ComparedProject | null;
}

const MARK = { background: "rgba(245, 158, 11, 0.32)", borderRadius: 3, padding: "0 1px" } as const;

export function JuryConsole({ flagged }: { flagged: FlaggedProject[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(flagged[0]?.id ?? null);
  const [note, setNote] = useState("");
  const [verdict, setVerdict] = useState<ResolveResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selected = flagged.find((p) => p.id === selectedId) ?? null;

  // Shared-term highlight set, recomputed when the selection changes.
  const shared = useMemo(
    () =>
      selected?.matched
        ? compareProjects(
            { problem: selected.problem, solution: selected.solution },
            { problem: selected.matched.problem, solution: selected.matched.solution }
          )
        : new Set<string>(),
    [selected]
  );

  function decide(decision: "approved" | "rejected") {
    if (!selected) return;
    startTransition(async () => {
      const res = await resolveFlag(selected.id, decision, note.trim() || null);
      setVerdict(res);
      if (res.ok) {
        setNote("");
        router.refresh(); // resolved project leaves the queue
        const next = flagged.find((p) => p.id !== selected.id);
        setSelectedId(next?.id ?? null);
      }
    });
  }

  if (flagged.length === 0) {
    return (
      <p style={{ color: "#64748b", fontStyle: "italic" }}>
        Queue clear — nothing flagged. The Quality Seal holds. 🛡
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", gap: 24 }}>
      {/* ── Queue ── */}
      <aside style={{ display: "grid", gap: 10, alignContent: "start" }}>
        <h2 style={{ fontSize: 14, color: "#94a3b8", margin: "0 0 4px" }}>Flagged queue</h2>
        {flagged.map((p) => {
          const active = p.id === selectedId;
          return (
            <button
              key={p.id}
              onClick={() => { setSelectedId(p.id); setVerdict(null); setNote(""); }}
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 10,
                cursor: "pointer",
                border: `1px solid ${active ? "#f59e0b" : "#263349"}`,
                background: active ? "rgba(245,158,11,0.08)" : "#111a2b",
                color: "#e2e8f0",
              }}
            >
              <strong style={{ display: "block", fontSize: 13, marginBottom: 4 }}>{p.title}</strong>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {p.authorName}
                {p.similarity !== null && (
                  <span style={{ color: p.similarity >= 0.8 ? "#f87171" : "#fbbf24" }}>
                    {" "}· {(p.similarity * 100).toFixed(0)}% match
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </aside>

      {/* ── Comparison chamber ── */}
      {selected && (
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, margin: 0, flex: 1 }}>
              Side-by-side comparison
              {selected.similarity !== null && (
                <span style={{ fontSize: 13, color: "#fbbf24", marginLeft: 10 }}>
                  similarity {(selected.similarity * 100).toFixed(1)}%
                </span>
              )}
            </h2>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {shared.size} shared terms highlighted
            </span>
          </div>

          {!selected.matched ? (
            <p style={{ fontSize: 13, color: "#94a3b8", background: "#111a2b", border: "1px solid #263349", borderRadius: 10, padding: 16 }}>
              The plagiarism layer flagged this project but recorded no matched
              original. Rule on the evidence available.
            </p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <Panel label="Flagged submission" tone="#f87171" project={selected} shared={shared} />
              <Panel label="Matched original" tone="#4ade80" project={selected.matched} shared={shared} />
            </div>
          )}

          {/* Verdict controls */}
          <div style={{ marginTop: 18, background: "#111a2b", border: "1px solid #263349", borderRadius: 12, padding: 18 }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="Juror note (optional — logged with the verdict)…"
              style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #334155", background: "#0b1220", color: "#e2e8f0", fontSize: 13, resize: "vertical" }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button
                onClick={() => decide("approved")}
                disabled={isPending}
                style={verdictBtn("#14532d", "#4ade80")}
              >
                {isPending ? "Ruling…" : "✓ Approve — clear the flag"}
              </button>
              <button
                onClick={() => decide("rejected")}
                disabled={isPending}
                style={verdictBtn("#7f1d1d", "#f87171")}
              >
                {isPending ? "Ruling…" : "✗ Reject — plagiarism confirmed"}
              </button>
            </div>
            {verdict && !verdict.ok && (
              <p style={{ fontSize: 13, color: "#f87171", margin: "10px 0 0" }}>{verdict.error}</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function verdictBtn(bg: string, border: string): React.CSSProperties {
  return {
    padding: "10px 18px",
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: bg,
    color: "#f1f5f9",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };
}

function Panel({
  label,
  tone,
  project,
  shared,
}: {
  label: string;
  tone: string;
  project: ComparedProject;
  shared: Set<string>;
}) {
  return (
    <article style={{ background: "#111a2b", border: `1px solid #263349`, borderTop: `3px solid ${tone}`, borderRadius: 12, padding: 18 }}>
      <header style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: tone, margin: "0 0 6px" }}>{label}</p>
        <h3 style={{ fontSize: 15, margin: "0 0 4px" }}>{project.title}</h3>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>{project.authorName}</p>
      </header>
      <Field heading="Problem" text={project.problem} shared={shared} />
      <Field heading="Solution" text={project.solution} shared={shared} />
    </article>
  );
}

function Field({ heading, text, shared }: { heading: string; text: string; shared: Set<string> }) {
  if (!text) return null;
  const parts = highlightParts(text, shared);
  return (
    <div style={{ marginBottom: 12 }}>
      <h4 style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 4px" }}>{heading}</h4>
      <p style={{ fontSize: 13, lineHeight: 1.65, margin: 0, whiteSpace: "pre-line", maxHeight: 220, overflow: "auto" }}>
        {parts.map((p, i) => (p.hit ? <mark key={i} style={MARK}>{p.text}</mark> : <span key={i}>{p.text}</span>))}
      </p>
    </div>
  );
}
