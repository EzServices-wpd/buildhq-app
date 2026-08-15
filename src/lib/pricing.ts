import type { MaterialType, DesignJson, BomItem } from "@/types/project";
import { MATERIAL_INFO } from "@/types/project";

/** Rough retail unit estimates (USD) — guidance only */
export const MATERIAL_UNIT_COST: Record<
  MaterialType,
  { unit: "sheet" | "pc" | "lf"; usd: number }
> = {
  plywood_3_4: { unit: "sheet", usd: 55 },
  plywood_1_2: { unit: "sheet", usd: 42 },
  plywood_1_4: { unit: "sheet", usd: 28 },
  solid_pine: { unit: "pc", usd: 18 },
  solid_oak: { unit: "pc", usd: 45 },
  solid_walnut: { unit: "pc", usd: 65 },
  solid_maple: { unit: "pc", usd: 40 },
  mdf: { unit: "sheet", usd: 35 },
  melamine_white: { unit: "sheet", usd: 48 },
  particle_board: { unit: "sheet", usd: 25 },
  glass_clear_1_4: { unit: "pc", usd: 35 },
  glass_clear_3_8: { unit: "pc", usd: 55 },
  glass_frosted: { unit: "pc", usd: 45 },
  glass_tempered: { unit: "pc", usd: 70 },
  acrylic_clear: { unit: "sheet", usd: 40 },
  aluminum_sheet: { unit: "sheet", usd: 60 },
  steel_sheet: { unit: "sheet", usd: 50 },
  brushed_stainless: { unit: "sheet", usd: 90 },
  brass_sheet: { unit: "sheet", usd: 80 },
  metal_angle: { unit: "lf", usd: 8 },
};

export function estimateBomCost(bom: BomItem[]): {
  totalUsd: number;
  lines: { name: string; lineUsd: number }[];
} {
  const lines: { name: string; lineUsd: number }[] = [];
  let totalUsd = 0;

  for (const item of bom) {
    const mat = item.materialHint as MaterialType | undefined;
    let unitUsd = 12; // generic hardware / consumable default
    if (mat && MATERIAL_UNIT_COST[mat]) {
      unitUsd = MATERIAL_UNIT_COST[mat].usd;
    } else if (/screw|dowel|bracket|clip/i.test(item.name)) {
      unitUsd = 8;
    } else if (/glue/i.test(item.name)) {
      unitUsd = 10;
    } else if (/sandpaper/i.test(item.name)) {
      unitUsd = 12;
    }
    const lineUsd = Math.round(unitUsd * item.quantity * 100) / 100;
    totalUsd += lineUsd;
    lines.push({ name: item.name, lineUsd });
  }

  return { totalUsd: Math.round(totalUsd * 100) / 100, lines };
}

export function estimateDesignMaterialCost(design: DesignJson): number {
  let total = 0;
  const byMat = new Map<MaterialType, number>();
  for (const c of design.components) {
    byMat.set(c.material, (byMat.get(c.material) ?? 0) + 1);
  }
  for (const [mat, count] of byMat) {
    const info = MATERIAL_INFO[mat];
    const price = MATERIAL_UNIT_COST[mat];
    if (!price) continue;
    if (info.sheetGoods && price.unit === "sheet") {
      total += price.usd * Math.max(1, Math.ceil(count / 4));
    } else {
      total += price.usd * count;
    }
  }
  return Math.round(total);
}
