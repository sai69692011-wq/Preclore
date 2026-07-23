// src/app/research/published/journal-browser.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Interactive layer of the journal feed (client): keyword search, the
// Newest / Most Viewed / Most Cited sorter, the paper grid, and the
// "Warm Academic Pastel" metrics sidebar. All ranking logic comes from the
// pure functions in src/lib/journal.ts.
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useMemo, useState } from "react";
import {
  searchPapers,
  sortPapers,
  journalTotals,
  topCited,
  SORT_MODES,
  type PublishedPaper,
  type SortMode,
} from "@/lib/journal";

const SERIF = "Georgia, 'Times New Roman', serif";

export function JournalBrowser({ papers }: { papers: PublishedPaper[] }) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("newest");

  const visible = useMemo(
    () => sortPapers(searchPapers(papers, query), sortBy),
    [papers, query, sortBy]
  );
  const totals = useMemo(() => journalTotals(papers), [papers]);
  const leaders = useMemo(() => topCited(papers), [papers]);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 300px",
        gap: 40,
        alignItems: "start",
      }}
    >
      {/* ── Main column ─────────────────────────────────────────────────── */}
      <section>
        {/* Search + sort controls */}
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles, abstracts, authors, cities…"
            aria-label="Search published research"
            style={{
              flex: 1,
              minWidth: 220,
              padding: "10px 14px",
              fontSize: 14,
              borderRadius: 8,
              border: "1px solid #d6c7b2",
              background: "#fffdf8",
              color: "inherit",
            }}
          />
          <div role="tablist" aria-label="Sort papers" style={{ display: "flex", gap: 6 }}>
            {SORT_MODES.map((m) => {
              const active = sortBy === m.id;
              return (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSortBy(m.id)}
                  style={{
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 999,
                    cursor: "pointer",
                    border: `1px solid ${active ? "#9a6b3f" : "#d6c7b2"}`,
                    background: active ? "#f3e2cd" : "transparent",
                    color: active ? "#7c4a21" : "#78716c",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {query && (
          <p style={{ fontSize: 13, color: "#78716c", margin: "0 0 16px" }}>
            {visible.length} result{visible.length === 1 ? "" : "s"} for “{query}”
          </p>
        )}

        {/* Paper list */}
        <div style={{ display: "grid", gap: 20 }}>
          {visible.length === 0 && (
            <p style={{ color: "#a8a29e", fontStyle: "italic", fontSize: 15 }}>
              No papers match — try a broader keyword.
            </p>
          )}
          {visible.map((p) => (
            <article
              key={p.id}
              style={{
                background: "#fffdf8",
                border: "1px solid #eadfce",
                borderRadius: 12,
                padding: "22px 24px",
              }}
            >
              <h2 style={{ margin: "0 0 6px" }}>
                <a
                  href={`/research/published/${p.id}`}
                  style={{
                    fontFamily: SERIF,
                    fontSize: 22,
                    fontWeight: 400,
                    color: "#292524",
                    textDecoration: "none",
                  }}
                >
                  {p.title}
                </a>
              </h2>
              <p style={{ margin: "0 0 10px", fontSize: 13, color: "#9a6b3f" }}>
                {p.authorName}
                {p.city ? ` · ${p.city}` : ""} · {p.year}
              </p>
              {p.abstract && (
                <p
                  style={{
                    margin: "0 0 12px",
                    fontSize: 14,
                    lineHeight: 1.65,
                    color: "#57534e",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {p.abstract}
                </p>
              )}
              <p style={{ margin: 0, fontSize: 12, color: "#a8a29e", display: "flex", gap: 14, flexWrap: "wrap" }}>
                <span>👁 {p.viewCount.toLocaleString()} reads</span>
                <span>❝ {p.citationCount.toLocaleString()} citations</span>
                {p.vqScore > 0 && <span>VQ {p.vqScore}</span>}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Warm Academic Pastel sidebar ────────────────────────────────── */}
      <aside
        style={{
          position: "sticky",
          top: 24,
          background: "#f7e7d3", // warm pastel
          border: "1px solid #ecd9bf",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <h3 style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 400, margin: "0 0 14px", color: "#7c4a21" }}>
          Journal at a Glance
        </h3>
        <dl style={{ margin: "0 0 20px", display: "grid", gap: 10 }}>
          <Metric label="Papers" value={totals.papers} />
          <Metric label="Total reads" value={totals.views} />
          <Metric label="Total citations" value={totals.citations} />
        </dl>

        <h4 style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 400, margin: "0 0 10px", color: "#7c4a21" }}>
          Most Cited
        </h4>
        {leaders.length === 0 ? (
          <p style={{ fontSize: 13, color: "#a08060", fontStyle: "italic", margin: 0 }}>
            First citation is up for grabs.
          </p>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8 }}>
            {leaders.map((p) => (
              <li key={p.id} style={{ fontSize: 13, lineHeight: 1.4 }}>
                <a href={`/research/published/${p.id}`} style={{ color: "#7c4a21" }}>
                  {p.title}
                </a>
                <span style={{ color: "#a08060" }}> — {p.citationCount}</span>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <dt style={{ fontSize: 13, color: "#a08060" }}>{label}</dt>
      <dd style={{ margin: 0, fontFamily: SERIF, fontSize: 20, color: "#7c4a21" }}>
        {value.toLocaleString()}
      </dd>
    </div>
  );
}
