/**
 * BuildHq Forge / Material Universe
 * Atomic real-world products as the unit of design.
 * Any standard-sized item becomes a buildable primitive.
 */

import { z } from "zod";

/** How the physical object is treated by geometry, packing, and joints */
export const FormFactorSchema = z.enum([
  "stick",      // popsicle, craft stick, skewer – long thin rectangular
  "dowel",      // round rod
  "tube",       // paper towel, TP, cardboard, PVC – hollow cylinder
  "pipe",       // solid-wall cylinder (PVC schedule)
  "sheet",      // plywood, cardboard sheet, foam board
  "board",      // dimensional lumber (2x4 etc) – rectangular prism
  "block",      // cubes / rectangular solids (foam, wood blocks)
  "roll",       // continuous linear that can be cut (tape, wire, string) – rare for structure
  "custom",     // user-defined bounding box
]);
export type FormFactor = z.infer<typeof FormFactorSchema>;

export const JoinMethodSchema = z.enum([
  "glue",
  "friction",
  "notch",
  "screw",
  "nail",
  "tape",
  "cable_tie",
  "slot",
  "pin",
  "solvent",    // PVC cement
  "none",
]);
export type JoinMethod = z.infer<typeof JoinMethodSchema>;

export const CatalogCategorySchema = z.enum([
  "craft_wood",
  "paper_tube",
  "pvc_plumbing",
  "lumber",
  "sheet_goods",
  "dowel_rod",
  "cardboard",
  "foam",
  "metal",
  "plastic",
  "recycled",
  "hardware",
  "other",
]);
export type CatalogCategory = z.infer<typeof CatalogCategorySchema>;

/**
 * A single real-world product that can be used as a building primitive.
 * Dimensions are nominal / typical retail sizes in inches.
 * Sources are public listings (Amazon, Home Depot, craft stores, manufacturer specs).
 */
export const CatalogItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string().optional(),
  category: CatalogCategorySchema,
  formFactor: FormFactorSchema,
  /** Primary dimensions – interpret by formFactor */
  dims: z.object({
    length: z.number().positive().optional(),   // long axis
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    thickness: z.number().positive().optional(),
    diameter: z.number().positive().optional(), // outer
    innerDiameter: z.number().positive().optional(),
  }),
  /** Typical pack quantity when sold */
  unitsPerPack: z.number().int().positive().default(1),
  /** Approximate unit cost USD for BOM estimates */
  unitCostUsd: z.number().nonnegative().optional(),
  /** Search / alias terms for the Word-style searchable menu */
  aliases: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  /** Preferred join methods for this material */
  preferredJoins: z.array(JoinMethodSchema).default(["glue"]),
  /** Can this item be cut to length? (most sticks/tubes/boards yes) */
  canCut: z.boolean().default(true),
  /** Color / visual for R3F */
  color: z.string().optional().default("#c4a574"),
  roughness: z.number().min(0).max(1).optional().default(0.7),
  metalness: z.number().min(0).max(1).optional().default(0),
  /** Public product search / example links (no scraping required for MVP) */
  searchQuery: z.string().optional(), // e.g. "standard popsicle sticks 4.5 inch"
  exampleUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

/**
 * Catalog entries are written as partial objects (defaults applied at use).
 * Use input type so metalness/color/etc. are not required on every row.
 */
export type CatalogItem = z.input<typeof CatalogItemSchema>;

/** Runtime selection + quantity for a project */
export interface SelectedMaterial {
  catalogId: string;
  quantity: number; // planned or calculated
  cutLengths?: number[]; // if canCut and we generate variable lengths
}

/** Project-level Forge state */
export interface ForgeConfig {
  primaryMaterialId: string | null;
  allowMixedMaterials: boolean;
  generationMode: "freehand" | "prompt" | "parametric";
  lastPrompt?: string;
}
