"use client";

// app/support/donate-card.tsx (client)
// ─────────────────────────────────────────────────────────────────────────────
// The Donate Card — copy the UPI handle or open the donor's own UPI app.
// Deliberately SIMPLE: no amount field, no reference form, no "verify" button.
// A donation needs no verification because Preclore never confirms, tracks, or
// unlocks anything in return. Money goes founder-ward; the site stays free.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { DONATION_UPI, donationDeepLink } from "@/lib/constants";

export function DonateCard() {
  const [copied, setCopied] = useState(false);

  async function copyHandle() {
    try {
      await navigator.clipboard.writeText(DONATION_UPI.HANDLE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (old browser / permissions) — select-style fallback
      // is unnecessary here; the handle is already visible to copy by hand.
    }
  }

  return (
    <div
      style={{
        background: "#fffdf8",
        border: "1px solid #eadfce",
        borderRadius: 16,
        padding: "24px 24px 20px",
        maxWidth: 420,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: 12,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#94a3b8",
          margin: "0 0 10px",
        }}
      >
        Donate via UPI · any amount
      </p>

      <p
        className="shimmer"
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 20,
          fontWeight: 700,
          color: "#364152",
          margin: "0 0 16px",
          userSelect: "all",
        }}
      >
        {DONATION_UPI.HANDLE}
      </p>

      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={copyHandle}
          className="btn-tactile"
          style={{ background: "#A7C7E7", color: "#364152" }}
        >
          {copied ? "Copied ✓" : "Copy UPI handle"}
        </button>

        <a
          href={donationDeepLink()}
          className="btn-tactile"
          style={{ background: "#FFB3BA", color: "#364152", textDecoration: "none" }}
        >
          Open my UPI app
        </a>
      </div>

      <p style={{ fontSize: 12, color: "#94a3b8", margin: "14px 0 0", lineHeight: 1.6 }}>
        Works with GPay, PhonePe, Paytm &amp; any UPI app. No fixed amount —
        whatever a chai costs you is plenty.
      </p>
    </div>
  );
}
