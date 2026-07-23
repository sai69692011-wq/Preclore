// src/app/mentor/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Refactored: the random greeting randomizer is GONE.
//   BEFORE: getMentorResponse() picked a random string per category.
//   AFTER:  the greeting is rule-based, computed server-side from
//           mentor_memory + streaks (src/lib/mentor-memory.ts), and the
//           bottom-right Vyrn guide mirrors the same personalized state.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase-server";
import {
  fetchUserMentorMemory,
  generatePersonalizedGreeting,
  getMentorGuideState,
} from "@/lib/mentor-memory";
import { VyrnGuide } from "./vyrn-guide";

export const metadata: Metadata = {
  title: "Mentor — Your Research Guide",
};

export default async function MentorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonymous visitors are treated as first-time researchers (projects = 0),
  // so the page never crashes on a missing session or a brand-new account.
  const memory = user ? await fetchUserMentorMemory(user.id) : null;
  const greeting = generatePersonalizedGreeting(memory);
  const guideState = getMentorGuideState(memory);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        padding: "48px 24px 160px", // bottom padding clears the floating guide
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#818cf8",
            margin: "0 0 8px",
          }}
        >
          Your mentor
        </p>

        <h1 style={{ margin: "0 0 16px", fontSize: 32, lineHeight: 1.2 }}>
          {guideState.mentorName}
        </h1>

        {/* The personalized greeting — rule-based, never random. */}
        <p
          style={{
            fontSize: 18,
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            margin: "0 0 24px",
          }}
        >
          {greeting}
        </p>

        {/* ────────────────────────────────────────────────────────────────
            SEAM: your existing mentor chat UI stays here. Only the greeting
            layer was replaced — getMentorResponse()/MENTOR_RESPONSES still
            handle per-message category replies below this point.
            ──────────────────────────────────────────────────────────────── */}
      </div>

      {/* TODO: point ctaHref at your real "new project / interview" route. */}
      <VyrnGuide
        state={guideState}
        greeting={greeting}
        ctaHref="/projects/new"
      />
    </main>
  );
}

export const dynamic = "force-dynamic";
