# BuildHq Forge Roadmap

## Live: v0.7.0 — Phase 1 start (Eiffel v1)

### Done
- StructureGraph schema (nodes, edges, joins, envelope)
- Parametric lattice / Eiffel generator (true-scale height)
- graphToInstances: stock-aware subdivision + splice joins + orientation
- Prompt detects "Eiffel" / "lattice" → graph path
- Dream chip: "3 foot Eiffel Tower from popsicle sticks"
- Assumptions + join summary in generation notes

### Try
1. Workspace → **Forge** or **Prompt**
2. Search material: popsicle
3. Prompt: `3 foot Eiffel Tower from popsicle sticks`
4. Generate → ~200–400 oriented sticks, ~36" envelope, glue joins

### Next (Phase 1 complete → Phase 2)
- [ ] LLM structured StructureGraph (not only parametric classes)
- [ ] More reference models (geodesic, truss bridge, dome frame)
- [ ] Joint markers in 3D
- [ ] Instruction sequence from graph (base → bays → tip)
- [ ] Performance path for 1k+ instances (InstancedMesh)

### North-star demo
Exact 3-ft Eiffel from popsicle sticks: correct proportions, join assumptions, cut/BOM, build order.
