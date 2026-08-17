/**
 * forgeReport — Universal Help Me Build
 * Routes any StructureGraph + ForgeInstance[] → full BOM / cuts / joins / role-ordered steps
 * BuildHq 0.7.2 — richer steps, better joint inference, hardware suggestions
 */

import type {
  StructureGraph,
  ForgeInstance,
  ForgeReport,
  CutListItem,
  JoinSpec,
  BomLine,
  BuildStep,
  HardwareItem,
  JointType,
  NodeId,
  EdgeId,
  MaterialProfile,
} from '../../types/structure.js';
import { totalStickLengthM, validateGraph } from '../structure/StructureGraph.js';

const REPORT_VERSION = '0.7.2';

/** Infer a sensible joint type when not specified on the edge */
function inferJoint(edgeRole?: string, nodeRole?: string): JointType {
  if (nodeRole === 'base' || nodeRole === 'anchor') return 'bracket';
  if (edgeRole === 'diagonal' || edgeRole === 'brace') return 'gusset';
  if (edgeRole === 'leg' || edgeRole === 'post') return 'bolt-plate';
  if (edgeRole === 'rung' || edgeRole === 'rail') return 'half-lap';
  return 'butt';
}

/** Hardware suggestions by joint type (simple starter catalog) */
function hardwareForJoint(joint: JointType, edgeCount: number): HardwareItem[] {
  const base: Record<JointType, HardwareItem[]> = {
    butt: [{ sku: 'screw-wood-8x50', name: 'Wood screws 8×50 mm', qty: 2 * edgeCount, unit: 'ea' }],
    lap: [{ sku: 'screw-wood-8x40', name: 'Wood screws 8×40 mm', qty: 2 * edgeCount, unit: 'ea' }],
    miter: [{ sku: 'screw-wood-8x50', name: 'Wood screws 8×50 mm', qty: 2 * edgeCount, unit: 'ea' }],
    scarf: [{ sku: 'bolt-m8-80', name: 'M8×80 carriage bolts + nuts', qty: 2, unit: 'ea' }],
    'mortise-tenon': [{ sku: 'dowel-10x40', name: 'Hardwood dowels 10×40', qty: 2, unit: 'ea' }],
    'half-lap': [{ sku: 'screw-wood-8x40', name: 'Wood screws 8×40 mm', qty: 2 * edgeCount, unit: 'ea' }],
    'bolt-plate': [
      { sku: 'bolt-m8-60', name: 'M8×60 hex bolts + nuts + washers', qty: Math.max(2, edgeCount), unit: 'ea' },
      { sku: 'plate-steel-flat', name: 'Steel flat connector plates', qty: 1, unit: 'ea' },
    ],
    bracket: [
      { sku: 'bracket-angle-50', name: 'Angle brackets 50 mm', qty: Math.max(1, edgeCount), unit: 'ea' },
      { sku: 'screw-wood-8x25', name: 'Wood screws 8×25 mm', qty: 4 * Math.max(1, edgeCount), unit: 'ea' },
    ],
    gusset: [
      { sku: 'gusset-ply-100', name: 'Plywood gusset plates ~100 mm', qty: 1, unit: 'ea' },
      { sku: 'screw-wood-8x30', name: 'Wood screws 8×30 mm', qty: 6, unit: 'ea' },
    ],
    'weld-sim': [],
    clamp: [{ sku: 'clamp-pipe-25', name: 'Pipe / scaffolding clamps', qty: Math.max(1, edgeCount), unit: 'ea' }],
  };
  return base[joint] ?? base.butt;
}

function profileKey(p: MaterialProfile): string {
  return `${p.sku}|${p.section}|${p.material}`;
}

/**
 * Build the cut list — groups identical lengths + profile + angles
 */
function buildCutList(graph: StructureGraph): CutListItem[] {
  const map = new Map<string, CutListItem>();
  for (const e of graph.edges) {
    const key = [
      profileKey(e.profile),
      Math.round(e.lengthMm),
      e.cutAngleFromDeg ?? 0,
      e.cutAngleToDeg ?? 0,
      e.role ?? '',
    ].join('|');
    const existing = map.get(key);
    if (existing) {
      existing.quantity += 1;
    } else {
      map.set(key, {
        id: `cut-${map.size + 1}`,
        edgeId: e.id,
        profile: e.profile,
        lengthMm: Math.round(e.lengthMm * 10) / 10,
        quantity: 1,
        cutAngleFromDeg: e.cutAngleFromDeg ?? 0,
        cutAngleToDeg: e.cutAngleToDeg ?? 0,
        role: e.role,
        notes: e.role ? `Role: ${e.role}` : undefined,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.lengthMm - a.lengthMm);
}

/**
 * Build join specs per node — which edges meet, joint type, hardware
 */
function buildJoins(graph: StructureGraph): JoinSpec[] {
  const byNode = new Map<NodeId, EdgeId[]>();
  for (const e of graph.edges) {
    if (!byNode.has(e.from)) byNode.set(e.from, []);
    if (!byNode.has(e.to)) byNode.set(e.to, []);
    byNode.get(e.from)!.push(e.id);
    byNode.get(e.to)!.push(e.id);
  }

  const nodeById = new Map(graph.nodes.map((n) => [n.id, n]));
  const edgeById = new Map(graph.edges.map((e) => [e.id, e]));

  const joins: JoinSpec[] = [];
  let order = 1;

  // Prefer base → intermediate → apex ordering
  const roleOrder = (r?: string) =>
    r === 'base' || r === 'anchor' ? 0 : r === 'apex' ? 2 : 1;

  const sortedNodes = [...graph.nodes].sort(
    (a, b) => roleOrder(a.role) - roleOrder(b.role) || a.id.localeCompare(b.id)
  );

  for (const node of sortedNodes) {
    const edgeIds = byNode.get(node.id) ?? [];
    if (edgeIds.length === 0) continue;

    // Majority vote on joint type from incident edges
    const votes = new Map<JointType, number>();
    for (const eid of edgeIds) {
      const e = edgeById.get(eid)!;
      const jt =
        (e.from === node.id ? e.jointAtFrom : e.jointAtTo) ??
        inferJoint(e.role, node.role);
      votes.set(jt, (votes.get(jt) ?? 0) + 1);
    }
    let best: JointType = 'butt';
    let bestCount = 0;
    for (const [jt, c] of votes) {
      if (c > bestCount) {
        best = jt;
        bestCount = c;
      }
    }

    joins.push({
      nodeId: node.id,
      edges: edgeIds,
      jointType: best,
      hardware: hardwareForJoint(best, edgeIds.length),
      notes: node.label ? `Node ${node.label}` : undefined,
      sequenceOrder: order++,
    });
  }
  return joins;
}

/**
 * Aggregate BOM from cut list + join hardware
 */
function buildBom(cutList: CutListItem[], joins: JoinSpec[]): BomLine[] {
  const lumber = new Map<string, BomLine>();
  for (const c of cutList) {
    const key = profileKey(c.profile);
    const existing = lumber.get(key);
    // Approximate linear meters needed (with 5% waste later)
    const meters = (c.lengthMm * c.quantity) / 1000;
    if (existing) {
      existing.qty += meters;
    } else {
      lumber.set(key, {
        sku: c.profile.sku,
        name: c.profile.name,
        qty: meters,
        unit: 'm',
        category: 'lumber',
        notes: `${c.profile.section} ${c.profile.material}`,
      });
    }
  }
  // Round lumber qty up and add waste
  for (const line of lumber.values()) {
    line.qty = Math.ceil(line.qty * 1.08 * 10) / 10; // 8% waste
  }

  const hardware = new Map<string, BomLine>();
  for (const j of joins) {
    for (const h of j.hardware) {
      const existing = hardware.get(h.sku);
      if (existing) {
        existing.qty += h.qty;
      } else {
        hardware.set(h.sku, {
          sku: h.sku,
          name: h.name,
          qty: h.qty,
          unit: h.unit,
          category: 'hardware',
        });
      }
    }
  }

  return [...lumber.values(), ...hardware.values()];
}

/**
 * Role-ordered build steps — foundation → legs → bracing → rings → platforms → finish
 */
function buildSteps(graph: StructureGraph, joins: JoinSpec[]): BuildStep[] {
  const steps: BuildStep[] = [];
  let order = 1;

  const nodesByRole = (role: string) =>
    graph.nodes.filter((n) => n.role === role).map((n) => n.id);
  const edgesByRole = (role: string) =>
    graph.edges.filter((e) => e.role === role).map((e) => e.id);

  // 1. Layout / foundation
  const baseNodes = nodesByRole('base');
  if (baseNodes.length) {
    steps.push({
      order: order++,
      role: 'foundation',
      title: 'Layout base and mark positions',
      description:
        'Mark the base footprint on the ground or floor. Ensure square and level. Place temporary stakes or mark for the four (or more) base posts.',
      relatedNodeIds: baseNodes,
      relatedEdgeIds: [],
      tools: ['tape measure', 'square', 'chalk line', 'level'],
      safetyNotes: ['Confirm ground is firm and level before proceeding.'],
      estimatedMinutes: 20,
    });
  }

  // 2. Erect legs / posts
  const legEdges = edgesByRole('leg');
  if (legEdges.length) {
    steps.push({
      order: order++,
      role: 'legs',
      title: 'Cut and erect primary legs / posts',
      description:
        'Cut all leg members to length (see cut list). Stand the vertical posts, temporarily brace them plumb, and secure base joints.',
      relatedNodeIds: baseNodes,
      relatedEdgeIds: legEdges,
      tools: ['circular saw or miter saw', 'drill/driver', 'level', 'temporary clamps'],
      safetyNotes: ['Work with a partner when raising long posts.', 'Wear eye protection when cutting.'],
      estimatedMinutes: 45 + legEdges.length * 5,
    });
  }

  // 3. Rings / horizontals
  const chordEdges = edgesByRole('chord');
  if (chordEdges.length) {
    steps.push({
      order: order++,
      role: 'rings',
      title: 'Install horizontal ring beams / chords',
      description:
        'Install the horizontal members at each level. Check that each ring is level and the structure remains square as you go up.',
      relatedNodeIds: [],
      relatedEdgeIds: chordEdges,
      tools: ['level', 'clamp', 'drill/driver'],
      estimatedMinutes: 30 + chordEdges.length * 3,
    });
  }

  // 4. Diagonal bracing
  const diagEdges = edgesByRole('diagonal');
  if (diagEdges.length) {
    steps.push({
      order: order++,
      role: 'bracing',
      title: 'Add cross bracing and gussets',
      description:
        'Fit the diagonal braces on each face. Use gusset plates or recommended connectors at the joints. Tighten progressively so the frame stays true.',
      relatedNodeIds: [],
      relatedEdgeIds: diagEdges,
      tools: ['drill/driver', 'clamps', 'square'],
      safetyNotes: ['Do not climb the structure until bracing is complete and secure.'],
      estimatedMinutes: 40 + diagEdges.length * 4,
    });
  }

  // 5. Beams / platforms
  const beamEdges = edgesByRole('beam');
  if (beamEdges.length) {
    steps.push({
      order: order++,
      role: 'platform',
      title: 'Install platform beams and deck framing',
      description:
        'Add the cross beams that support the platform or shelf. If full decking is desired, add joists and deck boards (not auto-generated in this graph).',
      relatedNodeIds: nodesByRole('apex').concat(nodesByRole('platform')),
      relatedEdgeIds: beamEdges,
      tools: ['drill/driver', 'level'],
      estimatedMinutes: 30,
    });
  }

  // 6. Remaining joins / hardware pass
  if (joins.length) {
    steps.push({
      order: order++,
      role: 'joinery',
      title: 'Final joint hardware and torque check',
      description:
        'Install or tighten all remaining bolts, screws, and plates according to the join list. Verify every connection is secure.',
      relatedNodeIds: joins.map((j) => j.nodeId),
      relatedEdgeIds: [],
      tools: ['socket set / wrenches', 'driver bits'],
      estimatedMinutes: 25 + joins.length * 2,
    });
  }

  // 7. Finish
  steps.push({
    order: order++,
    role: 'finish',
    title: 'Inspect, sand, and finish',
    description:
      'Sand any rough cuts. Apply exterior finish or paint if outdoor. Final safety inspection: plumb, level, all fasteners tight, no sharp edges at contact points.',
    relatedNodeIds: [],
    relatedEdgeIds: [],
    tools: ['sandpaper', 'brush or roller'],
    safetyNotes: ['Re-check all structural fasteners after first week of use.'],
    estimatedMinutes: 40,
  });

  return steps;
}

function estimateCost(bom: BomLine[]): number {
  // Rough unit costs (USD) — placeholder catalog
  const unitCost: Record<string, number> = {
    'pine-2x4': 3.5, // per m
    'pine-1x3': 2.2,
    'pine-1x2': 1.5,
    'pine-2x2': 2.0,
    'pine-4x4': 7.0,
    'screw-wood-8x50': 0.08,
    'screw-wood-8x40': 0.07,
    'screw-wood-8x30': 0.06,
    'screw-wood-8x25': 0.05,
    'bolt-m8-60': 0.45,
    'bolt-m8-80': 0.55,
    'plate-steel-flat': 2.5,
    'bracket-angle-50': 1.8,
    'gusset-ply-100': 1.2,
    'clamp-pipe-25': 4.5,
    'dowel-10x40': 0.15,
  };
  let total = 0;
  for (const line of bom) {
    const c = unitCost[line.sku] ?? (line.category === 'lumber' ? 3.0 : 0.5);
    total += c * line.qty;
  }
  return Math.round(total * 100) / 100;
}

function estimateWeightKg(graph: StructureGraph): number {
  let kg = 0;
  for (const e of graph.edges) {
    const dens = e.profile.densityKgPerM3 ?? 500;
    const areaM2 = (e.profile.widthMm / 1000) * (e.profile.heightMm / 1000);
    const vol = areaM2 * (e.lengthMm / 1000);
    kg += dens * vol;
  }
  return Math.round(kg * 10) / 10;
}

/**
 * Main entry — Universal Help Me Build
 * Accepts a primary graph (and optional instances for multi-copy projects).
 * Instances currently share the same graph topology; material overrides are noted but
 * full multi-material merge is a future enhancement.
 */
export function generateForgeReport(
  graph: StructureGraph,
  instances: ForgeInstance[] = [],
  opts: { projectName?: string } = {}
): ForgeReport {
  const warnings = validateGraph(graph);

  if (instances.length === 0) {
    // Implicit single instance at origin
    instances = [
      {
        id: `fi-auto-${graph.id}`,
        graphId: graph.id,
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: 1 },
      },
    ];
  }

  // For now we report against the primary graph topology.
  // Multi-instance BOM multiplies quantities by instance count (simple approximation).
  const instanceMultiplier = Math.max(1, instances.length);

  const cutList = buildCutList(graph).map((c) => ({
    ...c,
    quantity: c.quantity * instanceMultiplier,
  }));
  const joins = buildJoins(graph);
  const bom = buildBom(cutList, joins);
  // Scale hardware for multiple instances (joins are topology-level; multiply qty)
  if (instanceMultiplier > 1) {
    for (const line of bom) {
      if (line.category === 'hardware') line.qty *= instanceMultiplier;
    }
  }

  const steps = buildSteps(graph, joins);
  const totalLen = totalStickLengthM(graph) * instanceMultiplier;

  return {
    version: REPORT_VERSION,
    generatedAt: new Date().toISOString(),
    graph,
    instances,
    cutList,
    joins,
    bom,
    steps,
    totals: {
      totalStickLengthM: Math.round(totalLen * 100) / 100,
      estimatedWeightKg: estimateWeightKg(graph) * instanceMultiplier,
      estimatedCostUsd: estimateCost(bom),
      stepCount: steps.length,
    },
    warnings,
  };
}

/** Pretty-print a short summary for console / UI toast */
export function reportSummary(report: ForgeReport): string {
  const { totals, cutList, steps, bom } = report;
  return [
    `BuildHq Forge Report v${report.version}`,
    `Graph: ${report.graph.name} (${report.graph.nodes.length} nodes, ${report.graph.edges.length} sticks)`,
    `Instances: ${report.instances.length}`,
    `Cut list: ${cutList.length} unique pieces`,
    `BOM lines: ${bom.length}`,
    `Steps: ${steps.length}`,
    `Total stick length: ${totals.totalStickLengthM} m`,
    `Est. weight: ${totals.estimatedWeightKg} kg`,
    `Est. cost: $${totals.estimatedCostUsd}`,
    report.warnings.length ? `Warnings: ${report.warnings.join('; ')}` : 'No validation warnings',
  ].join('\n');
}
