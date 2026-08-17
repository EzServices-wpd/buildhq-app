/**
 * Starter material catalog for BuildHq Forge
 * Expandable — 0.7.2
 */

import type { MaterialProfile } from '../../types/structure.js';

export const MATERIALS: Record<string, MaterialProfile> = {
  'pine-2x4': {
    sku: 'pine-2x4',
    name: 'Construction Pine 2×4',
    section: '2x4',
    material: 'pine',
    widthMm: 38,
    heightMm: 89,
    densityKgPerM3: 500,
  },
  'pine-2x2': {
    sku: 'pine-2x2',
    name: 'Pine 2×2',
    section: '2x2',
    material: 'pine',
    widthMm: 38,
    heightMm: 38,
    densityKgPerM3: 500,
  },
  'pine-1x3': {
    sku: 'pine-1x3',
    name: 'Pine 1×3',
    section: '1x3',
    material: 'pine',
    widthMm: 19,
    heightMm: 64,
    densityKgPerM3: 500,
  },
  'pine-1x2': {
    sku: 'pine-1x2',
    name: 'Pine 1×2',
    section: '1x2',
    material: 'pine',
    widthMm: 19,
    heightMm: 38,
    densityKgPerM3: 500,
  },
  'pine-4x4': {
    sku: 'pine-4x4',
    name: 'Pine 4×4 Post',
    section: '4x4',
    material: 'pine',
    widthMm: 89,
    heightMm: 89,
    densityKgPerM3: 500,
  },
  'pine-2x6': {
    sku: 'pine-2x6',
    name: 'Pine 2×6',
    section: '2x6',
    material: 'pine',
    widthMm: 38,
    heightMm: 140,
    densityKgPerM3: 500,
  },
  'oak-2x2': {
    sku: 'oak-2x2',
    name: 'Oak 2×2',
    section: '2x2',
    material: 'oak',
    widthMm: 38,
    heightMm: 38,
    densityKgPerM3: 750,
  },
  'alum-tube-25': {
    sku: 'alum-tube-25',
    name: 'Aluminum tube Ø25 mm',
    section: 'tube-25',
    material: 'aluminum',
    widthMm: 25,
    heightMm: 25,
    wallMm: 1.5,
    densityKgPerM3: 2700,
  },
  'steel-angle-25': {
    sku: 'steel-angle-25',
    name: 'Steel angle 25×25 mm',
    section: 'angle-25',
    material: 'steel',
    widthMm: 25,
    heightMm: 25,
    densityKgPerM3: 7850,
  },
};

export function getMaterial(sku: string): MaterialProfile {
  const m = MATERIALS[sku];
  if (!m) throw new Error(`Unknown material sku: ${sku}`);
  return m;
}

export function listMaterials(): MaterialProfile[] {
  return Object.values(MATERIALS);
}
