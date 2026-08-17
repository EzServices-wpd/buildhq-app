/**
 * StructureGraph core — create, validate, measure, transform graphs of sticks
 * BuildHq 0.7.2
 */

import type {
  StructureGraph,
  StructureNode,
  StructureEdge,
  NodeId,
  EdgeId,
  Vec3,
  MaterialProfile,
} from '../../types/structure.js';

export function createEmptyGraph(name: string, id?: string): StructureGraph {
  return {
    id: id ?? `sg-${Date.now().toString(36)}`,
    name,
    nodes: [],
    edges: [],
    units: 'mm',
  };
}

export function addNode(
  graph: StructureGraph,
  position: Vec3,
  opts: Partial<StructureNode> = {}
): StructureNode {
  const node: StructureNode = {
    id: opts.id ?? `n-${graph.nodes.length + 1}`,
    position: [...position] as Vec3,
    role: opts.role,
    label: opts.label,
  };
  graph.nodes.push(node);
  return node;
}

export function distance(a: Vec3, b: Vec3): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const dz = b[2] - a[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function addEdge(
  graph: StructureGraph,
  fromId: NodeId,
  toId: NodeId,
  profile: MaterialProfile,
  opts: Partial<StructureEdge> = {}
): StructureEdge {
  const from = graph.nodes.find((n) => n.id === fromId);
  const to = graph.nodes.find((n) => n.id === toId);
  if (!from || !to) {
    throw new Error(`Cannot add edge: node ${fromId} or ${toId} missing`);
  }
  const lengthMm = distance(from.position, to.position);
  const edge: StructureEdge = {
    id: opts.id ?? `e-${graph.edges.length + 1}`,
    from: fromId,
    to: toId,
    lengthMm,
    profile,
    jointAtFrom: opts.jointAtFrom,
    jointAtTo: opts.jointAtTo,
    role: opts.role,
    cutAngleFromDeg: opts.cutAngleFromDeg ?? 0,
    cutAngleToDeg: opts.cutAngleToDeg ?? 0,
  };
  graph.edges.push(edge);
  return edge;
}

export function computeBoundingBox(graph: StructureGraph): { min: Vec3; max: Vec3 } {
  if (graph.nodes.length === 0) {
    return { min: [0, 0, 0], max: [0, 0, 0] };
  }
  let minX = Infinity,
    minY = Infinity,
    minZ = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity,
    maxZ = -Infinity;
  for (const n of graph.nodes) {
    const [x, y, z] = n.position;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }
  return { min: [minX, minY, minZ], max: [maxX, maxY, maxZ] };
}

export function validateGraph(graph: StructureGraph): string[] {
  const warnings: string[] = [];
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  for (const e of graph.edges) {
    if (!nodeIds.has(e.from)) warnings.push(`Edge ${e.id} references missing from-node ${e.from}`);
    if (!nodeIds.has(e.to)) warnings.push(`Edge ${e.id} references missing to-node ${e.to}`);
    if (e.lengthMm <= 0) warnings.push(`Edge ${e.id} has non-positive length ${e.lengthMm}`);
    if (e.lengthMm > 6000) warnings.push(`Edge ${e.id} is very long (${e.lengthMm} mm) — check scale`);
  }
  // orphan nodes
  const connected = new Set<string>();
  for (const e of graph.edges) {
    connected.add(e.from);
    connected.add(e.to);
  }
  for (const n of graph.nodes) {
    if (!connected.has(n.id) && graph.nodes.length > 1) {
      warnings.push(`Orphan node ${n.id}`);
    }
  }
  return warnings;
}

export function totalStickLengthM(graph: StructureGraph): number {
  return graph.edges.reduce((sum, e) => sum + e.lengthMm, 0) / 1000;
}

export function cloneGraph(graph: StructureGraph): StructureGraph {
  return structuredClone(graph);
}

/** Recompute all edge lengths from current node positions (after transform) */
export function recomputeLengths(graph: StructureGraph): void {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  for (const e of graph.edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (a && b) {
      e.lengthMm = distance(a.position, b.position);
    }
  }
}

export function scaleGraph(graph: StructureGraph, factor: number): void {
  for (const n of graph.nodes) {
    n.position = [n.position[0] * factor, n.position[1] * factor, n.position[2] * factor];
  }
  recomputeLengths(graph);
  graph.boundingBox = computeBoundingBox(graph);
}
