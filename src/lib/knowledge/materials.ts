/**
 * Material handling & storage basics for DIY / light commercial jobsites.
 * Not a substitute for OSHA training or site-specific safety plans.
 */

export interface MaterialTip {
  id: string;
  category: "storage" | "lifting" | "cutting" | "moisture" | "ppe";
  title: string;
  body: string;
}

export const MATERIAL_HANDLING_TIPS: MaterialTip[] = [
  {
    id: "ply-flat",
    category: "storage",
    title: "Store sheet goods flat and elevated",
    body: "Stack plywood/OSB on level pallets or stickers off the ground. Vertical leaning stacks can tip; if vertical, use a secure rack.",
  },
  {
    id: "ply-cover",
    category: "moisture",
    title: "Cover but ventilate",
    body: "Tarp sheet goods against rain while leaving airflow so condensation does not trap moisture and cause cupping.",
  },
  {
    id: "lumber-nails",
    category: "storage",
    title: "De-nail used lumber before stacking",
    body: "OSHA guidance: withdraw nails from used lumber before stacking; stack on solid level sills.",
  },
  {
    id: "stack-height",
    category: "storage",
    title: "Limit stack heights",
    body: "Manual lumber stacks generally should not exceed ~16 ft; keep free-standing stacks stable and blocked against spreading.",
  },
  {
    id: "two-person-sheet",
    category: "lifting",
    title: "Two-person sheet moves",
    body: "A full 4×8 of ¾\" plywood is heavy. Use two people, sheet carts, or walk the sheet on edge carefully — legs, not back.",
  },
  {
    id: "support-cuts",
    category: "cutting",
    title: "Support both sides when cutting",
    body: "Support the offcut so the sheet does not pinch the blade. Plan cut diagrams before breaking down full sheets.",
  },
  {
    id: "ppe-basics",
    category: "ppe",
    title: "PPE for woodwork",
    body: "Eye protection, hearing protection when cutting, dust mask/respirator for sanding and sheet goods, gloves for handling edges.",
  },
  {
    id: "acclimate",
    category: "moisture",
    title: "Acclimate interior materials",
    body: "Bring trim, flooring, and cabinets into conditioned space before install so they stabilize to site humidity.",
  },
];

export const CONTRACTING_BASICS: { title: string; points: string[] }[] = [
  {
    title: "Measure twice, order once",
    points: [
      "Record width, height, and depth at multiple points — openings are rarely perfect rectangles.",
      "Note the smallest dimension when fitting a unit into an existing rough opening.",
      "Photograph openings with a tape in frame for later reference.",
    ],
  },
  {
    title: "Rough opening vs unit size",
    points: [
      "Unit size = outside of the product frame.",
      "Rough opening = framed hole, larger than the unit for shims and leveling.",
      "Manufacturer install sheets override generic rules of thumb.",
    ],
  },
  {
    title: "Sequence matters",
    points: [
      "Structure and weather barrier before finish.",
      "Flash windows/doors in the order the manufacturer specifies (often sill → jambs → head).",
      "Do not foam-expand so aggressively that frames bow.",
    ],
  },
  {
    title: "Permits & responsibility",
    points: [
      "Enlarging openings, changing headers, or egress work often requires permits and inspection.",
      "BuildHq provides planning guidance, not stamped engineering or code approval.",
      "When in doubt, hire a licensed contractor or structural designer.",
    ],
  },
];
