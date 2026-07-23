// src/app/reviewer/projects/[id]/rating-form.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Multi-criteria academic rating form (client).
// Rigor / Innovation / Impact / Presentation → overall = rounded mean →
// server action upserts and recomputes the project's 1.1×-boosted VQ.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState, useTransition } from "react";
import {
  RATING_CRITERIA,
  RATING_SCORE,
  computeOverallRating,
  isValidRatingSet,
  type RatingScores,
} from "@/lib/review-pipeline";
import { submitRating, type SubmitRatingResult } from "./actions";

interface RatingFormProps {
  projectId: string;
  /** This reviewer's previous rating for the project, if any (edit-in-place). */
  initial: (RatingScores & { overall?: number; comment?: string | null }) | null;
  /** false while the reviewer is still pending admin verification. */
  canSubmit: boolean;
}

export function RatingForm({ projectId, initial, canSubmit }: RatingFormProps) {
  const [scores, setScores] = useState<RatingScores>({
    rigor: initial?.rigor ?? 3,
    innovation: initial?.innovation ?? 3,
    impact: initial?.impact ?? 3,
    presentation: initial?.presentation ?? 3,
  });
  const [comment, setComment] = useState(initial?.comment ?? "");
  const [result, setResult] = useState<SubmitRatingResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const overall = computeOverallRating(scores);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidRatingSet(scores)) return;
    startTransition(async () => {
      setResult(await submitRating(projectId, { ...scores, comment }));
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: 16,
        padding: 24,
        display: "grid",
        gap: 20,
        marginTop: 24,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18 }}>
        {initial ? "Update your rating" : "Rate this project"}
      </h2>

      {RATING_CRITERIA.map((c) => (
        <div key={c.key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <label htmlFor={`rating-${c.key}`} style={{ fontSize: 14, fontWeight: 600 }}>
              {c.label}
            </label>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#a5b4fc",
                minWidth: 24,
                textAlign: "right",
              }}
            >
              {scores[c.key]}
            </span>
          </div>
          <p style={{ margin: "2px 0 8px", fontSize: 12, color: "#64748b" }}>{c.hint}</p>
          <input
            id={`rating-${c.key}`}
            type="range"
            min={RATING_SCORE.MIN}
            max={RATING_SCORE.MAX}
            step={1}
            value={scores[c.key]}
            disabled={!canSubmit || isPending}
            onChange={(e) =>
              setScores((s) => ({ ...s, [c.key]: Number(e.target.value) }))
            }
            style={{ width: "100%", accentColor: "#818cf8" }}
          />
        </div>
      ))}

      <label style={{ fontSize: 13, color: "#94a3b8" }}>
        Comment (optional)
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          disabled={!canSubmit || isPending}
          placeholder="Feedback the student will learn from…"
          style={{
            width: "100%",
            marginTop: 6,
            padding: 10,
            borderRadius: 8,
            border: "1px solid #475569",
            background: "#0f172a",
            color: "#e2e8f0",
            fontSize: 14,
            resize: "vertical",
          }}
        />
      </label>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: 999,
            color: "#c7d2fe",
            border: "1px solid #6366f1",
          }}
        >
          Overall: {overall}/5
        </span>
        <button
          type="submit"
          disabled={!canSubmit || isPending || !isValidRatingSet(scores)}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            border: "none",
            fontWeight: 700,
            fontSize: 14,
            cursor: !canSubmit || isPending ? "not-allowed" : "pointer",
            color: "#312e81",
            background: "linear-gradient(135deg, #c7d2fe, #a5b4fc)",
            opacity: !canSubmit || isPending ? 0.5 : 1,
          }}
        >
          {isPending ? "Saving…" : initial ? "Update rating" : "Submit rating"}
        </button>
      </div>

      {!canSubmit && (
        <p style={{ margin: 0, fontSize: 13, color: "#fbbf24" }}>
          Your reviewer account is pending verification — rating unlocks once an
          admin approves your institutional ID.
        </p>
      )}

      {result?.ok && (
        <p style={{ margin: 0, fontSize: 13, color: "#22c55e" }}>
          Saved ✓ Overall {result.overall}/5 · project academic avg{" "}
          {result.academicAvg} · effective VQ now{" "}
          <strong>{result.boostedVq}</strong> (1.1× multiplier active)
        </p>
      )}
      {result && !result.ok && (
        <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{result.error}</p>
      )}
    </form>
  );
}
