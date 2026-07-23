// src/lib/design-tokens.ts
// ─────────────────────────────────────────────────────────────────────────────
// "Warm Academic Pastel" design system — single token source for v2.3.
// Pair with src/app/globals.css for the tactile/shimmer interaction classes.
// ─────────────────────────────────────────────────────────────────────────────

export const PASTEL = {
  /** Mandated brand pastels. */
  blue: "#A7C7E7",
  pink: "#FFB3BA",
  cream: "#FFF8E7",
  /** Supporting tones used across the journal/graph/failure surfaces. */
  paper: "#faf6ef", // Journal Cream Paper
  peach: "#FFDAB9", // Failure Vault growth signal
  ink: "#364152", // masthead serif ink
  walnut: "#7c4a21", // pastel-sidebar text
  clay: "#9a6b3f", // links & accents
} as const;

/**
 * 3D tactile button recipe: 4px block shadow at rest, sinking 2px on :active.
 * Reference the CSS class `.btn-tactile` in globals.css (pseudo-state can't
 * be inline-styled); these constants document the contract.
 */
export const TACTILE = {
  shadowRest: "0 4px 0 rgba(54, 65, 82, 0.28)",
  shadowActive: "0 2px 0 rgba(54, 65, 82, 0.28)",
  pressDistance: "2px",
} as const;

/** Journal display type. */
export const SERIF_STACK = "Georgia, 'Times New Roman', serif";
