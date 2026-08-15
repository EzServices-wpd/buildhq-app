import { z } from "zod";

/** Overall bounding box of the project (inches) */
export const DimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
});

export type Dimensions = z.infer<typeof DimensionsSchema>;

/** Material category for UI grouping + rendering */
export const MaterialCategorySchema = z.enum([
  "wood",
  "composite",
  "glass",
  "metal",
  "hardware",
]);
export type MaterialCategory = z.infer<typeof MaterialCategorySchema>;

/**
 * Expanded material library — wood, glass, metal, composite.
 * Visual props drive 3D PBR; thickness drives cut lists.
 */
export const MaterialTypeSchema = z.enum([
  // Wood
  "plywood_3_4",
  "plywood_1_2",
  "plywood_1_4",
  "solid_pine",
  "solid_oak",
  "solid_walnut",
  "solid_maple",
  // Composite
  "mdf",
  "melamine_white",
  "particle_board",
  // Glass
  "glass_clear_1_4",
  "glass_clear_3_8",
  "glass_frosted",
  "glass_tempered",
  "acrylic_clear",
  // Metal
  "aluminum_sheet",
  "steel_sheet",
  "brushed_stainless",
  "brass_sheet",
  "metal_angle",
]);

export type MaterialType = z.infer<typeof MaterialTypeSchema>;

export type MaterialInfo = {
  label: string;
  category: MaterialCategory;
  thicknessIn: number;
  description: string;
  /** Base albedo for 3D */
  color: string;
  metalness: number;
  roughness: number;
  /** 0–1; glass/acrylic < 1 */
  opacity: number;
  /** Whether parts can be nested on 4x8 sheet stock */
  sheetGoods: boolean;
  searchTerms: string[];
};

export const MATERIAL_INFO: Record<MaterialType, MaterialInfo> = {
  plywood_3_4: {
    label: '3/4" Plywood',
    category: "wood",
    thicknessIn: 0.75,
    description: "Standard cabinet-grade plywood",
    color: "#d4a574",
    metalness: 0.02,
    roughness: 0.65,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["3/4 cabinet plywood 4x8", "BC plywood"],
  },
  plywood_1_2: {
    label: '1/2" Plywood',
    category: "wood",
    thicknessIn: 0.5,
    description: "Lighter shelves / backs",
    color: "#e0b887",
    metalness: 0.02,
    roughness: 0.65,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["1/2 plywood 4x8"],
  },
  plywood_1_4: {
    label: '1/4" Plywood',
    category: "wood",
    thicknessIn: 0.25,
    description: "Back panels, thin dividers",
    color: "#ecd3a8",
    metalness: 0.02,
    roughness: 0.7,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["1/4 plywood underlayment"],
  },
  solid_pine: {
    label: "Solid Pine",
    category: "wood",
    thicknessIn: 0.75,
    description: "Affordable solid softwood",
    color: "#e8d5a3",
    metalness: 0.0,
    roughness: 0.7,
    opacity: 1,
    sheetGoods: false,
    searchTerms: ["1x pine board", "select pine"],
  },
  solid_oak: {
    label: "Solid Oak",
    category: "wood",
    thicknessIn: 0.75,
    description: "Premium hardwood",
    color: "#c4a574",
    metalness: 0.0,
    roughness: 0.55,
    opacity: 1,
    sheetGoods: false,
    searchTerms: ["red oak board", "white oak lumber"],
  },
  solid_walnut: {
    label: "Solid Walnut",
    category: "wood",
    thicknessIn: 0.75,
    description: "Dark premium hardwood",
    color: "#5c4033",
    metalness: 0.0,
    roughness: 0.5,
    opacity: 1,
    sheetGoods: false,
    searchTerms: ["walnut lumber", "black walnut board"],
  },
  solid_maple: {
    label: "Solid Maple",
    category: "wood",
    thicknessIn: 0.75,
    description: "Hard, light-colored hardwood",
    color: "#e8dcc8",
    metalness: 0.0,
    roughness: 0.45,
    opacity: 1,
    sheetGoods: false,
    searchTerms: ["hard maple board"],
  },
  mdf: {
    label: "MDF",
    category: "composite",
    thicknessIn: 0.75,
    description: "Smooth, paint-grade",
    color: "#d4d0c8",
    metalness: 0.0,
    roughness: 0.85,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["3/4 MDF 4x8"],
  },
  melamine_white: {
    label: "White Melamine",
    category: "composite",
    thicknessIn: 0.75,
    description: "Pre-finished cabinet panels",
    color: "#f5f5f0",
    metalness: 0.05,
    roughness: 0.35,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["white melamine 4x8", "thermofused melamine"],
  },
  particle_board: {
    label: "Particle Board",
    category: "composite",
    thicknessIn: 0.75,
    description: "Budget core stock",
    color: "#c9b896",
    metalness: 0.0,
    roughness: 0.9,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["particle board 4x8"],
  },
  glass_clear_1_4: {
    label: '1/4" Clear Glass',
    category: "glass",
    thicknessIn: 0.25,
    description: "Standard float glass shelves / doors",
    color: "#a8d4e8",
    metalness: 0.1,
    roughness: 0.05,
    opacity: 0.35,
    sheetGoods: false,
    searchTerms: ["1/4 clear glass shelf", "float glass"],
  },
  glass_clear_3_8: {
    label: '3/8" Clear Glass',
    category: "glass",
    thicknessIn: 0.375,
    description: "Heavier glass shelves",
    color: "#9ec9e0",
    metalness: 0.1,
    roughness: 0.05,
    opacity: 0.4,
    sheetGoods: false,
    searchTerms: ["3/8 clear glass"],
  },
  glass_frosted: {
    label: "Frosted Glass",
    category: "glass",
    thicknessIn: 0.25,
    description: "Privacy / soft diffusion",
    color: "#dce8ef",
    metalness: 0.05,
    roughness: 0.55,
    opacity: 0.55,
    sheetGoods: false,
    searchTerms: ["frosted glass panel", "etched glass"],
  },
  glass_tempered: {
    label: "Tempered Glass",
    category: "glass",
    thicknessIn: 0.25,
    description: "Safety glass for doors / exposed edges",
    color: "#b0d4e6",
    metalness: 0.12,
    roughness: 0.04,
    opacity: 0.38,
    sheetGoods: false,
    searchTerms: ["tempered glass door", "safety glass"],
  },
  acrylic_clear: {
    label: "Clear Acrylic",
    category: "glass",
    thicknessIn: 0.25,
    description: "Lightweight plastic alternative to glass",
    color: "#c5e4f0",
    metalness: 0.05,
    roughness: 0.15,
    opacity: 0.45,
    sheetGoods: true,
    searchTerms: ["acrylic sheet 1/4", "plexiglass"],
  },
  aluminum_sheet: {
    label: "Aluminum Sheet",
    category: "metal",
    thicknessIn: 0.125,
    description: "Lightweight metal panels / backs",
    color: "#c0c6cc",
    metalness: 0.85,
    roughness: 0.35,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["aluminum sheet metal", "5052 aluminum"],
  },
  steel_sheet: {
    label: "Steel Sheet",
    category: "metal",
    thicknessIn: 0.125,
    description: "Structural / industrial panels",
    color: "#8a9096",
    metalness: 0.9,
    roughness: 0.4,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["sheet steel", "cold rolled steel"],
  },
  brushed_stainless: {
    label: "Brushed Stainless",
    category: "metal",
    thicknessIn: 0.06,
    description: "Appliance-grade finish panels",
    color: "#b8bdbf",
    metalness: 0.95,
    roughness: 0.28,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["brushed stainless steel sheet"],
  },
  brass_sheet: {
    label: "Brass Sheet",
    category: "metal",
    thicknessIn: 0.06,
    description: "Decorative accents",
    color: "#c9a227",
    metalness: 0.9,
    roughness: 0.3,
    opacity: 1,
    sheetGoods: true,
    searchTerms: ["brass sheet metal"],
  },
  metal_angle: {
    label: "Metal Angle / Channel",
    category: "metal",
    thicknessIn: 0.125,
    description: "Frames, uprights, edge reinforcement",
    color: "#9aa0a6",
    metalness: 0.88,
    roughness: 0.45,
    opacity: 1,
    sheetGoods: false,
    searchTerms: ["aluminum angle", "steel angle iron"],
  },
};

export const MATERIAL_CATEGORIES: {
  id: MaterialCategory;
  label: string;
}[] = [
  { id: "wood", label: "Wood" },
  { id: "composite", label: "Composite" },
  { id: "glass", label: "Glass & Acrylic" },
  { id: "metal", label: "Metal" },
];

/** A single panel / component in the design */
export const ComponentSchema = z.object({
  id: z.string(),
  type: z.enum([
    "upright",
    "shelf",
    "divider",
    "top",
    "bottom",
    "back",
    "door",
    "drawer_front",
    "glass_panel",
    "window",
    "metal_frame",
  ]),
  name: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  size: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive(),
  }),
  material: MaterialTypeSchema,
  notes: z.string().optional(),
  /** Optional rectangular openings in panel local XY (inches from panel origin) */
  cutouts: z
    .array(
      z.object({
        id: z.string(),
        x: z.number(),
        y: z.number(),
        width: z.number().positive(),
        height: z.number().positive(),
        label: z.string().optional(),
      })
    )
    .optional(),
});

export type Component = z.infer<typeof ComponentSchema>;

export const FastenerSchema = z.object({
  id: z.string(),
  type: z.enum([
    "pocket_screw",
    "confirmat",
    "wood_screw",
    "dowel",
    "bracket",
    "glass_clip",
    "metal_screw",
    "wall_anchor",
    "lag_bolt",
    "toggle_bolt",
    "concrete_screw",
    "framing_nail",
  ]),
  fromId: z.string(),
  toId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  quantity: z.number().int().positive().default(2),
  note: z.string().optional(),
});

export type Fastener = z.infer<typeof FastenerSchema>;

export const FASTENER_INFO: Record<
  Fastener["type"],
  { label: string; searchTerms: string[] }
> = {
  pocket_screw: {
    label: '1-1/4" pocket screws',
    searchTerms: ["pocket hole screws", "Kreg screws"],
  },
  confirmat: {
    label: "Confirmat screws",
    searchTerms: ["confirmat screws"],
  },
  wood_screw: {
    label: "#8 wood screws",
    searchTerms: ["#8 wood screws"],
  },
  dowel: {
    label: "Wooden dowels",
    searchTerms: ["wood dowels 3/8"],
  },
  bracket: {
    label: "L-brackets / corner braces",
    searchTerms: ["corner braces", "L brackets"],
  },
  glass_clip: {
    label: "Glass shelf clips",
    searchTerms: ["glass shelf clips", "shelf support pegs"],
  },
  metal_screw: {
    label: "Self-tapping metal screws",
    searchTerms: ["self tapping sheet metal screws"],
  },
  wall_anchor: {
    label: "Wall anchors (stud-rated)",
    searchTerms: ["heavy duty wall anchors", "snap toggle"],
  },
  lag_bolt: {
    label: "Lag bolts / structural screws",
    searchTerms: ["lag screws", "structural wood screws"],
  },
  toggle_bolt: {
    label: "Toggle bolts (hollow wall)",
    searchTerms: ["toggle bolts", "hollow wall anchors"],
  },
  concrete_screw: {
    label: "Concrete / masonry screws",
    searchTerms: ["Tapcon concrete screws", "masonry anchors"],
  },
  framing_nail: {
    label: "Framing nails / gun nails",
    searchTerms: ["16d framing nails", "framing nailer nails"],
  },
};

/** Single instance of a real catalog product (Forge mode) */
export const ForgeInstanceSchema = z.object({
  id: z.string(),
  catalogId: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  /** Euler radians */
  rotation: z
    .object({
      x: z.number().default(0),
      y: z.number().default(0),
      z: z.number().default(0),
    })
    .default({ x: 0, y: 0, z: 0 }),
  /** Optional shorter length when material can be cut */
  cutLength: z.number().positive().optional(),
});

export type ForgeInstance = z.infer<typeof ForgeInstanceSchema>;

export const ForgeConfigSchema = z.object({
  /** Primary catalog material id from Material Universe */
  primaryMaterialId: z.string().nullable().default(null),
  mode: z.enum(["closet", "freehand", "prompt"]).default("closet"),
  lastPrompt: z.string().optional(),
  allowMixed: z.boolean().default(false),
});

export type ForgeConfig = z.infer<typeof ForgeConfigSchema>;

export const DesignJsonSchema = z.object({
  version: z.literal(1),
  overall: DimensionsSchema,
  components: z.array(ComponentSchema),
  fasteners: z.array(FastenerSchema).default([]),
  /** Forge / Material Universe state — optional so old designs still load */
  forge: ForgeConfigSchema.optional(),
  /** Discrete real-product instances when in freehand or prompt mode */
  forgeInstances: z.array(ForgeInstanceSchema).optional(),
  assumptions: z
    .object({
      load: z.enum(["light", "medium", "heavy"]).default("medium"),
      units: z.literal("inches").default("inches"),
      /** How the unit sits in the room */
      installMode: z.enum(["wall", "freestanding", "alcove"]).default("wall"),
      /** Substrate when installMode is wall or alcove */
      wallType: z
        .enum(["wood_stud", "drywall_only", "masonry", "concrete"])
        .default("wood_stud"),
      /** Optional window RO when this is a fenestration job */
      windowRoughOpening: z
        .object({
          widthIn: z.number().positive(),
          heightIn: z.number().positive(),
          unitWidthIn: z.number().positive().optional(),
          unitHeightIn: z.number().positive().optional(),
        })
        .optional(),
    })
    .default({
      load: "medium",
      units: "inches",
      installMode: "wall",
      wallType: "wood_stud",
    }),
});

export type DesignJson = z.infer<typeof DesignJsonSchema>;

export const CutListItemSchema = z.object({
  partId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  lengthIn: z.number().positive(),
  widthIn: z.number().positive(),
  thicknessIn: z.number().positive(),
  material: MaterialTypeSchema,
  grainDirection: z.enum(["length", "width", "either"]).optional(),
  notes: z.string().optional(),
});

export type CutListItem = z.infer<typeof CutListItemSchema>;

export const BomItemSchema = z.object({
  name: z.string(),
  quantity: z.number().positive(),
  unit: z.string().default("ea"),
  materialHint: z.string().optional(),
  searchTerms: z.array(z.string()).optional(),
  estimatedSize: z.string().optional(),
  notes: z.string().optional(),
});

export type BomItem = z.infer<typeof BomItemSchema>;

/** Diagram kind for illustrated assembly steps */
export const DiagramKindSchema = z.enum([
  "layout",
  "uprights",
  "shelf",
  "fasteners",
  "glass",
  "door",
  "finish",
  "generic",
]);
export type DiagramKind = z.infer<typeof DiagramKindSchema>;

export const AssemblyStepSchema = z.object({
  step: z.number().int().positive(),
  title: z.string(),
  description: z.string(),
  partsUsed: z.array(z.string()).optional(),
  tips: z.string().optional(),
  diagram: DiagramKindSchema.optional(),
});

export type AssemblyStep = z.infer<typeof AssemblyStepSchema>;

export const NestSheetPartSchema = z.object({
  id: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotated: z.boolean(),
  material: z.string(),
});

export const NestSheetSchema = z.object({
  index: z.number().int().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  material: z.string(),
  parts: z.array(NestSheetPartSchema),
  usedArea: z.number(),
  utilization: z.number(),
});

export type NestSheet = z.infer<typeof NestSheetSchema>;

export const BuildReportSchema = z.object({
  feasibility: z.object({
    status: z.enum(["ok", "warnings", "critical"]),
    summary: z.string(),
    issues: z.array(
      z.object({
        severity: z.enum(["info", "warning", "critical"]),
        message: z.string(),
        suggestion: z.string().optional(),
        componentIds: z.array(z.string()).optional(),
      })
    ),
  }),
  cutList: z.array(CutListItemSchema),
  bom: z.array(BomItemSchema),
  instructions: z.array(AssemblyStepSchema),
  sheets: z.array(NestSheetSchema).optional(),
  nestSummary: z
    .object({
      totalSheets: z.number().int(),
      averageUtilization: z.number(),
      unplacedCount: z.number().int(),
    })
    .optional(),
  generatedAt: z.string(),
});

export type BuildReport = z.infer<typeof BuildReportSchema>;
