/**
 * Build a simple BOM + cut list from Forge instances.
 * Counts whole packs and lists cut lengths when canCut.
 */

import type { ForgeInstance } from "@/types/project";
import { getCatalogItem } from "./catalog";
import { toPrimitive } from "./geometry";

export interface ForgeBomLine {
  catalogId: string;
  name: string;
  formFactor: string;
  quantityPieces: number;
  packsNeeded: number;
  unitsPerPack: number;
  unitCostUsd?: number;
  estCostUsd?: number;
  searchQuery?: string;
  exampleUrl?: string;
  cutLengths: number[]; // unique-ish lengths used
  notes?: string;
}

export interface ForgeBomResult {
  lines: ForgeBomLine[];
  totalPieces: number;
  totalEstCostUsd: number;
  primaryMaterialId: string | null;
}

export function buildForgeBom(
  instances: ForgeInstance[],
  primaryMaterialId?: string | null
): ForgeBomResult {
  const byId = new Map<
    string,
    { count: number; cuts: number[] }
  >();

  for (const inst of instances) {
    const entry = byId.get(inst.catalogId) ?? { count: 0, cuts: [] };
    entry.count += 1;
    if (inst.cutLength != null) entry.cuts.push(inst.cutLength);
    byId.set(inst.catalogId, entry);
  }

  // Ensure primary appears even if zero instances yet
  if (primaryMaterialId && !byId.has(primaryMaterialId)) {
    byId.set(primaryMaterialId, { count: 0, cuts: [] });
  }

  const lines: ForgeBomLine[] = [];
  let totalPieces = 0;
  let totalEstCostUsd = 0;

  for (const [catalogId, data] of byId) {
    const item = getCatalogItem(catalogId);
    if (!item) continue;

    const unitsPerPack = item.unitsPerPack ?? 1;
    const packsNeeded =
      data.count === 0 ? 0 : Math.ceil(data.count / Math.max(1, unitsPerPack));
    const unitCost = item.unitCostUsd;
    const estCost =
      unitCost != null ? packsNeeded * unitsPerPack * unitCost : undefined;

    // Unique cut lengths (rounded)
    const uniqueCuts = [
      ...new Set(
        data.cuts.map((c) => Math.round(c * 100) / 100).filter((c) => c > 0)
      ),
    ].sort((a, b) => b - a);

    lines.push({
      catalogId,
      name: item.name,
      formFactor: item.formFactor,
      quantityPieces: data.count,
      packsNeeded,
      unitsPerPack,
      unitCostUsd: unitCost,
      estCostUsd: estCost,
      searchQuery: item.searchQuery,
      exampleUrl: item.exampleUrl,
      cutLengths: uniqueCuts,
      notes:
        (item.canCut ?? true) && uniqueCuts.length
          ? `Cut to: ${uniqueCuts.map((c) => `${c}"`).join(", ")}`
          : item.notes,
    });

    totalPieces += data.count;
    if (estCost != null) totalEstCostUsd += estCost;
  }

  // Prefer primary first
  lines.sort((a, b) => {
    if (a.catalogId === primaryMaterialId) return -1;
    if (b.catalogId === primaryMaterialId) return 1;
    return b.quantityPieces - a.quantityPieces;
  });

  return {
    lines,
    totalPieces,
    totalEstCostUsd,
    primaryMaterialId: primaryMaterialId ?? null,
  };
}

/** Quick summary string for UI */
export function forgeBomSummary(result: ForgeBomResult): string {
  if (result.totalPieces === 0) {
    const item = result.primaryMaterialId
      ? getCatalogItem(result.primaryMaterialId)
      : null;
    return item
      ? `Ready · ${item.name} selected · place or prompt to generate pieces`
      : "Select a material to begin";
  }
  const cost =
    result.totalEstCostUsd > 0
      ? ` · ~$${result.totalEstCostUsd.toFixed(2)}`
      : "";
  return `${result.totalPieces} pieces · ${result.lines.length} material type(s)${cost}`;
}

/** Default stock length for a catalog item (for freehand place) */
export function defaultPlaceLength(catalogId: string): number {
  const item = getCatalogItem(catalogId);
  if (!item) return 12;
  return toPrimitive(item).length;
}
