// src/lib/constants.ts
// ─────────────────────────────────────────────────────────────────────────────
// VQ Engine v2.3 — "Scalability Engine" configuration
// Updated per Million-Dollar Idea Detector spec (2026-07-19)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * High-signal scalability keywords for the Million-Dollar Idea Detector.
 * Matching is case-insensitive substring matching against
 * `${problem} ${solution}`.
 *
 * NOTE (engineer's flag): "every" and "expand" are high-frequency English
 * words and will match most detailed submissions. They are included per
 * spec, but if false positives appear, switch to whole-word matching
 * (see vq-engine.ts) or drop them back to the core 6.
 */
export const MILLION_DOLLAR_KEYWORDS = [
  "scalable",
  "city-wide",
  "nationwide",
  "replicate",
  "thousands",
  "systemic",
  "every",
  "expand",
] as const;

/** Minimum VQ score required for platinum eligibility. */
export const VQ_PLATINUM_THRESHOLD = 900;

/** Realistic civic-project budget window, in ₹ (INR). */
export const BUDGET_RANGE = { MIN: 5000, MAX: 50000 } as const;

/** Minimum photo evidence (or 1 video) for an evidence-rich project. */
export const MIN_EVIDENCE_PHOTOS = 3;

/**
 * Minimum combined problem+solution character length, signalling the
 * project describes a large-scale / systemic issue in real detail.
 */
export const MIN_IMPACT_DESCRIPTION_LENGTH = 1500;

/** Minimum originality signal (platform's 0–200 originality scale). */
export const MIN_ORIGINALITY_SCORE = 180;

/** Number of the 6 criteria that must pass for platinum detection. */
export const PLATINUM_CRITERIA_REQUIRED = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Academic Reviewer Pipeline (v2.3.1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The 1.1× Academic Multiplier: once a project carries at least one faculty
 * rating, its effective VQ = raw VQ × 1.1 (applied by the VQ engine — see
 * applyAcademicMultiplier in vq-engine.ts).
 */
export const ACADEMIC_VQ_MULTIPLIER = 1.1;

/**
 * The 0.85× Academic Penalty (v2.3 Perfection): a project whose VERIFIED
 * academic average falls below ACADEMIC_BOOST_MIN_AVG is deflated, not
 * boosted — peer review cuts both ways.
 */
export const ACADEMIC_VQ_PENALTY = 0.85;

/** Verified-rating average (1–5 scale) at or above which the 1.1× boost applies. */
export const ACADEMIC_BOOST_MIN_AVG = 3;

/** Effective VQ strictly above this qualifies for the "Elite Candidates" lane. */
export const ELITE_VQ_THRESHOLD = 850;

/** Reviewer feed age bands (student age in years, inclusive). */
export const JUNIOR_AGE_BAND = { MIN: 10, MAX: 14 } as const;
export const SENIOR_AGE_BAND = { MIN: 15, MAX: 20 } as const;

/** Bounds for each academic rating criterion (Rigor/Innovation/Impact/Presentation). */
export const RATING_SCORE = { MIN: 1, MAX: 5 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// Failure Vault (v2.3.2)
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum words per reflection section — rigor is the price of the badge. */
export const REFLECTION_MIN_WORDS = 200;

/** Resilience Points granted for one accepted failure reflection. */
export const RESILIENCE_POINTS_AWARD = 200;

// ─────────────────────────────────────────────────────────────────────────────
// Problem Graph (v2.3.3)
// ─────────────────────────────────────────────────────────────────────────────

/** Edges exist only where topic similarity is strictly above this (spec: > 0.4). */
export const GRAPH_SIMILARITY_THRESHOLD = 0.4;

// ─────────────────────────────────────────────────────────────────────────────
// Integrity Engine — Semantic Plagiarism Layer (v2.3 Perfection)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Similarity verdict bands (cosine similarity on TF-IDF vectors):
 *   > 0.75  → blocked (auto-rejected, Shadow Jury notified)
 *   ≥ 0.55  → flagged (queued for the Shadow Jury side-by-side)
 *   < 0.55  → clear
 */
export const PLAGIARISM_THRESHOLDS = { FLAG: 0.55, BLOCK: 0.75 } as const;

// ─────────────────────────────────────────────────────────────────────────────
// Donations & Security Shield (v2.3.1 — platform is free; donations optional)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Donation UPI coordinates for the /support page.
 *
 * The whole platform is FREE for students — there is no fee, no price, and no
 * payment-verification flow anywhere. This handle only receives voluntary
 * donations, which land directly in the founder's own bank account; Preclore
 * never sees, stores, or verifies a transaction.
 *
 * ⚠️ PLACEHOLDER — replace HANDLE with YOUR OWN verified UPI handle before
 * launch, typed by you personally from your own bank/UPI app. Never paste a
 * UPI ID here that came from a chat message, an "audit," or a "fix package."
 */
export const DONATION_UPI = {
  HANDLE: "your-handle@upi",
  NAME: "Preclore",
} as const;

/**
 * Standards-compliant upi:// deep link for the donate button (mobile-first).
 * Deliberately carries NO `am` amount — the donor chooses what to give.
 */
export function donationDeepLink(): string {
  const params = new URLSearchParams({
    pa: DONATION_UPI.HANDLE,
    pn: DONATION_UPI.NAME,
    cu: "INR",
  });
  return `upi://pay?${params.toString()}`;
}

/** Student age gate (years, inclusive). Under → notice; over → alumni redirect. */
export const AGE_GATE = { MIN: 10, MAX: 20 } as const;

/** Free paper reads for signed-out visitors before the paywall nudge. */
export const GUEST_VIEW_LIMIT = 5;
