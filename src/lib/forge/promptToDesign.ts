/**
 * Prompt → Forge design.
 * Rule + pattern based so anyone can dream in plain English and get
 * a buildable layout of real catalog pieces. LLM can replace this later;
 * the output schema stays the same.
 */

import { getCatalogItem } from "./catalog";
import { toPrimitive } from "./geometry";
import type { CatalogItem } from "./types";

export interface ForgeInstance {
  id: string;
  catalogId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  cutLength?: number;
}

export interface ForgeDesign {
  prompt: string;
  primaryMaterialId: string;
  overall: { width: number; height: number; depth: number };
  instances: ForgeInstance[];
  notes: string[];
  estimatedUnits: number;
  structureType: string;
}

function parseSize(lower: string): { height: number; width: number; depth: number } {
  let height = 24;
  let width = 24;
  let depth = 24;

  const ftH = lower.match(/(\d+(?:\.\d+)?)\s*(?:ft|foot|feet)\s*(?:tall|high|height|tower)?/);
  const inH = lower.match(/(\d+(?:\.\d+)?)\s*(?:in|inch|inches)\s*(?:tall|high)?/);
  if (ftH) height = parseFloat(ftH[1]) * 12;
  else if (inH) height = parseFloat(inH[1]);

  const ftW = lower.match(/(\d+(?:\.\d+)?)\s*(?:ft|foot|feet)\s*(?:wide|width|long)/);
  const inW = lower.match(/(\d+(?:\.\d+)?)\s*(?:in|inch|inches)\s*(?:wide|width)/);
  if (ftW) width = parseFloat(ftW[1]) * 12;
  else if (inW) width = parseFloat(inW[1]);

  // "2 foot tower" already sets height; keep width/depth proportional if not set
  if (!ftW && !inW) {
    width = Math.max(12, height * 0.5);
    depth = width;
  }

  // Clamp dream sizes to something buildable in one session
  height = Math.min(Math.max(height, 6), 120);
  width = Math.min(Math.max(width, 6), 120);
  depth = Math.min(Math.max(depth, 6), 120);
  return { height, width, depth };
}

function detectStructure(lower: string): string {
  if (/taj|mahal|onion\s*dome|minaret/.test(lower)) return "taj";
  if (/pyramid|egyptian|giza/.test(lower)) return "pyramid";
  if (/castle|fort|keep|battlement|turret/.test(lower)) return "castle";
  if (/bridge|span|arch\s*bridge/.test(lower)) return "bridge";
  if (/house|cabin|shed|hut|cottage|home/.test(lower)) return "house";
  if (/wall|fence|barrier|screen|palisade/.test(lower)) return "wall";
  if (/dome|igloo|sphere|globe/.test(lower)) return "dome";
  if (/arch|gateway|portal/.test(lower)) return "arch";
  if (/ladder|stairs|staircase|steps/.test(lower)) return "ladder";
  if (/tower|spire|column|stack|skyscraper|obelisk/.test(lower)) return "tower";
  if (/frame|box|cube|platform|table|bench/.test(lower)) return "frame";
  return "tower"; // default ambitious
}

function piece(
  id: string,
  catalogId: string,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
  cutLength?: number
): ForgeInstance {
  return {
    id,
    catalogId,
    position: [x, y, z],
    rotation: [rx, ry, rz],
    cutLength,
  };
}

function buildTower(
  item: CatalogItem,
  catalogId: string,
  targetH: number,
  fancy = false
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const layerH = prim.length;
  const layers = Math.max(1, Math.ceil(targetH / layerH));
  const r0 = Math.max(prim.width, prim.radius ? prim.radius * 2 : 1) * 0.9;
  const instances: ForgeInstance[] = [];
  const notes: string[] = [];

  for (let i = 0; i < layers; i++) {
    const y = i * layerH + layerH / 2;
    const taper = fancy ? 1 - (i / Math.max(layers - 1, 1)) * 0.45 : 1;
    const r = r0 * taper;
    // Single column for short; ring of posts for taller / fancy
    const posts = layers < 3 && !fancy ? 1 : fancy ? 6 : 4;
    if (posts === 1) {
      instances.push(piece(`t-${i}`, catalogId, 0, y, 0));
    } else {
      for (let p = 0; p < posts; p++) {
        const a = (p / posts) * Math.PI * 2;
        instances.push(
          piece(`t-${i}-${p}`, catalogId, Math.cos(a) * r, y, Math.sin(a) * r, 0, a, 0)
        );
      }
    }
  }
  notes.push(
    `Tower · ${layers} layer(s) · ~${(layers * layerH).toFixed(0)}" tall · ${item.name}`
  );
  return { instances, notes };
}

function buildTaj(
  item: CatalogItem,
  catalogId: string,
  targetH: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const layerH = prim.length;
  const bodyLayers = Math.max(2, Math.ceil((targetH * 0.65) / layerH));
  const domeLayers = Math.max(1, Math.ceil((targetH * 0.25) / layerH));
  const rBody = Math.max(8, prim.width * 4);
  const instances: ForgeInstance[] = [];

  // Square base ring
  const baseY = layerH / 2;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    instances.push(
      piece(`base-${i}`, catalogId, Math.cos(a) * rBody, baseY, Math.sin(a) * rBody)
    );
  }

  // Main body — 4 corner minarets + center
  for (let i = 0; i < bodyLayers; i++) {
    const y = layerH + i * layerH + layerH / 2;
    const r = rBody * (1 - i * 0.08);
    // center
    instances.push(piece(`body-c-${i}`, catalogId, 0, y, 0));
    // four corners (minarets)
    for (let c = 0; c < 4; c++) {
      const a = (c / 4) * Math.PI * 2 + Math.PI / 4;
      instances.push(
        piece(
          `mina-${i}-${c}`,
          catalogId,
          Math.cos(a) * r * 1.15,
          y,
          Math.sin(a) * r * 1.15
        )
      );
    }
  }

  // Onion-ish top: tighter rings
  const domeBase = layerH + bodyLayers * layerH;
  for (let i = 0; i < domeLayers; i++) {
    const y = domeBase + i * layerH + layerH / 2;
    const r = rBody * 0.35 * (1 - i / Math.max(domeLayers, 1));
    const posts = Math.max(3, 6 - i);
    for (let p = 0; p < posts; p++) {
      const a = (p / posts) * Math.PI * 2;
      instances.push(
        piece(`dome-${i}-${p}`, catalogId, Math.cos(a) * r, y, Math.sin(a) * r)
      );
    }
  }
  // finial
  instances.push(
    piece(`finial`, catalogId, 0, domeBase + domeLayers * layerH + layerH / 2, 0)
  );

  return {
    instances,
    notes: [
      `Taj-inspired · base + body + dome · ~${(domeBase + domeLayers * layerH + layerH).toFixed(0)}" · ${item.name}`,
      "Refine freehand: nudge minarets, stack more for a taller dome.",
    ],
  };
}

function buildPyramid(
  item: CatalogItem,
  catalogId: string,
  targetH: number,
  baseW: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const layerH = Math.max(prim.height, prim.length * 0.3, 1);
  const layers = Math.max(3, Math.ceil(targetH / layerH));
  const instances: ForgeInstance[] = [];

  for (let i = 0; i < layers; i++) {
    const t = i / (layers - 1 || 1);
    const half = (baseW / 2) * (1 - t * 0.92);
    const y = i * layerH + layerH / 2;
    // square ring of pieces on each level
    const n = Math.max(4, Math.round((half * 8) / Math.max(prim.length, 2)));
    for (let p = 0; p < n; p++) {
      const a = (p / n) * Math.PI * 2;
      instances.push(
        piece(`py-${i}-${p}`, catalogId, Math.cos(a) * half, y, Math.sin(a) * half)
      );
    }
  }
  return {
    instances,
    notes: [`Pyramid · ${layers} levels · base ~${baseW.toFixed(0)}" · ${item.name}`],
  };
}

function buildWall(
  item: CatalogItem,
  catalogId: string,
  targetW: number,
  targetH: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const isCyl =
    item.formFactor === "tube" ||
    item.formFactor === "pipe" ||
    item.formFactor === "dowel";
  const pieceLen = prim.length;
  const pieceH = isCyl ? prim.length : prim.height;
  const cols = Math.max(1, Math.ceil(targetW / (pieceLen * 0.95)));
  const rows = Math.max(1, Math.ceil(targetH / pieceH));
  const instances: ForgeInstance[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * pieceLen * 0.95 + pieceLen / 2;
      const y = isCyl
        ? r * pieceH + pieceH / 2
        : r * pieceH + pieceH / 2;
      // horizontal sticks for non-cylinder walls on upper rows alternate
      if (!isCyl && r % 2 === 1) {
        instances.push(
          piece(`w-${r}-${c}`, catalogId, x, y, 0, 0, 0, Math.PI / 2)
        );
      } else {
        instances.push(piece(`w-${r}-${c}`, catalogId, x, y, 0));
      }
    }
  }
  return {
    instances,
    notes: [`Wall · ${cols}×${rows} · ~${(cols * pieceLen).toFixed(0)}" × ${(rows * pieceH).toFixed(0)}" · ${item.name}`],
  };
}

function buildBridge(
  item: CatalogItem,
  catalogId: string,
  span: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const deckPieces = Math.max(3, Math.ceil(span / prim.length));
  const instances: ForgeInstance[] = [];
  // deck
  for (let i = 0; i < deckPieces; i++) {
    const x = i * prim.length * 0.9 + prim.length / 2;
    instances.push(piece(`deck-${i}`, catalogId, x, prim.height / 2, 0));
  }
  // simple piers
  const pierH = Math.max(prim.length, 8);
  for (const side of [0, deckPieces - 1]) {
    const x = side * prim.length * 0.9 + prim.length / 2;
    instances.push(piece(`pier-l-${side}`, catalogId, x, pierH / 2, -prim.width * 2));
    instances.push(piece(`pier-r-${side}`, catalogId, x, pierH / 2, prim.width * 2));
  }
  // arch suggestion: raised middle pieces
  if (deckPieces >= 5) {
    const mid = Math.floor(deckPieces / 2);
    instances.push(
      piece(
        `arch`,
        catalogId,
        mid * prim.length * 0.9 + prim.length / 2,
        prim.height * 2.5,
        0
      )
    );
  }
  return {
    instances,
    notes: [`Bridge · span ~${(deckPieces * prim.length).toFixed(0)}" · ${item.name}`],
  };
}

function buildHouse(
  item: CatalogItem,
  catalogId: string,
  w: number,
  h: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const instances: ForgeInstance[] = [];
  const wallH = Math.max(prim.length, h * 0.6);
  // four corner posts
  const hw = w / 2;
  const corners: [number, number][] = [
    [-hw, -hw],
    [hw, -hw],
    [hw, hw],
    [-hw, hw],
  ];
  corners.forEach(([x, z], i) => {
    instances.push(piece(`post-${i}`, catalogId, x, wallH / 2, z));
  });
  // roof ridge
  const ridgeY = wallH + prim.length / 2;
  instances.push(piece(`ridge`, catalogId, 0, ridgeY, 0));
  // simple roof slopes
  instances.push(piece(`roof-a`, catalogId, -hw / 2, ridgeY - 1, 0, 0, 0, 0.4));
  instances.push(piece(`roof-b`, catalogId, hw / 2, ridgeY - 1, 0, 0, 0, -0.4));
  return {
    instances,
    notes: [
      `House frame · ~${w.toFixed(0)}" footprint · ${item.name}`,
      "Add freehand walls and more roof pieces as needed.",
    ],
  };
}

function buildDome(
  item: CatalogItem,
  catalogId: string,
  radius: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const instances: ForgeInstance[] = [];
  const rings = Math.max(3, Math.ceil(radius / prim.length) + 1);
  for (let ring = 0; ring < rings; ring++) {
    const t = ring / (rings - 1 || 1);
    const y = Math.sin(t * Math.PI * 0.5) * radius;
    const r = Math.cos(t * Math.PI * 0.5) * radius;
    const n = Math.max(4, Math.round((r * 2 * Math.PI) / Math.max(prim.length * 0.8, 2)));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      instances.push(
        piece(`d-${ring}-${i}`, catalogId, Math.cos(a) * r, y + prim.length / 2, Math.sin(a) * r)
      );
    }
  }
  return {
    instances,
    notes: [`Dome · radius ~${radius.toFixed(0)}" · ${item.name}`],
  };
}

function buildArch(
  item: CatalogItem,
  catalogId: string,
  span: number,
  height: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const instances: ForgeInstance[] = [];
  // two legs
  instances.push(piece(`leg-l`, catalogId, -span / 2, height / 2, 0));
  instances.push(piece(`leg-r`, catalogId, span / 2, height / 2, 0));
  // curved-ish top with several pieces
  const segs = 5;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const a = Math.PI * t;
    const x = -span / 2 + t * span;
    const y = height + Math.sin(a) * (height * 0.35);
    instances.push(piece(`arch-${i}`, catalogId, x, y, 0));
  }
  return {
    instances,
    notes: [`Arch · span ${span.toFixed(0)}" · ${item.name}`],
  };
}

function buildLadder(
  item: CatalogItem,
  catalogId: string,
  height: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const instances: ForgeInstance[] = [];
  const rails = 2;
  const spacing = Math.max(prim.width * 3, 3);
  // rails
  const rungs = Math.max(3, Math.ceil(height / (prim.length * 0.5)));
  for (let r = 0; r < rails; r++) {
    const z = (r - 0.5) * spacing;
    const n = Math.ceil(height / prim.length);
    for (let i = 0; i < n; i++) {
      instances.push(
        piece(`rail-${r}-${i}`, catalogId, 0, i * prim.length + prim.length / 2, z)
      );
    }
  }
  // rungs
  for (let i = 0; i < rungs; i++) {
    const y = ((i + 1) / (rungs + 1)) * height;
    instances.push(
      piece(`rung-${i}`, catalogId, 0, y, 0, Math.PI / 2, 0, 0)
    );
  }
  return {
    instances,
    notes: [`Ladder · ~${height.toFixed(0)}" · ${item.name}`],
  };
}

function buildFrame(
  item: CatalogItem,
  catalogId: string,
  w: number,
  h: number,
  d: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const instances: ForgeInstance[] = [];
  const corners: [number, number, number][] = [
    [-w / 2, 0, -d / 2],
    [w / 2, 0, -d / 2],
    [w / 2, 0, d / 2],
    [-w / 2, 0, d / 2],
  ];
  corners.forEach(([x, , z], i) => {
    instances.push(piece(`leg-${i}`, catalogId, x, h / 2, z));
  });
  // top rails
  instances.push(piece(`top-a`, catalogId, 0, h, -d / 2));
  instances.push(piece(`top-b`, catalogId, 0, h, d / 2));
  return {
    instances,
    notes: [`Frame · ${w.toFixed(0)}"×${h.toFixed(0)}"×${d.toFixed(0)}" · ${item.name}`],
  };
}

function buildCastle(
  item: CatalogItem,
  catalogId: string,
  targetH: number,
  baseW: number
): { instances: ForgeInstance[]; notes: string[] } {
  const prim = toPrimitive(item);
  const layerH = prim.length;
  const instances: ForgeInstance[] = [];
  const wallH = targetH * 0.7;
  const layers = Math.max(2, Math.ceil(wallH / layerH));
  const half = baseW / 2;

  // four walls (ring)
  for (let i = 0; i < layers; i++) {
    const y = i * layerH + layerH / 2;
    const n = 12;
    for (let p = 0; p < n; p++) {
      const a = (p / n) * Math.PI * 2;
      instances.push(
        piece(`wall-${i}-${p}`, catalogId, Math.cos(a) * half, y, Math.sin(a) * half)
      );
    }
  }
  // corner towers higher
  const towerExtra = Math.max(1, Math.ceil((targetH - wallH) / layerH));
  for (let c = 0; c < 4; c++) {
    const a = (c / 4) * Math.PI * 2 + Math.PI / 4;
    for (let i = 0; i < layers + towerExtra; i++) {
      const y = i * layerH + layerH / 2;
      instances.push(
        piece(
          `turret-${c}-${i}`,
          catalogId,
          Math.cos(a) * half * 1.1,
          y,
          Math.sin(a) * half * 1.1
        )
      );
    }
  }
  return {
    instances,
    notes: [
      `Castle · walls + 4 turrets · ~${(layers + towerExtra) * layerH}" · ${item.name}`,
    ],
  };
}

/**
 * Main entry: plain English + one material → buildable layout.
 */
export function heuristicPromptToDesign(
  prompt: string,
  primaryMaterialId: string
): ForgeDesign | null {
  const item = getCatalogItem(primaryMaterialId);
  if (!item) return null;

  const lower = prompt.toLowerCase().trim();
  if (!lower) return null;

  const size = parseSize(lower);
  const kind = detectStructure(lower);

  let result: { instances: ForgeInstance[]; notes: string[] };

  switch (kind) {
    case "taj":
      result = buildTaj(item, primaryMaterialId, size.height);
      break;
    case "pyramid":
      result = buildPyramid(item, primaryMaterialId, size.height, size.width);
      break;
    case "castle":
      result = buildCastle(item, primaryMaterialId, size.height, size.width);
      break;
    case "bridge":
      result = buildBridge(item, primaryMaterialId, size.width);
      break;
    case "house":
      result = buildHouse(item, primaryMaterialId, size.width, size.height);
      break;
    case "wall":
      result = buildWall(item, primaryMaterialId, size.width, size.height);
      break;
    case "dome":
      result = buildDome(item, primaryMaterialId, Math.max(size.width, size.height) / 2);
      break;
    case "arch":
      result = buildArch(item, primaryMaterialId, size.width, size.height);
      break;
    case "ladder":
      result = buildLadder(item, primaryMaterialId, size.height);
      break;
    case "frame":
      result = buildFrame(item, primaryMaterialId, size.width, size.height, size.depth);
      break;
    case "tower":
    default:
      result = buildTower(
        item,
        primaryMaterialId,
        size.height,
        /fancy|ornate|decorative|spire/.test(lower)
      );
      break;
  }

  // Cap instance count so canvas stays snappy
  const MAX = 220;
  let instances = result.instances;
  if (instances.length > MAX) {
    instances = instances.slice(0, MAX);
    result.notes.push(`Limited to ${MAX} pieces for performance — refine in freehand.`);
  }

  const xs = instances.map((i) => i.position[0]);
  const ys = instances.map((i) => i.position[1]);
  const zs = instances.map((i) => i.position[2]);
  const pad = Math.max(4, (toPrimitive(item).width || 2) * 2);

  const overall = {
    width: Math.max(12, (Math.max(...xs, 0) - Math.min(...xs, 0) || 0) + pad * 2),
    height: Math.max(12, (Math.max(...ys, 0) - Math.min(...ys, 0) || 0) + pad),
    depth: Math.max(12, (Math.max(...zs, 0) - Math.min(...zs, 0) || 0) + pad * 2),
  };

  return {
    prompt,
    primaryMaterialId,
    overall,
    instances,
    notes: result.notes,
    estimatedUnits: instances.length,
    structureType: kind,
  };
}

/** Example prompts shown in the UI so anyone knows what to try */
export const DREAM_EXAMPLES = [
  "2 foot tower from paper towels like Taj Mahal",
  "3 ft popsicle stick pyramid",
  "castle wall 4 feet wide from craft sticks",
  "PVC pipe bridge 5 feet long",
  "cardboard tube dome 18 inches",
  "popsicle stick house",
  "ladder 3 feet tall from dowels",
  "arch gateway 2 ft high from paper towel rolls",
];
