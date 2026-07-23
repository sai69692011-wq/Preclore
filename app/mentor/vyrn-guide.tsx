// src/app/mentor/vyrn-guide.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The Vyrn floating guide — bottom-right, personalized by Mentor Memory.
// Client component: it only handles open/close interactivity. ALL
// personalization (greeting, streak chip, CTA) is computed server-side in
// src/lib/mentor-memory.ts and passed in as props.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import type { MentorGuideState } from "@/lib/mentor-memory";

interface VyrnGuideProps {
  state: MentorGuideState;
  greeting: string;
  /** Route the CTA button points to — adjust to your app's "new project" flow. */
  ctaHref: string;
}

export function VyrnGuide({ state, greeting, ctaHref }: VyrnGuideProps) {
  const [open, setOpen] = useState(true);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 12,
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      {open && (
        <section
          aria-label={`${state.mentorName} mentor guide`}
          style={{
            width: 320,
            borderRadius: 16,
            padding: "18px 20px",
            background: "linear-gradient(160deg, #1e1b4b 0%, #312e81 100%)",
            color: "#eef2ff",
            boxShadow:
              "0 12px 32px rgba(49, 46, 129, 0.45), 0 2px 8px rgba(0,0,0,0.25)",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 10,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                fontWeight: 700,
                background: state.fireMode
                  ? "linear-gradient(135deg, #f97316, #ef4444)"
                  : "linear-gradient(135deg, #818cf8, #6366f1)",
              }}
            >
              {state.fireMode ? "🔥" : state.mentorName.charAt(0)}
            </span>
            <div style={{ flex: 1 }}>
              <strong style={{ display: "block", fontSize: 14 }}>
                {state.mentorName}
              </strong>
              <span style={{ fontSize: 11, opacity: 0.75 }}>
                {state.mode === "new"
                  ? "Research advisor · just getting started"
                  : `Research advisor · ${state.projects} project${
                      state.projects === 1 ? "" : "s"
                    } completed`}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Minimize mentor guide"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                color: "inherit",
                borderRadius: 8,
                width: 26,
                height: 26,
                cursor: "pointer",
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              –
            </button>
          </header>

          {/* pre-line: the 🔥 streak addendum arrives on its own line (\n\n) */}
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: "pre-line",
            }}
          >
            {greeting}
          </p>

          {state.streakChip && (
            <div
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 999,
                marginBottom: 12,
                background: state.fireMode
                  ? "rgba(249, 115, 22, 0.22)"
                  : "rgba(129, 140, 248, 0.2)",
                border: `1px solid ${
                  state.fireMode
                    ? "rgba(249, 115, 22, 0.55)"
                    : "rgba(129, 140, 248, 0.45)"
                }`,
              }}
            >
              {state.streakChip}
            </div>
          )}

          <a
            href={ctaHref}
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 14,
              padding: "10px 14px",
              borderRadius: 10,
              color: "#312e81",
              background: "linear-gradient(135deg, #c7d2fe, #a5b4fc)",
            }}
          >
            {state.ctaLabel}
          </a>
        </section>
      )}

      {/* Collapsed floating action bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label={`Open ${state.mentorName} mentor guide`}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            fontSize: 22,
            color: "#fff",
            background: state.fireMode
              ? "linear-gradient(135deg, #f97316, #ef4444)"
              : "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 8px 24px rgba(79, 70, 229, 0.5)",
          }}
        >
          {state.fireMode ? "🔥" : state.mentorName.charAt(0)}
        </button>
      )}
    </div>
  );
}
