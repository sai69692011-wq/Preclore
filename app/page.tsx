// app/page.tsx — Landing: Research Facilitator & Matchmaker (never a grant-maker)

const SERIF = "Georgia, 'Times New Roman', serif";

const CARDS = [
  { href: "/research/published", title: "Research Journal", body: "Read, cite, and build on published student research.", color: "#A7C7E7" },
  { href: "/problem-graph", title: "Problem Graph", body: "See how projects connect — find collaborators.", color: "#FFB3BA" },
  { href: "/failure-vault", title: "Failure Vault", body: "Log what broke. Earn +200 Resilience Points.", color: "#FFDAB9" },
  { href: "/mentor", title: "Mentor Memory", body: "Your advisor remembers your streaks and projects.", color: "#B5DBA8" },
  { href: "/auth/reviewer", title: "Faculty Review", body: "Verified academics endorse rigor — VQ ×1.1.", color: "#C9B6E2" },
  { href: "/support", title: "Support Preclore", body: "Free for every student — donations keep the servers humming.", color: "#F7D9A0" },
] as const;

export default function HomePage() {
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
      <div style={{ maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
        <p
          style={{
            display: "inline-block",
            fontSize: 12,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            background: "#A7C7E7",
            borderRadius: 999,
            padding: "6px 16px",
            margin: "0 0 18px",
          }}
        >
          Research Facilitator · Matchmaker
        </p>
        <h1 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 52, fontWeight: 400, margin: "0 0 14px" }}>
          Preclore
        </h1>
        <p style={{ fontSize: 17, color: "#5c6b85", lineHeight: 1.7, maxWidth: 620, margin: "0 auto 48px" }}>
          The platform where young researchers document real problems, earn
          faculty endorsement, publish with citations, and connect — shielded —
          with mentors and collaborators.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
            textAlign: "left",
          }}
        >
          {CARDS.map((c) => (
            <a
              key={c.href}
              href={c.href}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                background: "#fffdf8",
                border: "1px solid #eadfce",
                borderTop: `4px solid ${c.color}`,
                borderRadius: 14,
                padding: "20px 22px",
              }}
            >
              <strong style={{ display: "block", fontFamily: SERIF, fontSize: 18, marginBottom: 6 }}>
                {c.title}
              </strong>
              <span style={{ fontSize: 13, color: "#5c6b85" }}>{c.body}</span>
            </a>
          ))}
        </div>

        <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 48 }}>
          Preclore connects and credentialises — it does not provide direct grants.
        </p>
      </div>
    </main>
  );
}
