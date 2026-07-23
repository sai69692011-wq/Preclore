// app/alumni/page.tsx — Shield middleware destination for users over 20.

export const dynamic = "force-dynamic";

export default function AlumniPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#faf6ef",
        color: "#364152",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        padding: "72px 24px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 34, fontWeight: 400 }}>
        Welcome back, alumni.
      </h1>
      <p style={{ fontSize: 15, color: "#5c6b85", maxWidth: 520, margin: "0 auto 24px" }}>
        The student tooling is reserved for researchers aged 10–20 — but the
        journal is yours to read, and your expertise is exactly what the next
        cohort needs.
      </p>
      <p style={{ fontSize: 14 }}>
        <a href="/research/published" style={{ color: "#9a6b3f" }}>Read the Research Journal →</a>
        {" · "}
        <a href="/auth/reviewer" style={{ color: "#9a6b3f" }}>Become a faculty reviewer →</a>
      </p>
    </main>
  );
}
