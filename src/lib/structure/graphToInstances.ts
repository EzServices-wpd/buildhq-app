/**
 * graphToInstances — turn one or more StructureGraphs into ForgeInstance[] ready for canvas / report
 * BuildHq 0.7.2
 */

import type { StructureGraph, ForgeInstance, Vec3 } from '../../types/structure.js';
import { cloneGraph, scaleGraph, computeBoundingBox } from './StructureGraph.js';

export interface InstancePlacement {
  position?: Vec3;
  rotation?: Vec3; // degrees XYZ
  scale?: number;
  materialOverrides?: ForgeInstance['materialOverrides'];
  labels?: Record<string, string>;
}

/**
 * Create a single ForgeInstance from a graph at a placement.
 * Optionally mutates a clone (does not mutate original graph).
 */
export function graphToInstance(
  graph: StructureGraph,
  placement: InstancePlacement = {},
  instanceId?: string
): ForgeInstance {
  const {
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    materialOverrides,
    labels,
  } = placement;

  // If scale needed, work on a clone so original stays pure
  let source = graph;
  if (scale !== 1) {
    source = cloneGraph(graph);
    scaleGraph(source, scale);
  }

  return {
    id: instanceId ?? `fi-${graph.id}-${Date.now().toString(36)}`,
    graphId: graph.id,
    transform: { position: [...position] as Vec3, rotation: [...rotation] as Vec3, scale },
    materialOverrides,
    labels,
  };
}

/**
 * Place multiple copies of the same graph (e.g. array of towers, modular units)
 */
export function graphToInstances(
  graph: StructureGraph,
  placements: InstancePlacement[],
  idPrefix = 'inst'
): ForgeInstance[] {
  return placements.map((p, i) =>
    graphToInstance(graph, p, `${idPrefix}-${i}`)
  );
}

/**
 * Convenience: single centered instance at origin
 */
export function singleInstance(graph: StructureGraph, scale = 1): ForgeInstance[] {
  return [graphToInstance(graph, { scale })];
}

/**
 * Grid placement helper — useful for modular shelves / fence posts
 */
export function gridPlacements(
  countX: number,
  countZ: number,
  spacingXmm: number,
  spacingZmm: number,
  y = 0
): InstancePlacement[] {
  const placements: InstancePlacement[] = [];
  const offsetX = ((countX - 1) * spacingXmm) / 2;
  const offsetZ = ((countZ - 1) * spacingZmm) / 2;
  for (let ix = 0; ix < countX; ix++) {
    for (let iz = 0; iz < countZ; iz++) {
      placements.push({
        position: [ix * spacingXmm - offsetX, y, iz * spacingZmm - offsetZ],
      });
    }
  }
  return placements;
}

/**
 * Attach bounding box info back onto graph for UI
 */
export function ensureBounds(graph: StructureGraph): StructureGraph {
  if (!graph.boundingBox) {
    graph.boundingBox = computeBoundingBox(graph);
  }
  return graph;
}
