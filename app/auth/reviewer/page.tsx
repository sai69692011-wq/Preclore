// src/app/auth/reviewer/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// v2.3 Faculty Registration Flow.
//   - .edu / .ac.in / .edu.in institutional email gate (regex hardened —
//     see src/lib/review-pipeline.ts for why the old pattern was unsafe)
//   - Institutional ID upload → private storage bucket `institutional-ids`
//   - Inserts into `reviewers` with is_verified: false (pending admin review)
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import {
  isEduEmail,
  EXPERTISE_AREAS,
} from "@/lib/review-pipeline";

type Phase = "form" | "submitting" | "pending" | "confirm-email";

const MAX_ID_BYTES = 5 * 1024 * 1024; // 5 MB
const ID_TYPES = ["application/pdf", "image/jpeg", "image/png"];

export default function ReviewerOnboardingPage() {
  const supabase = createClient();

  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [institution, setInstitution] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [eduEmailValid, setEduEmailValid] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("form");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setHasSession(!!data.user));
  }, [supabase]);

  function onEmailChange(value: string) {
    setEmail(value);
    // Hardened institutional gate — replaces the old loose regex.
    setEduEmailValid(value.length > 0 ? isEduEmail(value) : null);
  }

  function toggleExpertise(area: string) {
    setExpertise((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  }

  function onFileChange(file: File | null) {
    if (!file) return setIdFile(null);
    if (!ID_TYPES.includes(file.type))
      return setMessage("Institutional ID must be a PDF, JPG, or PNG.");
    if (file.size > MAX_ID_BYTES)
      return setMessage("Institutional ID must be under 5 MB.");
    setMessage(null);
    setIdFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!isEduEmail(email))
      return setMessage(
        "Please use your institutional email (.edu, .ac.in, or .edu.in)."
      );
    if (!idFile)
      return setMessage("Please attach your institutional ID for verification.");
    if (expertise.length === 0)
      return setMessage("Select at least one expertise area.");

    setPhase("submitting");
    try {
      // 1) Identity: sign in, or create the account when signed out.
      let userId: string | null = null;
      const { data: existing } = await supabase.auth.getUser();
      if (existing.user) {
        userId = existing.user.id;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) {
          // Email confirmation is enabled on the project: the reviewers row
          // can only be inserted once they confirm and sign in (RLS).
          setPhase("confirm-email");
          return;
        }
        userId = data.user?.id ?? null;
      }
      if (!userId) throw new Error("Could not establish your account session.");

      // 2) Reviewer row — always starts UNVERIFIED. Faculty power is earned.
      const { error: insertError } = await supabase.from("reviewers").upsert({
        id: userId,
        name,
        email,
        institution,
        expertise,
        is_verified: false,
      });
      if (insertError) throw insertError;

      // 3) Institutional ID upload. Soft-fail: verification stays pending and
      //    the ID can be re-attached later; never block registration on it.
      const path = `${userId}/${Date.now()}_${idFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("institutional-ids")
        .upload(path, idFile, { upsert: true });
      if (uploadError) {
        console.warn("[reviewer-onboarding] ID upload failed:", uploadError.message);
        setMessage(
          "Registered, but the ID upload failed — you can re-attach it later. (Is the institutional-ids bucket created? See migration.sql.)"
        );
      } else {
        await supabase
          .from("reviewers")
          .update({ id_document_path: path })
          .eq("id", userId);
      }

      setPhase("pending");
    } catch (err) {
      setPhase("form");
      setMessage(err instanceof Error ? err.message : "Registration failed.");
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    maxWidth: 520,
    margin: "0 auto",
    background: "#1e293b",
    borderRadius: 16,
    padding: 32,
    border: "1px solid #334155",
  };
  const input: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#e2e8f0",
    fontSize: 14,
    marginTop: 4,
  };
  const label: React.CSSProperties = { fontSize: 13, color: "#94a3b8" };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#e2e8f0",
        padding: "48px 24px",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div style={card}>
        <p style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#818cf8", margin: "0 0 8px" }}>
          Faculty onboarding
        </p>
        <h1 style={{ margin: "0 0 8px", fontSize: 26 }}>Become a Reviewer</h1>
        <p style={{ margin: "0 0 24px", fontSize: 14, color: "#94a3b8" }}>
          Verified academics unlock the 1.1× Academic Multiplier for the
          student projects they endorse.
        </p>

        {phase === "pending" && (
          <div>
            <h2 style={{ fontSize: 18 }}>Application received ✓</h2>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
              Your institutional ID is queued for review. Once an admin verifies
              your standing, the Reviewer Dashboard and rating tools unlock.
              {message && <><br />{message}</>}
            </p>
            <a href="/dashboard/reviewer" style={{ color: "#a5b4fc" }}>
              Go to Reviewer Dashboard →
            </a>
          </div>
        )}

        {phase === "confirm-email" && (
          <div>
            <h2 style={{ fontSize: 18 }}>Confirm your email ✉️</h2>
            <p style={{ fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
              We sent a confirmation link to <strong>{email}</strong>. Confirm
              it, sign in, and return here to finish your reviewer application.
            </p>
          </div>
        )}

        {(phase === "form" || phase === "submitting") && (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
            <label style={label}>
              Full name
              <input style={input} required value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <label style={label}>
              Institution
              <input style={input} required value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. IISc Bengaluru" />
            </label>

            <label style={label}>
              Institutional email
              <input
                style={{
                  ...input,
                  borderColor:
                    eduEmailValid === false ? "#ef4444" : eduEmailValid ? "#22c55e" : input.borderColor,
                }}
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                placeholder="you@university.edu / you@college.ac.in"
              />
              {eduEmailValid === false && (
                <span style={{ fontSize: 12, color: "#f87171" }}>
                  Must end in .edu, .ac.in, or .edu.in
                </span>
              )}
            </label>

            {hasSession === false && (
              <label style={label}>
                Password (creates your account)
                <input style={input} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
            )}

            <div>
              <span style={label}>Expertise areas</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                {EXPERTISE_AREAS.map((area) => {
                  const active = expertise.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleExpertise(area)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 999,
                        fontSize: 13,
                        cursor: "pointer",
                        border: `1px solid ${active ? "#818cf8" : "#475569"}`,
                        background: active ? "rgba(129,140,248,0.18)" : "transparent",
                        color: active ? "#c7d2fe" : "#94a3b8",
                      }}
                    >
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            <label style={label}>
              Institutional ID (PDF/JPG/PNG, ≤ 5 MB)
              <input
                style={{ ...input, padding: 8 }}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              />
              {idFile && <span style={{ fontSize: 12, color: "#22c55e" }}>✓ {idFile.name}</span>}
            </label>

            {message && phase === "form" && (
              <p style={{ margin: 0, fontSize: 13, color: "#f87171" }}>{message}</p>
            )}

            <button
              type="submit"
              disabled={phase === "submitting"}
              style={{
                padding: "12px 16px",
                borderRadius: 10,
                border: "none",
                fontWeight: 700,
                fontSize: 15,
                cursor: phase === "submitting" ? "wait" : "pointer",
                color: "#312e81",
                background: "linear-gradient(135deg, #c7d2fe, #a5b4fc)",
                opacity: phase === "submitting" ? 0.7 : 1,
              }}
            >
              {phase === "submitting" ? "Submitting…" : "Apply for reviewer access"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
