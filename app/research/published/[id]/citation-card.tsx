// src/app/research/published/[id]/citation-card.tsx
// ─────────────────────────────────────────────────────────────────────────────
// "Copy Citation" card (client). Copies the APA-style reference, then records
// the citation event server-side — a copy IS the citation proxy metric that
// powers the journal's "Most Cited" sort.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordCitation } from "./actions";

export function CitationCard({
  paperId,
  citation,
}: {
  paperId: string;
  citation: string;
}) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleCopy() {
    // Clipboard API needs a secure context; fall back to the textarea trick.
    try {
      await navigator.clipboard.writeText(citation);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = citation;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);

    // Fire-and-forget; refresh only when this copy actually counted.
    recordCitation(paperId)
      .then((res) => {
        if (res?.counted) router.refresh();
      })
      .catch(() => {});
  }

  return (
    <section
      style={{
        background: "#fffdf8",
        border: "1px solid #eadfce",
        borderRadius: 14,
        padding: 20,
      }}
    >
      <h3
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: 17,
          fontWeight: 400,
          margin: "0 0 10px",
          color: "#7c4a21",
        }}
      >
        Cite this work
      </h3>
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          color: "#57534e",
          background: "#faf3e6",
          border: "1px dashed #d6c7b2",
          borderRadius: 8,
          padding: "10px 12px",
          margin: "0 0 12px",
        }}
      >
        {citation}
      </p>
      <button
        onClick={handleCopy}
        className="btn-tactile"
        style={{
          width: "100%",
          padding: "10px 14px",
          fontSize: 14,
          fontWeight: 700,
          borderRadius: 10,
          cursor: "pointer",
          border: "none",
          color: copied ? "#14532d" : "#fffdf8",
          background: copied ? "#bbf7d0" : "#9a6b3f",
          transition: "background 150ms ease",
        }}
      >
        {copied ? "Copied ✓" : "Copy Citation"}
      </button>
    </section>
  );
}
