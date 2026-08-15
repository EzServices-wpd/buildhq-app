/**
 * Parametric lattice tower / Eiffel-class structure.
 * True-scale envelope: pass targetHeightIn (e.g. 36 for a 3-ft model).
 * Topology: 4 tapering legs + horizontal rings + X-bracing — mapped later
 * onto discrete catalog stock via StructureGraph → graphToInstances.
 */

import type { CatalogItem, JoinMethod } from "../types";
import {
  StructureGraph,
  StructureNode,
  StructureEdge,
  createId,
  Vec3,
} from "../structureGraph";
import { toPrimitive } from "../geometry";

export interface LatticeTowerOptions {
  targetHeightIn: number;
  /** Base width as fraction of height. Real Eiffel ≈ 0.386 */
  baseRatio?: number;
  /** Tip width as fraction of base */
  tipRatio?: number;
  /** Vertical bay count (auto if omitted) */
  levels?: number;
  /** Add platform rings at intermediate heights */
  platforms?: boolean;
  materialId: string;
  item: CatalogItem;
  name?: string;
  /** Force eiffel proportions + denser bracing */
  eiffel?: boolean;
}

/**
 * Build a scaled lattice tower graph.
 * Density adapts to stock length so short sticks get more bays.
 */
export function buildLatticeTowerGraph(
  opts: LatticeTowerOptions
): StructureGraph {
  const H = Math.max(6, Math.min(opts.targetHeightIn, 144));
  const baseRatio = opts.baseRatio ?? (opts.eiffel ? 0.386 : 0.45);
  const tipRatio = opts.tipRatio ?? (opts.eiffel ? 0.08 : 0.15);
  const baseW = H * baseRatio;
  const tipW = baseW * tipRatio;
  const prim = toPrimitive(opts.item);
  const stock = Math.max(1, prim.length);

  // Bay height ≈ 0.7–1.2× stock so legs need few splices per bay
  const idealBay = Math.max(stock * 0.85, H / 12);
  const autoLevels = Math.max(4, Math.round(H / idealBay));
  const levels = Math.min(18, Math.max(3, opts.levels ?? autoLevels));

  const joinPrimary: JoinMethod =
    (opts.item.preferredJoins && opts.item.preferredJoins[0]) || "glue";
  const joinBrace: JoinMethod =
    joinPrimary === "solvent" ? "solvent" : joinPrimary === "screw" ? "screw" : "glue";

  const nodes: StructureNode[] = [];
  const edges: StructureEdge[] = [];

  const cornerIds: string[][] = []; // [level][corner 0..3]

  for (let L = 0; L <= levels; L++) {
    const t = L / levels;
    // Eiffel-ish ease: wider longer near base
    const ease = opts.eiffel ? Math.pow(1 - t, 1.35) : 1 - t;
    const half = (tipW / 2) + (baseW / 2 - tipW / 2) * ease;
    const y = t * H;
    const row: string[] = [];
    for (let c = 0; c < 4; c++) {
      const a = (c / 4) * Math.PI * 2 + Math.PI / 4; // corners of square
      const id = createId(`n${L}c${c}`);
      const pos: Vec3 = {
        x: Math.cos(a) * half,
        y,
        z: Math.sin(a) * half,
      };
      nodes.push({
        id,
        position: pos,
        role: L === 0 ? "base" : L === levels ? "tip" : "leg",
      });
      row.push(id);
    }
    cornerIds.push(row);

    // Horizontal ring at this level
    for (let c = 0; c < 4; c++) {
      edges.push({
        id: createId(`ring-${L}-${c}`),
        from: row[c],
        to: row[(c + 1) % 4],
        join: joinPrimary,
        role: "ring",
        critical: L === 0 || L === levels,
      });
    }

    // Optional platform cross (mid levels)
    if (
      opts.platforms !== false &&
      (L === Math.floor(levels / 3) || L === Math.floor((2 * levels) / 3))
    ) {
      edges.push({
        id: createId(`plat-a-${L}`),
        from: row[0],
        to: row[2],
        join: joinPrimary,
        role: "rail",
      });
      edges.push({
        id: createId(`plat-b-${L}`),
        from: row[1],
        to: row[3],
        join: joinPrimary,
        role: "rail",
      });
    }
  }

  // Legs + X braces between levels
  for (let L = 0; L < levels; L++) {
    for (let c = 0; c < 4; c++) {
      // Vertical / near-vertical leg segment
      edges.push({
        id: createId(`leg-${L}-${c}`),
        from: cornerIds[L][c],
        to: cornerIds[L + 1][c],
        join: joinPrimary,
        role: "leg",
        critical: true,
      });
      // X-brace to next corner
      edges.push({
        id: createId(`brace-${L}-${c}a`),
        from: cornerIds[L][c],
        to: cornerIds[L + 1][(c + 1) % 4],
        join: joinBrace,
        role: "brace",
      });
      // Optional opposing diagonal for denser Eiffel bracing
      if (opts.eiffel || levels <= 10) {
        edges.push({
          id: createId(`brace-${L}-${c}b`),
          from: cornerIds[L][(c + 1) % 4],
          to: cornerIds[L + 1][c],
          join: joinBrace,
          role: "brace",
        });
      }
    }
  }

  // Tiny tip spire / finial node
  const tipId = createId("tip");
  nodes.push({
    id: tipId,
    position: { x: 0, y: H + stock * 0.35, z: 0 },
    role: "tip",
  });
  for (let c = 0; c < 4; c++) {
    edges.push({
      id: createId(`finial-${c}`),
      from: cornerIds[levels][c],
      to: tipId,
      join: joinPrimary,
      role: "leg",
    });
  }

  const name =
    opts.name ??
    (opts.eiffel
      ? `Eiffel lattice · ${H.toFixed(0)}" high`
      : `Lattice tower · ${H.toFixed(0)}" high`);

  const assumptions = [
    `Scale: ${H.toFixed(0)}" overall height (true scale).`,
    `Base footprint ≈ ${baseW.toFixed(1)}" square (${(baseRatio * 100).toFixed(0)}% of height).`,
    `Primary join: ${joinPrimary} at nodes; splices along long members use ${joinPrimary} + overlap.`,
    `Stock length ${stock.toFixed(2)}" (${opts.item.name}) — long members auto-spliced.`,
    opts.eiffel
      ? "Proportions follow Eiffel-class taper (wide base, narrow tip, denser bracing)."
      : "Generic lattice taper.",
  ];

  return {
    id: createId("graph"),
    name,
    envelope: {
      width: baseW,
      height: H + stock * 0.5,
      depth: baseW,
    },
    materialId: opts.materialId,
    nodes,
    edges,
    assumptions,
    notes: [
      name,
      `${levels} vertical bays · 4 legs · rings + X-bracing`,
      `${nodes.length} nodes · ${edges.length} members (before stock subdivision)`,
    ],
    structureClass: opts.eiffel ? "eiffel" : "lattice_tower",
  };
}
