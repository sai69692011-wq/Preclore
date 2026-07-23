// src/app/mentorship/request-button.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Instagram-style "Request to Connect" button (client). Reveal of the
// researcher's email happens server-side through researcher_directory — this
// button only reflects and changes request state. Drop it onto any profile
// or collaborator popover.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState, useTransition } from "react";
import { requestMentorship, getMentorshipStatus } from "./actions";

type State = "loading" | "none" | "pending" | "accepted" | "declined";

export function MentorshipRequestButton({ researcherId }: { researcherId: string }) {
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMentorshipStatus(researcherId)
      .then((r) => setState(r.status as State))
      .catch(() => setState("none"));
  }, [researcherId]);

  function send() {
    startTransition(async () => {
      const res = await requestMentorship(researcherId, null);
      if (res.ok) setState("pending");
      else setError(res.error ?? "Request failed.");
    });
  }

  const base: React.CSSProperties = {
    padding: "10px 18px",
    borderRadius: 12,
    border: "none",
    fontWeight: 700,
    fontSize: 14,
  };

  if (state === "accepted")
    return (
      <span style={{ ...base, display: "inline-block", background: "#B5DBA8", color: "#1e4620" }}>
        ✓ Connected — contact unlocked
      </span>
    );

  if (state === "pending")
    return (
      <span style={{ ...base, display: "inline-block", background: "#FFF8E7", color: "#7c6a3f", border: "1px solid #d9c49a" }}>
        Requested · awaiting researcher approval
      </span>
    );

  return (
    <span>
      <button
        onClick={send}
        disabled={isPending || state === "loading"}
        className="btn-tactile"
        style={{ ...base, cursor: "pointer", background: "#A7C7E7", color: "#364152" }}
      >
        {isPending ? "Sending…" : state === "declined" ? "Request again" : "Request to Connect"}
      </button>
      {error && <span style={{ fontSize: 12, color: "#dc2626", marginLeft: 8 }}>{error}</span>}
    </span>
  );
}
