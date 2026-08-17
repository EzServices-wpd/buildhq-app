# BuildHq 0.7.2 Delta — Upload Notes

**Date:** 2026-08-16  
**From:** autonomous night-build run  
**Target:** continue 0.7.x structure/forge track (production remains 0.6.5 Closet+Forge)

## What shipped

1. Full StructureGraph type system + primitives (addNode/addEdge, validate, scale, bounds, length)
2. latticeTower generator with real tapering geometry, X-bracing, rings, multi-platform support
3. Convenience templates: patioTower, eiffelModel(1:50), scaffoldFrame
4. graphToInstances + grid placement helpers
5. Universal Help Me Build (`generateForgeReport`) producing:
   - Grouped cut list
   - Per-node join specs + hardware
   - BOM with lumber waste factor
   - Role-ordered construction steps with tools & safety notes
   - Weight & cost estimates
6. Material catalog starter
7. Working smoke test (`npm run smoke`)

## Files in this delta

```
package.json
tsconfig.json
README.md
UPLOAD_0.7.2.md
src/types/structure.ts
src/lib/structure/StructureGraph.ts
src/lib/structure/latticeTower.ts
src/lib/structure/graphToInstances.ts
src/lib/forge/forgeReport.ts
src/lib/catalog/materials.ts
src/index.ts
```

## How to integrate

- Drop `src/lib/structure`, `src/lib/forge`, `src/lib/catalog`, `src/types` into the existing 0.7.x tree (or replace the prior 0.7.0/0.7.1 sourcing delta).
- Wire `generateForgeReport(graph, instances)` into the Help Me Build UI entrypoint.
- Keep production 0.6.5 untouched until the structure track is feature-complete and QA'd.

## Smoke verification

```bash
npx tsx src/index.ts
```

Expected: patio + Eiffel + custom lookout + multi-instance reports print with zero validation warnings.

## Risks / known gaps

- Multi-bay (bays > 1) only recorded in metadata; no intermediate nodes yet
- Rectangular footprints approximated as square
- Cost / density numbers are placeholders
- No React/Three canvas binding in this delta
- Angle cuts are still 0° (geometry-aware miter calculation next)
- Instance material overrides not yet merged into BOM

## Recommended next night slice

1. Geometry-derived cut angles + true miters
2. Multi-bay edge subdivision
3. CSV / printable build-sheet export
4. Bind StructureGraph → existing Forge canvas instances
