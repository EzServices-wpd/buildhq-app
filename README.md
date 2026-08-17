# BuildHq 0.7.2

AI DIY design-to-build platform — StructureGraph, lattice towers, Universal Help Me Build.

## What's new in 0.7.2 (night build)

- **StructureGraph** core: nodes, edges, materials, validation, scale, bounds
- **latticeTower** generator: tapering multi-level towers with legs, rings, X-bracing, platforms
  - `patioTower()`, `eiffelModel(scale)`, `scaffoldFrame()`, full `generateLatticeTower(params)`
- **graphToInstances**: placement helpers, grid layouts, multi-copy support
- **Universal Help Me Build** (`forgeReport.ts`):
  - Cut list (grouped by profile + length + angles)
  - Join specs with inferred joint types + hardware suggestions
  - BOM (lumber with waste factor + hardware)
  - Role-ordered build steps (foundation → legs → rings → bracing → platform → joinery → finish)
  - Totals: length, weight, cost estimate
- Starter material catalog (pine, oak, aluminum tube, steel angle)

Live production remains the clean 0.6.5 Closet+Forge app. This is the 0.7.x structure / forge track.

## Quick start

```bash
npm install
npm run smoke          # runs the full smoke test
npx tsx src/index.ts
```

## Key files

```
src/
  types/structure.ts          # core types
  lib/structure/
    StructureGraph.ts         # graph primitives
    latticeTower.ts           # tower generators
    graphToInstances.ts       # instance placement
  lib/forge/
    forgeReport.ts            # Universal Help Me Build
  lib/catalog/
    materials.ts              # material profiles
  index.ts                    # smoke / demo
```

## Next leverage opportunities

- Multi-bay subdivision + intermediate verticals
- True rectangular (non-square) footprints
- Cut optimization / nesting against stock lengths
- Richer joint library + angle calculation from geometry
- Export to cut-list CSV / PDF build sheet
- React canvas viewer binding (Forge canvas)

## Version

0.7.2 — autonomous night build
