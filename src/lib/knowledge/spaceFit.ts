/**
 * Given a free-form space measurement, suggest what BuildHq / DIY projects can fit.
 */

export type SpaceKind =
  | "closet_niche"
  | "window_rough_opening"
  | "door_rough_opening"
  | "shelving_alcove"
  | "general_volume";

export interface SpaceMeasurement {
  widthIn: number;
  heightIn: number;
  depthIn?: number;
  kindHint?: SpaceKind;
  loadBearingWall?: boolean;
}

export interface SpaceOption {
  id: string;
  title: string;
  category: "built_in" | "window" | "door" | "storage" | "other";
  confidence: "high" | "medium" | "low";
  summary: string;
  nextSteps: string[];
  /** Optional deep-link into workspace template id */
  templateId?: string;
}

export function classifySpace(m: SpaceMeasurement): SpaceKind {
  if (m.kindHint) return m.kindHint;
  const d = m.depthIn ?? 0;
  // Shallow + tall-ish → likely wall opening
  if (d > 0 && d <= 8 && m.widthIn >= 18 && m.heightIn >= 24) {
    return "window_rough_opening";
  }
  if (d >= 12 && d <= 30 && m.widthIn >= 18 && m.heightIn >= 48) {
    return "closet_niche";
  }
  if (d >= 8 && m.widthIn >= 24 && m.heightIn >= 36) {
    return "shelving_alcove";
  }
  return "general_volume";
}

export function suggestForSpace(m: SpaceMeasurement): SpaceOption[] {
  const kind = classifySpace(m);
  const options: SpaceOption[] = [];
  const d = m.depthIn ?? 16;

  if (kind === "window_rough_opening" || (m.widthIn >= 20 && m.heightIn >= 30 && d <= 10)) {
    options.push({
      id: "win-match",
      title: "Match a standard window to this rough opening",
      category: "window",
      confidence: "high",
      summary: `Measured RO ≈ ${m.widthIn}" × ${m.heightIn}". Find unit sizes that leave shim space and get a framing checklist.`,
      nextSteps: [
        "Open Space Fit → Windows and enter RO width/height",
        "Compare good/tight fits against manufacturer charts",
        "Review king/jack/header heuristics before cutting",
      ],
    });
  }

  if (m.widthIn >= 18 && m.heightIn >= 48 && d >= 12) {
    options.push({
      id: "closet",
      title: "Custom closet / linen built-in",
      category: "built_in",
      confidence: d >= 14 && d <= 28 ? "high" : "medium",
      summary: `Volume supports uprights + shelves in a ${m.widthIn}" × ${m.heightIn}" × ${d}" niche.`,
      nextSteps: [
        "Open Workspace and set overall dimensions to your niche",
        "Use Templates (linen / pantry / wardrobe) as a starting point",
        "Run Help Me Build for cut list, nesting, and fasteners",
      ],
      templateId: m.widthIn >= 48 ? "wide_wardrobe" : "linen_closet",
    });
  }

  if (m.widthIn >= 24 && m.heightIn >= 30 && d >= 8) {
    options.push({
      id: "shelves",
      title: "Open shelving / pantry bay",
      category: "storage",
      confidence: "high",
      summary: "Add wood or glass shelves with auto joint placement.",
      nextSteps: [
        "Workspace → + Wood or + Glass",
        "Set load expectation (light/medium/heavy) for span checks",
      ],
      templateId: "pantry",
    });
  }

  if (m.widthIn >= 24 && m.heightIn >= 48 && d >= 12 && d <= 18) {
    options.push({
      id: "glass-display",
      title: "Glass display / media niche",
      category: "built_in",
      confidence: "medium",
      summary: "Wood frame with glass shelves; optional back opening.",
      nextSteps: ["Template: Glass display", "Confirm glass clip spacing in Help Me Build"],
      templateId: "glass_display",
    });
  }

  if (m.widthIn >= 28 && m.heightIn >= 78 && d <= 8) {
    options.push({
      id: "door-ro",
      title: "Door rough opening (prehung)",
      category: "door",
      confidence: "medium",
      summary:
        "Typical prehung doors need ~+2\" width and ~+2–2.5\" height over slab. Confirm jamb kit specs.",
      nextSteps: [
        "Measure RO at three heights/widths; use the smallest",
        "Check header and jack count for span",
      ],
    });
  }

  options.push({
    id: "custom",
    title: "Freeform design in the 3D workspace",
    category: "other",
    confidence: "high",
    summary: "Any rectangular volume can start as uprights + shelves + dividers, then Help Me Build.",
    nextSteps: ["Open /workspace", "Set overall W×H×D", "Design → Help Me Build"],
  });

  return options;
}
