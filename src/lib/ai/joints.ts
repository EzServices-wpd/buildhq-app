import type { Component, Fastener, DesignJson } from "@/types/project";
import { MATERIAL_INFO } from "@/types/project";
import { createId } from "@/lib/utils";

const TOLERANCE = 0.35; // inches – how close edges must be to count as a joint

function overlaps1D(a0: number, a1: number, b0: number, b1: number) {
  return Math.min(a1, b1) - Math.max(a0, b0) > 0.5;
}

/**
 * Detect shelf-to-upright joints and generate fastener suggestions.
 * Runs whenever the design changes so the user sees screws appear as they drag.
 */
export function detectJoints(components: Component[]): Fastener[] {
  const uprights = components.filter(
    (c) => c.type === "upright" || c.type === "divider" || c.type === "metal_frame"
  );
  const shelves = components.filter(
    (c) =>
      c.type === "shelf" ||
      c.type === "top" ||
      c.type === "bottom" ||
      c.type === "glass_panel"
  );

  const fasteners: Fastener[] = [];

  for (const shelf of shelves) {
    const sLeft = shelf.position.x;
    const sRight = shelf.position.x + shelf.size.width;
    const sY = shelf.position.y + shelf.size.height / 2;
    const sZ0 = shelf.position.z;
    const sZ1 = shelf.position.z + shelf.size.depth;

    for (const up of uprights) {
      const uLeft = up.position.x;
      const uRight = up.position.x + up.size.width;
      const uZ0 = up.position.z;
      const uZ1 = up.position.z + up.size.depth;
      const uY0 = up.position.y;
      const uY1 = up.position.y + up.size.height;

      // Vertical overlap: shelf height center should sit within upright height
      if (sY < uY0 - TOLERANCE || sY > uY1 + TOLERANCE) continue;
      // Depth overlap
      if (!overlaps1D(sZ0, sZ1, uZ0, uZ1)) continue;

      // Left joint: shelf left edge near upright right edge, or shelf contains upright
      const leftJoint =
        Math.abs(sLeft - uRight) < TOLERANCE ||
        Math.abs(sLeft - uLeft) < TOLERANCE;
      const rightJoint =
        Math.abs(sRight - uLeft) < TOLERANCE ||
        Math.abs(sRight - uRight) < TOLERANCE;

      if (leftJoint || rightJoint) {
        const jointX = leftJoint
          ? (sLeft + uRight) / 2
          : (sRight + uLeft) / 2;
        const jointZ = (Math.max(sZ0, uZ0) + Math.min(sZ1, uZ1)) / 2;

        const shelfIsGlass =
          shelf.type === "glass_panel" ||
          MATERIAL_INFO[shelf.material]?.category === "glass";
        const upIsMetal =
          up.type === "metal_frame" ||
          MATERIAL_INFO[up.material]?.category === "metal";

        fasteners.push({
          id: createId("fs"),
          type: shelfIsGlass
            ? "glass_clip"
            : upIsMetal
              ? "metal_screw"
              : "pocket_screw",
          fromId: shelf.id,
          toId: up.id,
          position: { x: jointX, y: sY, z: jointZ },
          quantity: shelfIsGlass ? 1 : 2,
          note: `${shelf.name} → ${up.name}`,
        });
      }
    }
  }

  return fasteners;
}

/** Recompute fasteners and return updated design */
export function withUpdatedJoints(design: DesignJson): DesignJson {
  return {
    ...design,
    fasteners: detectJoints(design.components),
  };
}
