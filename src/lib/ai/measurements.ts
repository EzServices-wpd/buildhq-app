import type { DesignJson, Component } from "@/types/project";

/** Human-readable measurement summary for UI / reports */
export function formatInches(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return `${rounded}"`;
}

export function overallLabel(design: DesignJson): string {
  const { width, height, depth } = design.overall;
  return `${formatInches(width)} W × ${formatInches(height)} H × ${formatInches(depth)} D`;
}

export function componentLabel(c: Component): string {
  return `${c.name}: ${formatInches(c.size.width)} × ${formatInches(c.size.height)} × ${formatInches(c.size.depth)}`;
}

/** Internal clear opening between outermost uprights */
export function innerClearWidth(design: DesignJson): number | null {
  const uprights = design.components.filter((c) => c.type === "upright");
  if (uprights.length < 2) return null;
  const left = Math.min(...uprights.map((u) => u.position.x + u.size.width));
  const right = Math.max(...uprights.map((u) => u.position.x));
  const clear = right - left;
  return clear > 0 ? clear : null;
}
