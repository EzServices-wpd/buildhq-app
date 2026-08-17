/**
 * latticeTower — generate true-to-size lattice / tower structures from sticks
 * Supports Eiffel-style tapering, multi-level platforms, cross bracing.
 * BuildHq 0.7.2 — improved joint logic & richer geometry
 */

import {
  createEmptyGraph,
  addNode,
  addEdge,
  computeBoundingBox,
  validateGraph,
} from './StructureGraph.js';
import type {
  StructureGraph,
  MaterialProfile,
  JointType,
  Vec3,
} from '../../types/structure.js';

export interface LatticeTowerParams {
  name?: string;
  /** Overall height in mm (true size). Eiffel ~324000 mm real; use scaled or full. */
  heightMm: number;
  /** Base width (square) in mm */
  baseWidthMm: number;
  /** Top width in mm (taper). 0 = pure pyramid. */
  topWidthMm?: number;
  /** Number of vertical levels / stories */
  levels: number;
  /** Number of bays per side at base (subdivisions) */
  bays?: number;
  /** Include diagonal cross bracing */
  bracing?: boolean;
  /** Include horizontal ring beams at each level */
  rings?: boolean;
  /** Include platform deck at top (or intermediate) */
  platforms?: boolean | number[]; // true = top only, or array of level indices
  /** Material for main legs / chords */
  legProfile: MaterialProfile;
  /** Material for braces / diagonals */
  braceProfile?: MaterialProfile;
  /** Material for rings / horizontals */
  ringProfile?: MaterialProfile;
  /** Default joint type for main connections */
  jointType?: JointType;
  /** Scale factor applied after generation (for model vs full-size) */
  scale?: number;
}

const DEFAULT_LEG: MaterialProfile = {
  sku: 'pine-2x4',
  name: 'Pine 2x4',
  section: '2x4',
  material: 'pine',
  widthMm: 38,
  heightMm: 89,
  densityKgPerM3: 500,
};

const DEFAULT_BRACE: MaterialProfile = {
  sku: 'pine-1x3',
  name: 'Pine 1x3',
  section: '1x3',
  material: 'pine',
  widthMm: 19,
  heightMm: 64,
  densityKgPerM3: 500,
};

/**
 * Generate a tapering square lattice tower (Eiffel-inspired or simple scaffold).
 * All dimensions are true-to-size in mm unless scale is applied.
 */
export function generateLatticeTower(params: LatticeTowerParams): StructureGraph {
  const {
    name = 'Lattice Tower',
    heightMm,
    baseWidthMm,
    topWidthMm = baseWidthMm * 0.25,
    levels,
    bays = 1,
    bracing = true,
    rings = true,
    platforms = false,
    legProfile = DEFAULT_LEG,
    braceProfile = DEFAULT_BRACE,
    ringProfile = DEFAULT_BRACE,
    jointType = 'bolt-plate',
    scale = 1,
  } = params;

  if (levels < 1) throw new Error('levels must be >= 1');
  if (heightMm <= 0 || baseWidthMm <= 0) throw new Error('height and baseWidth must be positive');

  const graph = createEmptyGraph(name);
  graph.scaleHint = scale === 1 ? 'full-size' : `scale 1:${Math.round(1 / scale)}`;
  graph.description = `Tapering lattice tower ${heightMm}mm tall, ${baseWidthMm}→${topWidthMm}mm, ${levels} levels`;

  const levelHeights: number[] = [];
  for (let i = 0; i <= levels; i++) {
    levelHeights.push((heightMm / levels) * i);
  }

  // Corner nodes per level. For bays > 1 we add intermediate nodes later.
  // Layout: 4 corners, indexed 0=SW, 1=SE, 2=NE, 3=NW looking down +Y up.
  const cornerNodes: string[][] = []; // [level][corner]

  for (let lvl = 0; lvl <= levels; lvl++) {
    const t = lvl / levels; // 0 at base → 1 at top
    const width = baseWidthMm * (1 - t) + topWidthMm * t;
    const half = width / 2;
    const y = levelHeights[lvl];
    const corners: Vec3[] = [
      [-half, y, -half], // 0 SW
      [half, y, -half], // 1 SE
      [half, y, half], // 2 NE
      [-half, y, half], // 3 NW
    ];
    const ids: string[] = [];
    for (let c = 0; c < 4; c++) {
      const role = lvl === 0 ? 'base' : lvl === levels ? 'apex' : 'joint';
      const node = addNode(graph, corners[c], {
        id: `L${lvl}C${c}`,
        role,
        label: `L${lvl}-C${c}`,
      });
      ids.push(node.id);
    }
    cornerNodes.push(ids);
  }

  // Vertical legs (chords) between consecutive levels
  for (let lvl = 0; lvl < levels; lvl++) {
    for (let c = 0; c < 4; c++) {
      addEdge(graph, cornerNodes[lvl][c], cornerNodes[lvl + 1][c], legProfile, {
        role: 'leg',
        jointAtFrom: jointType,
        jointAtTo: jointType,
      });
    }
  }

  // Horizontal rings at each level
  if (rings) {
    for (let lvl = 0; lvl <= levels; lvl++) {
      for (let c = 0; c < 4; c++) {
        const next = (c + 1) % 4;
        addEdge(graph, cornerNodes[lvl][c], cornerNodes[lvl][next], ringProfile, {
          role: 'chord',
          jointAtFrom: jointType,
          jointAtTo: jointType,
        });
      }
    }
  }

  // Cross bracing on each face, each level bay
  if (bracing) {
    for (let lvl = 0; lvl < levels; lvl++) {
      // Four faces
      // Face 0 (S): corners 0-1
      // Face 1 (E): 1-2
      // Face 2 (N): 2-3
      // Face 3 (W): 3-0
      const faces = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 0],
      ];
      for (const [a, b] of faces) {
        // X brace: lower-a to upper-b, lower-b to upper-a
        addEdge(
          graph,
          cornerNodes[lvl][a],
          cornerNodes[lvl + 1][b],
          braceProfile,
          { role: 'diagonal', jointAtFrom: 'gusset', jointAtTo: 'gusset' }
        );
        addEdge(
          graph,
          cornerNodes[lvl][b],
          cornerNodes[lvl + 1][a],
          braceProfile,
          { role: 'diagonal', jointAtFrom: 'gusset', jointAtTo: 'gusset' }
        );
      }
    }
  }

  // Optional intermediate bay posts / nodes for multi-bay (simple: mid-side nodes)
  if (bays > 1) {
    // For higher fidelity we would subdivide edges; keep simple for now —
    // future: edge subdivision + additional verticals.
    graph.metadata = { ...(graph.metadata ?? {}), plannedBays: bays, note: 'multi-bay nodes planned' };
  }

  // Platforms
  const platformLevels: number[] = [];
  if (platforms === true) {
    platformLevels.push(levels);
  } else if (Array.isArray(platforms)) {
    platformLevels.push(...platforms.filter((i) => i >= 0 && i <= levels));
  }
  for (const pl of platformLevels) {
    // Simple cross members for deck indication (not full decking)
    const ids = cornerNodes[pl];
    // Diagonals across the square
    addEdge(graph, ids[0], ids[2], ringProfile, {
      role: 'beam',
      jointAtFrom: 'bracket',
      jointAtTo: 'bracket',
    });
    addEdge(graph, ids[1], ids[3], ringProfile, {
      role: 'beam',
      jointAtFrom: 'bracket',
      jointAtTo: 'bracket',
    });
  }

  graph.boundingBox = computeBoundingBox(graph);
  if (scale !== 1) {
    // scale applied by caller via scaleGraph if needed
    graph.metadata = { ...(graph.metadata ?? {}), pendingScale: scale };
  }

  const warns = validateGraph(graph);
  if (warns.length) {
    graph.metadata = { ...(graph.metadata ?? {}), validationWarnings: warns };
  }

  return graph;
}

/**
 * Convenience: classic small Eiffel-style model (approx 1:50 of real ~324 m)
 * Real Eiffel ~324 m; 1:50 → ~6480 mm tall.
 */
export function eiffelModel(scale = 1 / 50): StructureGraph {
  const realHeightMm = 324000;
  const realBaseMm = 125000; // rough
  return generateLatticeTower({
    name: `Eiffel Model 1:${Math.round(1 / scale)}`,
    heightMm: realHeightMm * scale,
    baseWidthMm: realBaseMm * scale,
    topWidthMm: 100 * scale, // platform approx
    levels: 4,
    bracing: true,
    rings: true,
    platforms: true,
    jointType: 'bolt-plate',
    scale: 1, // already applied
  });
}

/**
 * Simple 4-post patio / observation tower (full size DIY friendly)
 */
export function patioTower(heightMm = 2400, widthMm = 1200): StructureGraph {
  return generateLatticeTower({
    name: 'Patio Observation Tower',
    heightMm,
    baseWidthMm: widthMm,
    topWidthMm: widthMm * 0.9,
    levels: 2,
    bracing: true,
    rings: true,
    platforms: true,
    jointType: 'bolt-plate',
  });
}

/**
 * Scaffold / freestanding shelf frame
 */
export function scaffoldFrame(heightMm = 1800, widthMm = 900, depthMm = 450, levels = 3): StructureGraph {
  // Approximate with square then note rectangular in metadata
  const g = generateLatticeTower({
    name: 'Scaffold Shelf Frame',
    heightMm,
    baseWidthMm: widthMm,
    topWidthMm: widthMm,
    levels,
    bracing: true,
    rings: true,
    platforms: false,
    jointType: 'clamp',
  });
  g.metadata = { ...(g.metadata ?? {}), intendedDepthMm: depthMm, note: 'square approx — stretch Z for depth' };
  return g;
}
