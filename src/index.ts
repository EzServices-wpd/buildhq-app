/**
 * BuildHq 0.7.2 — StructureGraph + Lattice + Universal Help Me Build
 * Night-build entrypoint / smoke test
 */

import { generateLatticeTower, patioTower, eiffelModel, scaffoldFrame } from './lib/structure/latticeTower.js';
import { singleInstance, graphToInstances, gridPlacements } from './lib/structure/graphToInstances.js';
import { generateForgeReport, reportSummary } from './lib/forge/forgeReport.js';
import { getMaterial } from './lib/catalog/materials.js';
import { totalStickLengthM, validateGraph } from './lib/structure/StructureGraph.js';

console.log('══════════════════════════════════════════');
console.log('  BuildHq 0.7.2 — Night Build Smoke Test');
console.log('══════════════════════════════════════════\n');

// 1. Patio tower (DIY-friendly full size)
const patio = patioTower(2400, 1200);
console.log(`✓ Patio tower: ${patio.nodes.length} nodes, ${patio.edges.length} edges`);
console.log(`  Bounding: ${JSON.stringify(patio.boundingBox)}`);
console.log(`  Stick length: ${totalStickLengthM(patio).toFixed(2)} m`);

// 2. Eiffel-scale model
const eiffel = eiffelModel(1 / 50);
console.log(`\n✓ Eiffel 1:50 model: ${eiffel.nodes.length} nodes, ${eiffel.edges.length} edges`);
console.log(`  Height ~${((eiffel.boundingBox?.max[1] ?? 0) / 1000).toFixed(2)} m`);

// 3. Custom multi-level lattice with richer params
const custom = generateLatticeTower({
  name: 'Custom Lookout',
  heightMm: 3600,
  baseWidthMm: 1800,
  topWidthMm: 900,
  levels: 3,
  bracing: true,
  rings: true,
  platforms: [2, 3],
  legProfile: getMaterial('pine-4x4'),
  braceProfile: getMaterial('pine-2x2'),
  ringProfile: getMaterial('pine-2x4'),
  jointType: 'bolt-plate',
});
console.log(`\n✓ Custom lookout: ${custom.nodes.length} nodes, ${custom.edges.length} edges`);

// 4. Universal Help Me Build report
const instances = singleInstance(custom);
const report = generateForgeReport(custom, instances);
console.log('\n' + reportSummary(report));

console.log('\n── Sample Build Steps ──');
for (const s of report.steps.slice(0, 4)) {
  console.log(`  ${s.order}. [${s.role}] ${s.title} (~${s.estimatedMinutes} min)`);
}

console.log('\n── Top Cut List Items ──');
for (const c of report.cutList.slice(0, 5)) {
  console.log(
    `  ${c.quantity}× ${c.profile.name} @ ${c.lengthMm} mm` +
      (c.cutAngleFromDeg || c.cutAngleToDeg
        ? ` (angles ${c.cutAngleFromDeg}°/${c.cutAngleToDeg}°)`
        : '') +
      (c.role ? ` [${c.role}]` : '')
  );
}

console.log('\n── BOM excerpt ──');
for (const b of report.bom.slice(0, 6)) {
  console.log(`  ${b.qty} ${b.unit} — ${b.name} (${b.category})`);
}

// 5. Multi-instance example (grid of small frames)
const shelf = scaffoldFrame(1800, 800, 400, 3);
const grid = graphToInstances(shelf, gridPlacements(2, 2, 1200, 1000));
const multiReport = generateForgeReport(shelf, grid, { projectName: 'Modular Shelf Wall' });
console.log(`\n✓ Multi-instance shelf wall: ${grid.length} instances`);
console.log(`  Total stick length: ${multiReport.totals.totalStickLengthM} m`);
console.log(`  Est. cost: $${multiReport.totals.estimatedCostUsd}`);

const allWarnings = [
  ...validateGraph(patio),
  ...validateGraph(eiffel),
  ...validateGraph(custom),
  ...validateGraph(shelf),
];
console.log(`\nValidation warnings across all graphs: ${allWarnings.length === 0 ? 'none' : allWarnings.join('; ')}`);

console.log('\n══════════════════════════════════════════');
console.log('  BuildHq 0.7.2 smoke test complete ✓');
console.log('══════════════════════════════════════════');
