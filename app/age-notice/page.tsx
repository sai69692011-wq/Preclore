// app/age-notice/page.tsx — Shield middleware destination for users under 10.

export const dynamic = "force-dynamic";

export default function AgeNoticePage() {
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
        Almost, future researcher.
      </h1>
      <p style={{ fontSize: 15, color: "#5c6b85", maxWidth: 520, margin: "0 auto 24px" }}>
        Preclore's research tools open at age 10. Until then, the journal is a
        great place to explore what investigators your age have discovered.
      </p>
      <a href="/research/published" style={{ color: "#9a6b3f", fontSize: 14 }}>
        Explore the Research Journal →
      </a>
    </main>
  );
}
