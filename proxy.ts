// proxy.ts (Next.js 16 convention — formerly src/middleware.ts)
// ─────────────────────────────────────────────────────────────────────────────
// The Shield Middleware (v2.3 Perfection) — three UX-level guards:
//   1. AGE GATE      — student routes require age 10–20 (cookie `pr_age`,
//                      written at signup). Under → /age-notice, over → /alumni.
//   2. ALUMNI REDIRECT — users over 20 are shepherded to /alumni, never the
//                      student flow.
//   3. GUEST LIMIT   — signed-out visitors get 5 free paper reads
//                      (cookie `pr_guest_views`), then a nudge to /support
//                      (the platform is free — /support is donations-only).
// Middleware is the polite door, not the vault: the counters/RLS server-side
// remain enforcement. Keep these rules in sync with src/lib/constants.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse, type NextRequest } from "next/server";
import { AGE_GATE, GUEST_VIEW_LIMIT } from "@/lib/constants";

const ALWAYS_OPEN = [
  "/age-notice",
  "/alumni",
  "/support",
  "/api",
  "/_next",
  "/favicon",
];

function hasSession(req: NextRequest): boolean {
  // Supabase writes `sb-*-auth-token` cookies; presence ⇒ signed in.
  return req.cookies.getAll().some((c) => c.name.startsWith("sb-"));
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (ALWAYS_OPEN.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const res = NextResponse.next();

  // ── 1 & 2. Age gate + alumni redirect (student-only surfaces) ──────────
  const STUDENT_ROUTES = ["/failure-vault", "/dashboard", "/mentor"];
  if (STUDENT_ROUTES.some((p) => pathname.startsWith(p))) {
    const age = Number(req.cookies.get("pr_age")?.value);
    if (Number.isFinite(age) && age > 0) {
      if (age < AGE_GATE.MIN)
        return NextResponse.redirect(new URL("/age-notice", req.url));
      if (age > AGE_GATE.MAX)
        return NextResponse.redirect(new URL("/alumni", req.url));
    }
    // No age cookie → let the page render; its own auth guards decide.
  }

  // ── 3. Five-view guest limit on paper pages ────────────────────────────
  if (!hasSession(req) && /^\/research\/published\/[^/]+$/.test(pathname)) {
    const count = Number(req.cookies.get("pr_guest_views")?.value ?? "0");
    if (count >= GUEST_VIEW_LIMIT) {
      return NextResponse.redirect(
        new URL("/support?reason=guest-limit", req.url)
      );
    }
    res.cookies.set("pr_guest_views", String(count + 1), {
      maxAge: 60 * 60 * 24 * 30, // 30 days, then the slate wipes clean
      path: "/",
    });
  }

  return res;
}

export const config = {
  matcher: [
    "/research/published/:path*",
    "/failure-vault",
    "/dashboard/:path*",
    "/mentor",
  ],
};
