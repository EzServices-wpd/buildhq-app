/**
 * Framing heuristics for residential wood construction.
 * Guidance only — always verify manufacturer specs and local code (IRC R602+).
 */

export type WallLoad = "non_bearing" | "bearing_roof" | "bearing_floor_roof";

export interface RoughOpeningInput {
  /** Measured framed hole width (inches) */
  roWidthIn: number;
  /** Measured framed hole height (inches) */
  roHeightIn: number;
}

export interface WindowUnitSuggestion {
  nominalCode: string;
  unitWidthIn: number;
  unitHeightIn: number;
  /** Assumed RO for this unit under standard clearance */
  expectedRoWidthIn: number;
  expectedRoHeightIn: number;
  fit: "tight" | "good" | "loose" | "too_small" | "too_large";
  notes: string;
}

/** Common residential window unit sizes (width x height, inches) */
export const STANDARD_WINDOW_UNITS: { w: number; h: number }[] = [
  { w: 24, h: 36 },
  { w: 24, h: 48 },
  { w: 28, h: 36 },
  { w: 28, h: 48 },
  { w: 30, h: 40 },
  { w: 30, h: 48 },
  { w: 30, h: 60 },
  { w: 32, h: 48 },
  { w: 36, h: 36 },
  { w: 36, h: 48 },
  { w: 36, h: 60 },
  { w: 36, h: 72 },
  { w: 40, h: 48 },
  { w: 40, h: 60 },
  { w: 48, h: 48 },
  { w: 48, h: 60 },
  { w: 48, h: 72 },
  { w: 60, h: 48 },
  { w: 60, h: 60 },
  { w: 72, h: 48 },
];

/**
 * Clearance modes:
 * - manufacturer_half: +1/2" W and H total (≈1/4" per side) — common vinyl/fiberglass
 * - flange_generous: +2" W / +2.5" H — older builder rule / some flange installs
 */
export type ClearanceMode = "manufacturer_half" | "flange_generous";

export function unitToRoughOpening(
  unitW: number,
  unitH: number,
  mode: ClearanceMode = "manufacturer_half"
): { roW: number; roH: number } {
  if (mode === "flange_generous") {
    return { roW: unitW + 2, roH: unitH + 2.5 };
  }
  return { roW: unitW + 0.5, roH: unitH + 0.5 };
}

export function roughOpeningToMaxUnit(
  roW: number,
  roH: number,
  mode: ClearanceMode = "manufacturer_half"
): { maxUnitW: number; maxUnitH: number } {
  if (mode === "flange_generous") {
    return { maxUnitW: roW - 2, maxUnitH: roH - 2.5 };
  }
  return { maxUnitW: roW - 0.5, maxUnitH: roH - 0.5 };
}

function nominalCode(w: number, h: number): string {
  // Common trade shorthand: width feet-inches + height feet-inches as WW HH
  const wf = Math.floor(w / 12);
  const wi = Math.round(w % 12);
  const hf = Math.floor(h / 12);
  const hi = Math.round(h % 12);
  return `${wf}${wi.toString().padStart(2, "0")}${hf}${hi.toString().padStart(2, "0")}`;
}

function classifyFit(
  expectedRoW: number,
  expectedRoH: number,
  actualRoW: number,
  actualRoH: number
): WindowUnitSuggestion["fit"] {
  const dw = actualRoW - expectedRoW;
  const dh = actualRoH - expectedRoH;
  if (dw < -0.25 || dh < -0.25) return "too_small";
  if (dw > 1.5 || dh > 1.5) return "too_large";
  if (dw >= 0 && dw <= 0.75 && dh >= 0 && dh <= 0.75) return "good";
  if (dw >= -0.25 && dh >= -0.25) return "tight";
  return "loose";
}

/** Suggest standard window units that may fit a measured rough opening */
export function suggestWindowsForRoughOpening(
  ro: RoughOpeningInput,
  mode: ClearanceMode = "manufacturer_half"
): WindowUnitSuggestion[] {
  const max = roughOpeningToMaxUnit(ro.roWidthIn, ro.roHeightIn, mode);
  const results: WindowUnitSuggestion[] = [];

  for (const u of STANDARD_WINDOW_UNITS) {
    if (u.w > max.maxUnitW + 0.01 || u.h > max.maxUnitH + 0.01) continue;
    const expected = unitToRoughOpening(u.w, u.h, mode);
    const fit = classifyFit(
      expected.roW,
      expected.roH,
      ro.roWidthIn,
      ro.roHeightIn
    );
    if (fit === "too_small") continue;
    results.push({
      nominalCode: nominalCode(u.w, u.h),
      unitWidthIn: u.w,
      unitHeightIn: u.h,
      expectedRoWidthIn: expected.roW,
      expectedRoHeightIn: expected.roH,
      fit,
      notes:
        fit === "good"
          ? "Clearance looks appropriate for shimming plumb and level."
          : fit === "tight"
            ? "Minimal shim space — measure carefully; confirm manufacturer RO."
            : fit === "loose"
              ? "Extra space — plan furring or wider shims; avoid bowing the frame."
              : "Opening may need furring strips to reduce excess gap.",
    });
  }

  // Prefer closest size (minimize leftover clearance)
  results.sort((a, b) => {
    const score = (s: WindowUnitSuggestion) =>
      Math.abs(ro.roWidthIn - s.expectedRoWidthIn) +
      Math.abs(ro.roHeightIn - s.expectedRoHeightIn);
    return score(a) - score(b);
  });

  return results.slice(0, 12);
}

export interface FramingMembersEstimate {
  kingStuds: number;
  jackStuds: number;
  headerDescription: string;
  sill: string;
  cripplesNote: string;
  steps: string[];
  warnings: string[];
}

/** Heuristic framing package for a window RO (not a structural stamp) */
export function estimateWindowFraming(
  roWidthIn: number,
  load: WallLoad = "bearing_roof"
): FramingMembersEstimate {
  const spanFt = roWidthIn / 12;
  let jackPerSide = 1;
  let kingPerSide = 1;
  if (spanFt > 6) jackPerSide = 2;
  if (spanFt > 8) {
    jackPerSide = 2;
    kingPerSide = 2;
  }

  let header = "2-2x6 with ½\" plywood spacer (verify IRC R602.7)";
  if (load === "non_bearing" && spanFt <= 4) {
    header = "Single 2x4 flat or 2-2x4 (non-bearing only)";
  } else if (spanFt <= 4) {
    header = "2-2x6 or 4x6 (typical single-story roof load)";
  } else if (spanFt <= 6) {
    header = "2-2x8 or 4x8";
  } else if (spanFt <= 8) {
    header = "2-2x10 or 4x10";
  } else {
    header = "Engineered LVL / multiple plies — consult tables or engineer";
  }

  const warnings: string[] = [
    "Header size depends on stories above, building width, snow/wind — use IRC Table R602.7 or local amendment.",
    "Always follow the window manufacturer's rough-opening and flashing instructions.",
  ];
  if (spanFt > 6) {
    warnings.push("Wide opening: expect doubled jacks and a larger header.");
  }

  return {
    kingStuds: kingPerSide * 2,
    jackStuds: jackPerSide * 2,
    headerDescription: header,
    sill: "Rough sill (often doubled 2x) with cripples below to bottom plate",
    cripplesNote:
      "Cripple studs above header and below sill at same OC as wall (16\" or 24\")",
    steps: [
      "Layout RO width between inner faces of jack (trimmer) studs.",
      "Install full-height king studs on each side of the opening.",
      "Cut jack studs to support the header; nail tight under header ends.",
      "Set header (built-up or solid) bearing fully on jacks.",
      "Install rough sill at designed height; add cripples below sill and above header.",
      "Check RO for square (diagonals within ¼\") and plumb before ordering/installing unit.",
      "Flash sill with pan flashing; install WRB/window per manufacturer sequence.",
    ],
    warnings,
  };
}

export const FRAMING_GLOSSARY = [
  {
    term: "Rough opening (RO)",
    def: "Framed hole bounded by header, sill, and jack studs — slightly larger than the window unit.",
  },
  {
    term: "King stud",
    def: "Full-height stud beside an opening; ties the opening into the wall plates.",
  },
  {
    term: "Jack / trimmer stud",
    def: "Shorter stud under the header that carries header load to the plate.",
  },
  {
    term: "Header",
    def: "Horizontal member spanning the opening to carry loads above.",
  },
  {
    term: "Cripple stud",
    def: "Short stud above a header or below a sill, continuing wall spacing.",
  },
  {
    term: "16\" OC",
    def: "Standard residential stud spacing: centers 16 inches apart.",
  },
] as const;
