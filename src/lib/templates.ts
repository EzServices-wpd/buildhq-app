import type { DesignJson, Component } from "@/types/project";
import { createId } from "@/lib/utils";
import { withUpdatedJoints } from "@/lib/ai/joints";

export type TemplateId =
  | "linen_closet"
  | "pantry"
  | "glass_display"
  | "media_niche"
  | "wide_wardrobe";

export type ProjectTemplate = {
  id: TemplateId;
  name: string;
  description: string;
  build: () => DesignJson;
};

function uprights(
  W: number,
  H: number,
  D: number,
  panel = 0.75,
  material: Component["material"] = "plywood_3_4"
): Component[] {
  return [
    {
      id: createId("up"),
      type: "upright",
      name: "Left upright",
      position: { x: 0, y: 0, z: 0 },
      size: { width: panel, height: H, depth: D },
      material,
    },
    {
      id: createId("up"),
      type: "upright",
      name: "Right upright",
      position: { x: W - panel, y: 0, z: 0 },
      size: { width: panel, height: H, depth: D },
      material,
    },
  ];
}

function shelf(
  name: string,
  y: number,
  W: number,
  D: number,
  panel = 0.75,
  material: Component["material"] = "plywood_3_4",
  type: Component["type"] = "shelf"
): Component {
  return {
    id: createId(type === "glass_panel" ? "gl" : "sh"),
    type,
    name,
    position: { x: panel, y, z: type === "glass_panel" ? 0.5 : 0 },
    size: {
      width: W - panel * 2,
      height: type === "glass_panel" ? 0.25 : panel,
      depth: type === "glass_panel" ? Math.max(4, D - 1) : D,
    },
    material,
  };
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: "linen_closet",
    name: "Linen / bathroom closet",
    description: "Narrow 31.5×78×16 — irregular bathroom opening",
    build: () => {
      const W = 31.5,
        H = 78,
        D = 16,
        p = 0.75;
      return withUpdatedJoints({
        version: 1,
        overall: { width: W, height: H, depth: D },
        components: [
          ...uprights(W, H, D, p),
          shelf("Bottom shelf", 0, W, D, p),
          shelf("Middle shelf", 28, W, D, p),
          shelf("Top shelf", 54, W, D, p),
        ],
        fasteners: [],
        assumptions: {
          load: "medium",
          units: "inches",
          installMode: "wall",
          wallType: "wood_stud",
        },
      });
    },
  },
  {
    id: "pantry",
    name: "Pantry tower",
    description: "24×84×16 with denser shelf spacing",
    build: () => {
      const W = 24,
        H = 84,
        D = 16,
        p = 0.75;
      const ys = [0, 14, 28, 42, 56, 70];
      return withUpdatedJoints({
        version: 1,
        overall: { width: W, height: H, depth: D },
        components: [
          ...uprights(W, H, D, p, "melamine_white"),
          ...ys.map((y, i) =>
            shelf(
              i === 0 ? "Bottom shelf" : `Shelf ${i}`,
              y,
              W,
              D,
              p,
              "melamine_white"
            )
          ),
        ],
        fasteners: [],
        assumptions: {
          load: "medium",
          units: "inches",
          installMode: "wall",
          wallType: "wood_stud",
        },
      });
    },
  },
  {
    id: "glass_display",
    name: "Glass display cabinet",
    description: "Wood frame + clear glass shelves",
    build: () => {
      const W = 36,
        H = 72,
        D = 14,
        p = 0.75;
      return withUpdatedJoints({
        version: 1,
        overall: { width: W, height: H, depth: D },
        components: [
          ...uprights(W, H, D, p, "solid_oak"),
          shelf("Bottom shelf", 0, W, D, p, "solid_oak"),
          shelf("Glass shelf 1", 22, W, D, p, "glass_clear_1_4", "glass_panel"),
          shelf("Glass shelf 2", 42, W, D, p, "glass_clear_1_4", "glass_panel"),
          shelf("Top shelf", H - p, W, D, p, "solid_oak", "top"),
          {
            id: createId("bk"),
            type: "back",
            name: "Back panel",
            position: { x: p, y: p, z: D - 0.25 },
            size: { width: W - p * 2, height: H - p * 2, depth: 0.25 },
            material: "plywood_1_4",
            cutouts: [
              {
                id: createId("cut"),
                x: 4,
                y: (H - p * 2) * 0.35,
                width: Math.max(6, W - p * 2 - 8),
                height: (H - p * 2) * 0.28,
                label: "Display opening",
              },
            ],
          },
        ],
        fasteners: [],
        assumptions: {
          load: "light",
          units: "inches",
          installMode: "wall",
          wallType: "wood_stud",
        },
      });
    },
  },
  {
    id: "media_niche",
    name: "Media niche",
    description: "Wide low unit for AV gear",
    build: () => {
      const W = 48,
        H = 30,
        D = 18,
        p = 0.75;
      return withUpdatedJoints({
        version: 1,
        overall: { width: W, height: H, depth: D },
        components: [
          ...uprights(W, H, D, p, "plywood_3_4"),
          shelf("Bottom", 0, W, D, p),
          shelf("Middle", 12, W, D, p),
          shelf("Top", H - p, W, D, p, "plywood_3_4", "top"),
          {
            id: createId("dv"),
            type: "divider",
            name: "Center divider",
            position: { x: W / 2 - p / 2, y: p, z: 0 },
            size: { width: p, height: H - 2 * p, depth: D },
            material: "plywood_3_4",
          },
        ],
        fasteners: [],
        assumptions: {
          load: "medium",
          units: "inches",
          installMode: "wall",
          wallType: "wood_stud",
        },
      });
    },
  },
  {
    id: "wide_wardrobe",
    name: "Wide wardrobe",
    description: "60×84×24 with center divider",
    build: () => {
      const W = 60,
        H = 84,
        D = 24,
        p = 0.75;
      return withUpdatedJoints({
        version: 1,
        overall: { width: W, height: H, depth: D },
        components: [
          ...uprights(W, H, D, p),
          {
            id: createId("dv"),
            type: "divider",
            name: "Center divider",
            position: { x: W / 2 - p / 2, y: 0, z: 0 },
            size: { width: p, height: H, depth: D },
            material: "plywood_3_4",
          },
          {
            id: createId("sh"),
            type: "shelf",
            name: "Bottom left",
            position: { x: p, y: 0, z: 0 },
            size: { width: W / 2 - p * 1.5, height: p, depth: D },
            material: "plywood_3_4",
          },
          {
            id: createId("sh"),
            type: "shelf",
            name: "Bottom right",
            position: { x: W / 2 + p / 2, y: 0, z: 0 },
            size: { width: W / 2 - p * 1.5, height: p, depth: D },
            material: "plywood_3_4",
          },
          {
            id: createId("sh"),
            type: "shelf",
            name: "Mid left",
            position: { x: p, y: 40, z: 0 },
            size: { width: W / 2 - p * 1.5, height: p, depth: D },
            material: "plywood_3_4",
          },
          {
            id: createId("sh"),
            type: "shelf",
            name: "Mid right",
            position: { x: W / 2 + p / 2, y: 40, z: 0 },
            size: { width: W / 2 - p * 1.5, height: p, depth: D },
            material: "plywood_3_4",
          },
          shelf("Top", H - p, W, D, p, "plywood_3_4", "top"),
        ],
        fasteners: [],
        assumptions: {
          load: "heavy",
          units: "inches",
          installMode: "wall",
          wallType: "wood_stud",
        },
      });
    },
  },
];

export function getTemplate(id: TemplateId): ProjectTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
