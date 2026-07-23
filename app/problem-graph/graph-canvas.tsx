// src/app/problem-graph/graph-canvas.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Force-directed collaboration map (client). Physics: d3-force.
// Rendering: plain SVG (no d3 DOM dependency), so React owns the elements.
//   - responsive via ResizeObserver (recenters the force)
//   - drag nodes to untangle; click a node for its collaborator popover
//   - edge width/opacity scale with similarity
// Requires: npm i d3-force  (+ @types/d3-force for dev)
// ─────────────────────────────────────────────────────────────────────────────

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type Simulation,
  type SimulationNodeDatum,
} from "d3-force";
import {
  colorForCategory,
  topNeighbors,
  CATEGORY_COLORS,
  type GraphNodeDatum,
  type GraphEdgeDatum,
} from "@/lib/problem-graph";

interface SimNode extends GraphNodeDatum, SimulationNodeDatum {}
interface SimLink {
  source: SimNode;
  target: SimNode;
  similarity: number;
}

export function GraphCanvas({
  nodes,
  links,
}: {
  nodes: GraphNodeDatum[];
  links: GraphEdgeDatum[];
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 960, h: 560 });
  const [, setTick] = useState(0); // re-render on simulation ticks
  const [selected, setSelected] = useState<{ node: SimNode; x: number; y: number } | null>(null);
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const simNodesRef = useRef<SimNode[]>([]);
  const simLinksRef = useRef<SimLink[]>([]);
  const dragRef = useRef<SimNode | null>(null);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  // Responsive: observe the wrapper and keep size in sync.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.max(320, Math.floor(entry.contentRect.width));
      setSize((s) => (s.w === w ? s : { w, h: Math.max(420, Math.min(640, Math.round(w * 0.58))) }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Build / rebuild the simulation whenever data or size changes.
  useEffect(() => {
    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const nodeById = new Map(simNodes.map((n) => [n.id, n]));
    const simLinks: SimLink[] = links
      .map((l) => ({
        source: nodeById.get(l.source)!,
        target: nodeById.get(l.target)!,
        similarity: l.similarity,
      }))
      .filter((l) => l.source && l.target);

    const sim = forceSimulation<SimNode>(simNodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance((l) => 150 - l.similarity * 70) // closer together = more alike
          .strength((l) => l.similarity)
      )
      .force("charge", forceManyBody().strength(-320))
      .force("center", forceCenter(size.w / 2, size.h / 2))
      .force("collide", forceCollide(30))
      .on("tick", () => setTick((t) => t + 1));

    simRef.current = sim;
    simNodesRef.current = simNodes;
    simLinksRef.current = simLinks;
    return () => {
      sim.stop();
    };
  }, [nodes, links, size]);

  function svgPoint(e: React.PointerEvent): { x: number; y: number } {
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * size.w,
      y: ((e.clientY - rect.top) / rect.height) * size.h,
    };
  }

  function onNodePointerDown(e: React.PointerEvent, n: SimNode) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = n;
    simRef.current?.alphaTarget(0.3).restart();
    n.fx = n.x;
    n.fy = n.y;
  }

  function onPointerMove(e: React.PointerEvent) {
    const n = dragRef.current;
    if (!n) return;
    const p = svgPoint(e);
    n.fx = p.x;
    n.fy = p.y;
  }

  function onPointerUp() {
    const n = dragRef.current;
    if (n) {
      n.fx = null;
      n.fy = null;
    }
    dragRef.current = null;
    simRef.current?.alphaTarget(0);
  }

  function onNodeClick(e: React.MouseEvent, n: SimNode) {
    e.stopPropagation();
    setSelected({ node: n, x: n.x ?? 0, y: n.y ?? 0 });
  }

  const neighbors = selected ? topNeighbors(selected.node.id, links) : [];

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <svg
        viewBox={`0 0 ${size.w} ${size.h}`}
        width="100%"
        height={size.h}
        role="img"
        aria-label="Force-directed graph of research projects connected by topic similarity"
        style={{
          background: "#fffdf8",
          border: "1px solid #eadfce",
          borderRadius: 16,
          display: "block",
          touchAction: "none",
        }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClick={() => setSelected(null)}
      >
        {/* edges */}
        {simLinksRef.current.map((l, i) => (
          <line
            key={i}
            x1={l.source.x ?? 0}
            y1={l.source.y ?? 0}
            x2={l.target.x ?? 0}
            y2={l.target.y ?? 0}
            stroke="#b7a68d"
            strokeWidth={1 + l.similarity * 3}
            strokeOpacity={0.25 + l.similarity * 0.5}
          />
        ))}

        {/* nodes */}
        {simNodesRef.current.map((n) => (
          <g
            key={n.id}
            transform={`translate(${n.x ?? 0}, ${n.y ?? 0})`}
            style={{ cursor: "grab" }}
            onPointerDown={(e) => onNodePointerDown(e, n)}
            onClick={(e) => onNodeClick(e, n)}
          >
            <circle
              r={16}
              fill={colorForCategory(n.category)}
              stroke={selected?.node.id === n.id ? "#7c4a21" : "#fffdf8"}
              strokeWidth={selected?.node.id === n.id ? 3 : 2}
            />
            <title>{n.title}</title>
          </g>
        ))}
      </svg>

      {/* Collaborator popover */}
      {selected && (
        <div
          role="dialog"
          aria-label={`Project: ${selected.node.title}`}
          style={{
            position: "absolute",
            left: Math.min(Math.max(12, (selected.x / size.w) * 100), 62) + "%",
            top: Math.min(Math.max(8, (selected.y / size.h) * 100), 68) + "%",
            width: 260,
            background: "#fffdf8",
            border: "1px solid #eadfce",
            borderRadius: 14,
            boxShadow: "0 14px 40px rgba(87, 65, 38, 0.18)",
            padding: 16,
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <strong style={{ display: "block", fontSize: 14, marginBottom: 4 }}>
            {selected.node.title}
          </strong>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 700,
              color: "#7c4a21",
              background: colorForCategory(selected.node.category),
              borderRadius: 999,
              padding: "2px 10px",
              marginBottom: 10,
            }}
          >
            {selected.node.category ?? "Other"}
          </span>

          {neighbors.length > 0 && (
            <p style={{ fontSize: 12, color: "#78716c", margin: "0 0 10px", lineHeight: 1.5 }}>
              Potential collaborators:{" "}
              {neighbors
                .map((nb) => byId.get(nb.id)?.title ?? "Untitled")
                .join(" · ")}
            </p>
          )}

          {/* TODO: point at your real project route when one exists. */}
          <a
            href={`/projects/${selected.node.id}`}
            style={{
              display: "block",
              textAlign: "center",
              textDecoration: "none",
              fontWeight: 700,
              fontSize: 13,
              padding: "9px 12px",
              borderRadius: 10,
              color: "#fffdf8",
              background: "#9a6b3f",
            }}
          >
            View Details →
          </a>
        </div>
      )}

      {/* Legend */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          marginTop: 14,
          justifyContent: "center",
          fontSize: 12,
          color: "#78716c",
        }}
      >
        {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
          <span key={cat} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 12, height: 12, borderRadius: "50%", background: color, border: "1px solid #fffdf8" }} />
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </span>
        ))}
      </div>
    </div>
  );
}
