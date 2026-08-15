/**
 * StructureGraph — discrete, buildable topology for Forge.
 * Nodes + edges map 1:1 onto catalog stock after subdivision.
 * Phase 1 foundation for Eiffel-scale (and any) lattice structures.
 */

import type { CatalogItem, JoinMethod } from "./types";
import { toPrimitive } from "./geometry";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface StructureNode {
  id: string;
  position: Vec3;
  /** Optional semantic role for instructions */
  role?: "base" | "leg" | "brace" | "ring" | "platform" | "tip" | "splice";
}

export interface StructureEdge {
  id: string;
  from: string;
  to: string;
  /** How these two ends meet in the real world */
  join: JoinMethod;
  /** Structural importance for sequencing / warnings */
  critical?: boolean;
  role?: "leg" | "brace" | "ring" | "rail" | "splice" | "deck";
}

export interface StructureGraph {
  id: string;
  name: string;
  /** Target envelope in inches */
  envelope: { width: number; height: number; depth: number };
  materialId: string;
  nodes: StructureNode[];
  edges: StructureEdge[];
  /** Human-readable build assumptions */
  assumptions: string[];
  notes: string[];
  structureClass:
    | "lattice_tower"
    | "eiffel"
    | "pyramid"
    | "frame"
    | "shell"
    | "generic";
}

/** Local prompt-side instance (tuple rotation) before page maps to DesignJson */
export interface GraphInstance {
  id: string;
  catalogId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  cutLength?: number;
  join?: JoinMethod;
  role?: string;
}

function dist(a: Vec3, b: Vec3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function mid(a: Vec3, b: Vec3): Vec3 {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Orient a stick (box: long axis = X) or cylinder (long axis = Y)
 * so its long axis matches vector from → to.
 */
export function rotationForDirection(
  from: Vec3,
  to: Vec3,
  cylindrical: boolean
): [number, number, number] {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const uz = dz / len;

  if (cylindrical) {
    // Default cylinder axis = +Y. Rotate Y → direction.
    const yaw = Math.atan2(ux, uz);
    const pitch = Math.asin(Math.max(-1, Math.min(1, uy)));
    // Three.js Euler XYZ: pitch around X, then...
    // Simpler: rotation order that works for vertical/angled posts
    const rx = Math.atan2(uz, uy); // tip toward Z when vertical-ish
    const rz = Math.atan2(ux, uy);
    // Prefer Y-up cylinder: use X and Z tilts
    const outRx = -Math.atan2(uz, Math.sqrt(ux * ux + uy * uy) || 1e-6);
    const outRz = Math.atan2(ux, uy);
    // Classic lookAt-style for Y-up:
    const polar = Math.acos(Math.max(-1, Math.min(1, uy))); // 0 = up
    const azim = Math.atan2(ux, uz);
    return [polar, azim, 0];
  }

  // Box long axis = +X. Map +X → direction.
  const yaw = Math.atan2(uz, ux); // around Y
  const pitch = Math.asin(Math.max(-1, Math.min(1, -uy))); // around Z-ish
  // Euler XYZ approximation:
  const ry = Math.atan2(uz, ux);
  const rz = Math.atan2(-uy, Math.sqrt(ux * ux + uz * uz) || 1e-6);
  return [0, ry, rz];
}

/**
 * Convert graph edges into catalog instances.
 * Long edges are subdivided into stock-length pieces with splice joins.
 */
export function graphToInstances(
  graph: StructureGraph,
  item: CatalogItem
): { instances: GraphInstance[]; joinSummary: string[]; spliceCount: number } {
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
  const prim = toPrimitive(item);
  const stock = Math.max(0.5, prim.length);
  const cylindrical =
    item.formFactor === "tube" ||
    item.formFactor === "pipe" ||
    item.formFactor === "dowel";
  const canCut = item.canCut ?? true;
  const defaultJoin: JoinMethod =
    (item.preferredJoins && item.preferredJoins[0]) || "glue";

  const instances: GraphInstance[] = [];
  let spliceCount = 0;
  const joinCounts = new Map<string, number>();

  const bumpJoin = (j: JoinMethod) =>
    joinCounts.set(j, (joinCounts.get(j) ?? 0) + 1);

  for (const edge of graph.edges) {
    const a = nodeMap.get(edge.from);
    const b = nodeMap.get(edge.to);
    if (!a || !b) continue;

    const length = dist(a.position, b.position);
    if (length < 0.15) continue;

    const join = edge.join || defaultJoin;
    bumpJoin(join);

    // How many stock pieces along this edge
    const segments =
      canCut && length > stock * 1.02
        ? Math.ceil(length / stock)
        : 1;
    const segLen = length / segments;

    for (let s = 0; s < segments; s++) {
      const t0 = s / segments;
      const t1 = (s + 1) / segments;
      const p0 = lerp(a.position, b.position, t0);
      const p1 = lerp(a.position, b.position, t1);
      const m = mid(p0, p1);
      const rot = rotationForDirection(p0, p1, cylindrical);
      const cut =
        canCut && Math.abs(segLen - stock) > 0.05
          ? Math.min(segLen, stock)
          : undefined;

      if (s > 0) spliceCount += 1;

      instances.push({
        id: `${edge.id}-s${s}`,
        catalogId: graph.materialId,
        position: [m.x, m.y, m.z],
        rotation: rot,
        cutLength: cut,
        join: s > 0 ? "glue" : join, // splices always glued/overlapped
        role: s > 0 ? "splice" : edge.role,
      });
    }
  }

  const joinSummary = [...joinCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([j, n]) => `${n}× ${j}`);

  return { instances, joinSummary, spliceCount };
}

export function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
