// src/app/research/published/[id]/view-tracker.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Invisible client island: fires the unique-reader view counter once per
// mount, then refreshes so the sidebar shows the incremented count.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { recordPaperView } from "./actions";

export function ViewTracker({ paperId }: { paperId: string }) {
  const router = useRouter();
  const fired = useRef(false); // React StrictMode double-invokes effects in dev

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    recordPaperView(paperId)
      .then((res) => {
        if (res?.counted) router.refresh();
      })
      .catch(() => {
        // Metrics must never break reading.
      });
  }, [paperId, router]);

  return null;
}
