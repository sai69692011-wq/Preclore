// src/app/failure-vault/reflection-form.tsx
// ─────────────────────────────────────────────────────────────────────────────
// 3-part reflection form (client): live 200-word counters, peach progress
// bars, and the Resilience Badge toast on success. Validation here is UX —
// the server action re-validates with the same pure functions.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useMemo, useState, useTransition } from "react";
import {
  REFLECTION_SECTIONS,
  REFLECTION_MIN_WORDS,
  validateReflection,
  type ReflectionSectionKey,
} from "@/lib/failure-vault";
import { submitReflection, type SubmitReflectionResult } from "./actions";

const PEACH = "#FFDAB9";
const PEACH_DEEP = "#f4a261";

export function ReflectionForm({
  projects,
}: {
  projects: { id: string; title: string }[];
}) {
  const [projectId, setProjectId] = useState<string>("");
  const [projectTitle, setProjectTitle] = useState("");
  const [sections, setSections] = useState<Record<ReflectionSectionKey, string>>({
    whatWentWrong: "",
    lessonsLearned: "",
    doDifferently: "",
  });
  const [result, setResult] = useState<SubmitReflectionResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validation = useMemo(() => validateReflection(sections), [sections]);
  const needsTitle = projectId === "" && projects.length === 0;
  const contextReady = projectId !== "" || needsTitle
    ? projectId !== "" || projectTitle.trim().length > 0
    : projectId !== "" || projectTitle.trim().length > 0;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validation.valid) return;
    startTransition(async () => {
      const res = await submitReflection({
        projectId: projectId || null,
        projectTitle: projectId ? null : projectTitle.trim() || null,
        ...sections,
      });
      setResult(res);
      if (res.ok) {
        setSections({ whatWentWrong: "", lessonsLearned: "", doDifferently: "" });
        setProjectId("");
        setProjectTitle("");
        setToast(
          `🎖 Resilience Badge earned! +${res.pointsAwarded} points (balance: ${res.totalPoints?.toLocaleString()})`
        );
        setTimeout(() => setToast(null), 6000);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 22 }}>
      {/* Resilience Badge toast */}
      {toast && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            background: PEACH,
            color: "#7c3a0e",
            fontWeight: 700,
            fontSize: 14,
            padding: "14px 22px",
            borderRadius: 14,
            boxShadow: "0 10px 30px rgba(244, 162, 97, 0.45)",
            zIndex: 1100,
            border: "1px solid #f4a261",
          }}
        >
          {toast}
        </div>
      )}

      {/* Project context */}
      <label style={{ fontSize: 13, fontWeight: 600, color: "#7c3a0e" }}>
        Which attempt failed?
        {projects.length > 0 ? (
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            style={fieldStyle}
          >
            <option value="" disabled>
              Choose the project…
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            required
            placeholder="e.g. Greywater filter prototype v1"
            style={fieldStyle}
          />
        )}
      </label>

      {/* The three reflection sections */}
      {REFLECTION_SECTIONS.map((s) => {
        const v = validation.sections.find((x) => x.key === s.key)!;
        return (
          <section
            key={s.key}
            style={{
              background: "#fffdf8",
              border: "1px solid #f0ddc8",
              borderRadius: 14,
              padding: 20,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label
                htmlFor={`fv-${s.key}`}
                style={{ fontFamily: "Georgia, serif", fontSize: 17, color: "#7c3a0e" }}
              >
                {s.label}
              </label>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: v.valid ? "#15803d" : "#b4551f",
                }}
              >
                {v.words}/{REFLECTION_MIN_WORDS} words {v.valid ? "✓" : ""}
              </span>
            </div>
            <p style={{ fontSize: 13, color: "#a3836b", margin: "6px 0 10px" }}>{s.hint}</p>
            <textarea
              id={`fv-${s.key}`}
              value={sections[s.key]}
              onChange={(e) =>
                setSections((prev) => ({ ...prev, [s.key]: e.target.value }))
              }
              rows={7}
              disabled={isPending}
              style={{ ...fieldStyle, resize: "vertical", lineHeight: 1.6 }}
            />
            {/* peach → green progress, shimmering while it grows */}
            <div
              aria-hidden
              style={{
                height: 6,
                borderRadius: 999,
                background: "#f7ead9",
                marginTop: 10,
                overflow: "hidden",
              }}
            >
              <div
                className="shimmer"
                style={{
                  height: "100%",
                  width: `${v.progress * 100}%`,
                  borderRadius: 999,
                  background: v.valid
                    ? "linear-gradient(90deg, #86efac, #22c55e)"
                    : `linear-gradient(90deg, ${PEACH}, ${PEACH_DEEP})`,
                  transition: "width 200ms ease",
                }}
              />
            </div>
          </section>
        );
      })}

      {result && !result.ok && (
        <p style={{ margin: 0, fontSize: 13, color: "#dc2626" }}>{result.error}</p>
      )}

      <button
        type="submit"
        disabled={!validation.valid || !contextReady || isPending}
        className="btn-tactile"
        style={{
          padding: "14px 20px",
          borderRadius: 12,
          border: "none",
          fontWeight: 800,
          fontSize: 15,
          cursor: !validation.valid || isPending ? "not-allowed" : "pointer",
          color: "#7c3a0e",
          background:
            validation.valid && contextReady
              ? `linear-gradient(135deg, ${PEACH}, ${PEACH_DEEP})`
              : "#f0ddc8",
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending
          ? "Logging your failure…"
          : validation.valid
            ? "Submit reflection · earn +200 Resilience Points"
            : `Keep reflecting — ${validation.sections.filter((s) => !s.valid).length} section(s) under 200 words`}
      </button>
    </form>
  );
}

const fieldStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 8,
  padding: "11px 13px",
  fontSize: 14,
  borderRadius: 10,
  border: "1px solid #e8d3bb",
  background: "#fff",
  color: "#3d2b1f",
};
