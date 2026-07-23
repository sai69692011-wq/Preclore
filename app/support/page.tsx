// app/support/page.tsx — Donations: the whole platform is free, forever.
// ─────────────────────────────────────────────────────────────────────────────
// v2.3.1 decision: Preclore charge students NOTHING. This page carries the only
// money surface left in the product: a voluntary, verification-free donation
// card. No paywall, no unlocks, no admin review queue — a donation is an act
// of thanks, not a transaction we track.
// ─────────────────────────────────────────────────────────────────────────────

import { DonateCard } from "./donate-card";

const SERIF = "Georgia, 'Times New Roman', serif";

export default function SupportPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#FFF8E7",
        color: "#364152",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "64px 24px 96px",
      }}
    >
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
        <p
          style={{
            display: "inline-block",
            fontSize: 12,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            background: "#F7D9A0",
            borderRadius: 999,
            padding: "6px 16px",
            margin: "0 0 18px",
          }}
        >
          Free forever · Donations welcome
        </p>

        <h1 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 44, fontWeight: 400, margin: "0 0 14px" }}>
          Support Preclore
        </h1>

        <p style={{ fontSize: 16, color: "#5c6b85", lineHeight: 1.7, margin: "0 auto 36px", maxWidth: 540 }}>
          Credentialing, portfolio hosting, the Failure Vault, the Journal —
          every door here is free for every student. If Preclore helped you
          publish, cite, or find a mentor, a small donation keeps the servers
          warm and the review lanes open.
        </p>

        <DonateCard />

        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 32, lineHeight: 1.7 }}>
          Preclore is a Research Facilitator &amp; Matchmaker — not a
          grant-maker, and not a paywall. Donations are voluntary, carry no
          perks, and are never verified or tracked by the platform.
        </p>
      </div>
    </main>
  );
}
