import type { BomItem } from "@/types/project";
import {
  estimateWindowFraming,
  type WallLoad,
} from "@/lib/knowledge/framing";

/**
 * Complete materials package for framing + installing a window in an existing
 * or new rough opening. Guidance only — confirm manufacturer and local code.
 */
export function windowFramingBom(opts: {
  roWidthIn: number;
  roHeightIn: number;
  unitWidthIn?: number;
  unitHeightIn?: number;
  loadBearing?: boolean;
  storiesAbove?: number;
}): BomItem[] {
  const load: WallLoad = opts.loadBearing === false ? "non_bearing" : "bearing_roof";
  const framing = estimateWindowFraming(opts.roWidthIn, load);
  const spanFt = opts.roWidthIn / 12;

  const bom: BomItem[] = [];

  if (opts.unitWidthIn && opts.unitHeightIn) {
    bom.push({
      name: `Window unit ${opts.unitWidthIn}" × ${opts.unitHeightIn}"`,
      quantity: 1,
      unit: "ea",
      searchTerms: [
        `window ${opts.unitWidthIn}x${opts.unitHeightIn}`,
        "new construction window",
      ],
      notes: "Confirm exact unit size and RO on the manufacturer sheet before ordering.",
    });
  } else {
    bom.push({
      name: "Window unit (size TBD from RO match)",
      quantity: 1,
      unit: "ea",
      searchTerms: ["vinyl window", "new construction window"],
      notes: `Plan unit under RO ${opts.roWidthIn}" × ${opts.roHeightIn}" with shim clearance.`,
    });
  }

  // Lumber package
  bom.push({
    name: '2x4 studs (kings + jacks + cripples)',
    quantity: Math.max(
      8,
      framing.kingStuds + framing.jackStuds + Math.ceil(spanFt * 2) + 4
    ),
    unit: "pcs",
    searchTerms: ["2x4 studs", "precut studs"],
    notes: `${framing.kingStuds} kings, ${framing.jackStuds} jacks, plus cripples at wall OC.`,
  });

  bom.push({
    name: `Header stock — ${framing.headerDescription}`,
    quantity: 1,
    unit: "set",
    searchTerms: ["LVL header", "2x10 lumber", "header lumber"],
    notes: "Verify size with IRC R602.7 for your span, stories, and snow load.",
  });

  bom.push({
    name: "Rough sill (doubled 2x recommended)",
    quantity: 2,
    unit: "pcs",
    searchTerms: ["2x4 lumber", "2x6 lumber"],
    notes: "Length ≈ RO width + bearing on jacks.",
  });

  bom.push({
    name: "Framing nails or structural screws",
    quantity: 1,
    unit: "box",
    searchTerms: ["16d framing nails", "structural screws"],
  });

  // Weather / install
  bom.push({
    name: "Sill pan flashing / flexible flashing tape",
    quantity: 1,
    unit: "roll",
    searchTerms: ["window sill pan", "flashing tape", "Tyvek tape"],
    notes: "Install sill first, then jambs, then head — follow manufacturer sequence.",
  });

  bom.push({
    name: "Low-expansion window & door foam",
    quantity: 1,
    unit: "can",
    searchTerms: ["low expansion window foam"],
    notes: "Do not overfill — bowing the frame is a common failure.",
  });

  bom.push({
    name: "Shims (composite or wood)",
    quantity: 1,
    unit: "pack",
    searchTerms: ["composite shims", "wood shims"],
  });

  bom.push({
    name: "Exterior sealant (window-rated)",
    quantity: 1,
    unit: "tube",
    searchTerms: ["window door sealant", "silicone exterior"],
  });

  bom.push({
    name: "Interior casing / trim (optional finish)",
    quantity: 1,
    unit: "set",
    searchTerms: ["window casing", "door trim"],
  });

  if (opts.storiesAbove && opts.storiesAbove > 0) {
    bom.push({
      name: "Engineered header review",
      quantity: 1,
      unit: "note",
      notes:
        "Openings under floor loads need table lookup or engineer — do not undersize the header.",
      searchTerms: ["LVL beam"],
    });
  }

  return bom;
}
