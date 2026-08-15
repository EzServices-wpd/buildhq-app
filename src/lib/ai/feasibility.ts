import type {
  DesignJson,
  BuildReport,
  CutListItem,
  BomItem,
  AssemblyStep,
  MaterialType,
} from "@/types/project";
import { MATERIAL_INFO, FASTENER_INFO } from "@/types/project";
import { nestParts } from "@/lib/ai/nesting";
import { windowFramingBom } from "@/lib/knowledge/windowBom";

const MAX_SPAN: Record<
  MaterialType,
  { light: number; medium: number; heavy: number }
> = {
  plywood_3_4: { light: 36, medium: 30, heavy: 24 },
  plywood_1_2: { light: 28, medium: 22, heavy: 18 },
  plywood_1_4: { light: 18, medium: 14, heavy: 10 },
  solid_pine: { light: 36, medium: 30, heavy: 24 },
  solid_oak: { light: 42, medium: 36, heavy: 30 },
  solid_walnut: { light: 40, medium: 34, heavy: 28 },
  solid_maple: { light: 42, medium: 36, heavy: 30 },
  mdf: { light: 30, medium: 24, heavy: 18 },
  melamine_white: { light: 30, medium: 24, heavy: 18 },
  particle_board: { light: 28, medium: 22, heavy: 16 },
  glass_clear_1_4: { light: 24, medium: 18, heavy: 12 },
  glass_clear_3_8: { light: 30, medium: 24, heavy: 18 },
  glass_frosted: { light: 24, medium: 18, heavy: 12 },
  glass_tempered: { light: 28, medium: 22, heavy: 16 },
  acrylic_clear: { light: 26, medium: 20, heavy: 14 },
  aluminum_sheet: { light: 36, medium: 28, heavy: 20 },
  steel_sheet: { light: 40, medium: 32, heavy: 24 },
  brushed_stainless: { light: 30, medium: 24, heavy: 16 },
  brass_sheet: { light: 24, medium: 18, heavy: 12 },
  metal_angle: { light: 48, medium: 40, heavy: 32 },
};

export function runFeasibility(
  design: DesignJson
): BuildReport["feasibility"] {
  const issues: BuildReport["feasibility"]["issues"] = [];
  const load = design.assumptions?.load ?? "medium";

  for (const c of design.components) {
    const isSpanning =
      c.type === "shelf" ||
      c.type === "glass_panel" ||
      c.type === "top" ||
      c.type === "bottom";
    if (!isSpanning) continue;
    const span = c.size.width;
    const limits = MAX_SPAN[c.material] ?? { light: 30, medium: 24, heavy: 18 };
    const max = limits[load];
    const matInfo = MATERIAL_INFO[c.material];

    if (span > max + 2) {
      issues.push({
        severity: "critical",
        message: `${c.name} spans ${span.toFixed(1)}" which is well beyond recommended for ${matInfo?.label ?? c.material} under ${load} load.`,
        suggestion:
          matInfo?.category === "glass"
            ? `Add mid-span clips/supports, reduce span below ${max}", or use thicker tempered glass.`
            : `Add a center support, reduce span below ${max}", or switch to a thicker / stronger material.`,
        componentIds: [c.id],
      });
    } else if (span > max) {
      issues.push({
        severity: "warning",
        message: `${c.name} spans ${span.toFixed(1)}" – near the limit for ${matInfo?.label ?? c.material} under ${load} load.`,
        suggestion: `Consider adding a support or using thicker material for better long-term performance.`,
        componentIds: [c.id],
      });
    }

    // Glass shelves: recommend clips at least every 12–16"
    if (
      (c.type === "glass_panel" || matInfo?.category === "glass") &&
      span > 16
    ) {
      const recommendedClips = Math.max(2, Math.ceil(span / 12) * 2);
      issues.push({
        severity: "info",
        message: `${c.name} is ${span.toFixed(1)}" wide — plan ~${recommendedClips} glass clips (both sides).`,
        suggestion: "Space clips evenly; use rubber pads between glass and metal/wood.",
        componentIds: [c.id],
      });
    }

    // Cutout validity
    if (c.cutouts?.length) {
      for (const cut of c.cutouts) {
        if (
          cut.x < 0 ||
          cut.y < 0 ||
          cut.x + cut.width > c.size.width + 0.01 ||
          cut.y + cut.height > c.size.height + 0.01
        ) {
          issues.push({
            severity: "warning",
            message: `Cutout on ${c.name} extends outside the panel bounds.`,
            suggestion: "Keep openings inset at least 1–2\" from edges for strength.",
            componentIds: [c.id],
          });
        }
        const edgeMargin = Math.min(
          cut.x,
          cut.y,
          c.size.width - (cut.x + cut.width),
          c.size.height - (cut.y + cut.height)
        );
        if (edgeMargin < 1) {
          issues.push({
            severity: "warning",
            message: `Cutout on ${c.name} is closer than 1" to a panel edge.`,
            suggestion: "Increase edge distance or add framing around the opening.",
            componentIds: [c.id],
          });
        }
      }
    }
  }

  const uprights = design.components.filter((c) => c.type === "upright");
  if (uprights.length < 2) {
    issues.push({
      severity: "warning",
      message:
        "Fewer than two uprights detected. Most cabinets need left and right vertical supports.",
      suggestion: "Add uprights at the ends of the unit.",
    });
  }

  const fasteners = design.fasteners ?? [];
  if (fasteners.length === 0 && design.components.length >= 3) {
    issues.push({
      severity: "info",
      message:
        "No joints detected yet. Move shelves so their ends meet the uprights — screws will appear automatically.",
      suggestion: "Drag shelves up/down or uprights left/right until they touch.",
    });
  }

  const hasCritical = issues.some((i) => i.severity === "critical");
  const hasWarning = issues.some((i) => i.severity === "warning");

  return {
    status: hasCritical ? "critical" : hasWarning ? "warnings" : "ok",
    summary: hasCritical
      ? "Critical issues found – address before cutting material."
      : hasWarning
        ? "Some recommendations to improve strength and durability."
        : fasteners.length > 0
          ? `Looks good. ${fasteners.reduce((n, f) => n + f.quantity, 0)} fasteners auto-placed at joints.`
          : "Looks good for typical residential use with the stated load assumption.",
    issues,
  };
}

export function generateCutList(design: DesignJson): CutListItem[] {
  return design.components.map((c) => {
    const dims = [c.size.width, c.size.height, c.size.depth].sort(
      (a, b) => b - a
    );
    return {
      partId: c.id,
      name: c.name,
      quantity: 1,
      lengthIn: dims[0],
      widthIn: dims[1],
      thicknessIn: MATERIAL_INFO[c.material].thicknessIn,
      material: c.material,
      grainDirection:
        c.type === "shelf" || c.type === "top" || c.type === "bottom"
          ? "length"
          : "either",
      notes: c.notes,
    };
  });
}

export function generateBom(design: DesignJson): BomItem[] {
  const byMaterial = new Map<MaterialType, number>();
  for (const c of design.components) {
    const area = c.size.width * c.size.height;
    byMaterial.set(c.material, (byMaterial.get(c.material) ?? 0) + area);
  }

  const bom: BomItem[] = [];

  for (const [mat, totalArea] of byMaterial) {
    const info = MATERIAL_INFO[mat];
    if (info.category === "glass") {
      bom.push({
        name: `${info.label} (cut-to-size)`,
        quantity: Math.max(1, design.components.filter((c) => c.material === mat).length),
        unit: "pcs",
        materialHint: mat,
        searchTerms: info.searchTerms,
        notes: "Order from a glass shop with polished edges. Confirm thickness and tempering.",
      });
    } else if (info.sheetGoods) {
      const sheets = Math.ceil(totalArea / 3800);
      bom.push({
        name: `${info.label} (4×8 sheet)`,
        quantity: Math.max(1, sheets),
        unit: "sheets",
        materialHint: mat,
        searchTerms: info.searchTerms,
        notes:
          info.category === "metal"
            ? "Deburr edges. Confirm alloy and thickness at the supplier."
            : "Confirm grade/grain at the store. Buy one extra if unsure.",
      });
    } else {
      bom.push({
        name: info.label,
        quantity: Math.max(1, design.components.filter((c) => c.material === mat).length),
        unit: "pcs",
        materialHint: mat,
        searchTerms: info.searchTerms,
        notes: "Dimensional lumber / specialty stock — select straight pieces.",
      });
    }
  }

  // Aggregate fasteners
  const fastenerTotals = new Map<string, number>();
  for (const f of design.fasteners ?? []) {
    const key = f.type;
    fastenerTotals.set(key, (fastenerTotals.get(key) ?? 0) + f.quantity);
  }
  for (const [type, qty] of fastenerTotals) {
    const info = FASTENER_INFO[type as keyof typeof FASTENER_INFO];
    if (!info) continue;
    bom.push({
      name: info.label,
      quantity: Math.max(1, Math.ceil(qty / 10)), // boxes
      unit: type === "pocket_screw" || type === "wood_screw" ? "box" : "pack",
      searchTerms: info.searchTerms,
      notes: `${qty} individual fasteners needed across joints.`,
    });
  }

  if (fastenerTotals.size === 0) {
    bom.push({
      name: '1-1/4" coarse-thread pocket screws',
      quantity: 1,
      unit: "box",
      searchTerms: ["pocket hole screws", "confirmat screws"],
    });
  }

  bom.push({
    name: "Wood glue",
    quantity: 1,
    unit: "bottle",
    searchTerms: ["Titebond wood glue"],
  });
  bom.push({
    name: "Sandpaper assortment (80 / 120 / 220)",
    quantity: 1,
    unit: "pack",
    searchTerms: ["sandpaper assortment"],
  });

  // Installation context → anchors / feet
  const install = design.assumptions?.installMode ?? "wall";
  const wallType = design.assumptions?.wallType ?? "wood_stud";
  const uprightCount = design.components.filter(
    (c) => c.type === "upright" || c.type === "divider"
  ).length;

  if (install === "wall" || install === "alcove") {
    if (wallType === "wood_stud") {
      bom.push({
        name: '3" structural screws or lag bolts into studs',
        quantity: Math.max(1, Math.ceil((uprightCount * 4) / 8)),
        unit: "box",
        searchTerms: ["structural screws", "lag screws"],
        notes: "Locate studs; fasten top and bottom of each upright into solid framing.",
      });
      bom.push({
        name: "Stud finder",
        quantity: 1,
        unit: "ea",
        searchTerms: ["stud finder"],
      });
    } else if (wallType === "drywall_only") {
      bom.push({
        name: "Heavy-duty toggle bolts / snap toggles",
        quantity: Math.max(4, uprightCount * 4),
        unit: "pcs",
        searchTerms: ["snap toggle", "toggle bolts"],
        notes: "No stud hit — use rated hollow-wall anchors; reduce load rating.",
      });
    } else if (wallType === "masonry" || wallType === "concrete") {
      bom.push({
        name: "Concrete / masonry screws (Tapcon-style)",
        quantity: Math.max(4, uprightCount * 4),
        unit: "pcs",
        searchTerms: ["Tapcon concrete screws", "masonry anchors"],
        notes: "Drill correct pilot diameter; use anchors rated for shear/pull-out.",
      });
    }
    if (install === "alcove") {
      bom.push({
        name: "Shim pack for alcove sides",
        quantity: 1,
        unit: "pack",
        searchTerms: ["composite shims"],
        notes: "Shim uprights plumb against irregular walls before fastening.",
      });
    }
  } else {
    // freestanding
    bom.push({
      name: "Adjustable furniture levelers / feet",
      quantity: Math.max(4, uprightCount * 2),
      unit: "pcs",
      searchTerms: ["furniture levelers", "adjustable cabinet legs"],
      notes: "Freestanding unit — level on uneven floors; optional anti-tip strap still recommended.",
    });
    bom.push({
      name: "Anti-tip furniture strap kit",
      quantity: 1,
      unit: "kit",
      searchTerms: ["anti tip furniture strap"],
      notes: "Strongly recommended for tall units near kids or seismic zones.",
    });
  }

  // Window RO framing package if present
  const win = design.assumptions?.windowRoughOpening;
  if (win) {
    bom.push(
      ...windowFramingBom({
        roWidthIn: win.widthIn,
        roHeightIn: win.heightIn,
        unitWidthIn: win.unitWidthIn,
        unitHeightIn: win.unitHeightIn,
        loadBearing: true,
      })
    );
  }

  return bom;
}

export function generateInstructions(design: DesignJson): AssemblyStep[] {
  const jointCount = design.fasteners?.length ?? 0;
  const hasGlass = design.components.some(
    (c) => MATERIAL_INFO[c.material]?.category === "glass"
  );
  const hasMetal = design.components.some(
    (c) => MATERIAL_INFO[c.material]?.category === "metal"
  );

  const steps: AssemblyStep[] = [
    {
      step: 1,
      title: "Review & label",
      description:
        "Print the cut list. As you cut each part, write its name on the face with a pencil so you never mix pieces up.",
      diagram: "layout",
    },
    {
      step: 2,
      title: "Cut sheet goods",
      description:
        "Cut the largest wood/composite panels first. Support long panels to avoid tear-out. Glass and metal are usually ordered cut-to-size from a supplier.",
      partsUsed: design.components.map((c) => c.id),
      diagram: "layout",
      tips: hasGlass
        ? "Order glass/acrylic from a glass shop with polished edges — DIY glass cutting is risky."
        : undefined,
    },
    {
      step: 3,
      title: "Stand the uprights",
      description:
        "Position left and right uprights on a flat surface at the correct width. Temporarily brace so they stay plumb.",
      diagram: "uprights",
    },
    {
      step: 4,
      title: "Prepare joinery",
      description:
        jointCount > 0
          ? `Drill pocket holes (or confirmat pilots) at the ${jointCount} joint locations marked in the design. Hardware is listed in your BOM.`
          : "Drill pocket holes on the underside of shelves where they meet the uprights.",
      diagram: "fasteners",
    },
    {
      step: 5,
      title: "Install shelves",
      description:
        "Seat each shelf, check level, then fasten. Work from bottom to top. Check for square after each major connection.",
      diagram: "shelf",
      tips: "Work on a flat surface. Use a large framing square.",
    },
  ];

  if (hasGlass) {
    steps.push({
      step: steps.length + 1,
      title: "Fit glass / acrylic",
      description:
        "Install glass shelf clips or channels first. Set glass gently — never force. Use clear pads between glass and wood/metal.",
      diagram: "glass",
      tips: "Wear gloves. Tempered glass cannot be re-cut once ordered.",
    });
  }
  if (hasMetal) {
    steps.push({
      step: steps.length + 1,
      title: "Attach metal parts",
      description:
        "Pre-drill metal as needed. Use self-tapping screws or manufacturer clips. Deburr sharp edges before handling.",
      diagram: "fasteners",
      tips: "Cut metal with a fine blade; wear eye protection.",
    });
  }

  steps.push({
    step: steps.length + 1,
    title: "Dry fit check",
    description:
      "Assemble without permanent adhesive where possible and confirm dimensions, square, and clearances before final fastening.",
    diagram: "layout",
  });
  steps.push({
    step: steps.length + 1,
    title: "Sand & finish",
    description:
      "Fill holes on wood parts, sand through the grits, then apply finish. Skip aggressive sanding on melamine, glass, and metal — clean those instead.",
    diagram: "finish",
  });

  // renumber
  return steps.map((s, i) => ({ ...s, step: i + 1 }));
}

export function buildReport(design: DesignJson): BuildReport {
  const cutList = generateCutList(design);
  // Only nest true sheet goods (not glass cut-to-size or dimensional lumber)
  const nestPartsInput = cutList
    .filter((c) => MATERIAL_INFO[c.material]?.sheetGoods)
    .map((c) => ({
      id: c.partId,
      name: c.name,
      width: c.lengthIn,
      height: c.widthIn,
      material: c.material,
      allowRotate: c.grainDirection !== "length",
    }));

  const nest = nestParts(nestPartsInput);

  const bom = generateBom(design);
  // Override plywood sheet counts with real nest results
  const sheetsByMat = new Map<string, number>();
  for (const s of nest.sheets) {
    sheetsByMat.set(s.material, (sheetsByMat.get(s.material) ?? 0) + 1);
  }
  for (const item of bom) {
    if (item.unit === "sheets" && item.materialHint) {
      const n = sheetsByMat.get(item.materialHint);
      if (n) item.quantity = n;
    }
  }

  return {
    feasibility: runFeasibility(design),
    cutList,
    bom,
    instructions: generateInstructions(design),
    sheets: nest.sheets,
    nestSummary: {
      totalSheets: nest.totalSheets,
      averageUtilization: nest.averageUtilization,
      unplacedCount: nest.unplaced.length,
    },
    generatedAt: new Date().toISOString(),
  };
}
