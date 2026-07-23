// src/app/layout.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Minimal root layout so globals.css (tactile buttons, shimmer) loads.
// ⚠️ If your repo already has a root layout, KEEP YOURS — just make sure it
// imports "./globals.css".
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s — Preclore",
    default: "Preclore — Research Facilitator & Matchmaker",
  },
  description:
    "Preclore connects young researchers with mentors, faculty reviewers, and collaborators. Credentialing and portfolio hosting — never a grant-maker.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
