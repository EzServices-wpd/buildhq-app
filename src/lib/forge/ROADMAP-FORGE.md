# BuildHq Forge — The Update of a Lifetime

**Codename:** Material Universe / AnyMaterial  
**Status:** Foundation landed (v0.6.0-alpha)  
**Goal:** One-stop shop for *any* standard product as a buildable primitive + freehand *or* prompt → full cut/BOM/assembly pipeline.

## Why this wins

Existing tools (Prompt2CAD, Vibecrafting, CraftCut, Cabora, Buildwise) either:
- stay inside wood/sheet goods, or
- generate pretty meshes without real SKU dimensions and sourcing, or
- give shopping lists without interactive 3D + nesting.

**Nobody** ships:
1. Searchable repository of *real retail dimensions* (popsicle sticks, paper-towel cores, PVC, dowels, 2×4s, foam board…) pulled from public listings / manufacturer specs.
2. Constraint that every part is an instance of those exact products.
3. Freehand *and* natural-language generation into the same BuildHq loop (feasibility → packing → BOM with buy links → assembly).

That is the steroids injection.

## Architecture (builds on existing)

```
src/lib/forge/
  types.ts          ✅ CatalogItem, FormFactor, JoinMethod
  catalog.ts        ✅ Seed 20+ real items + fuzzy search
  geometry.ts       ✅ form-factor → primitive dims, cut packing
  promptToDesign.ts ✅ heuristic starter (LLM phase next)
  index.ts

src/components/forge/
  MaterialSearch.tsx ✅ Word-style searchable dropdown
```

Existing systems extend, not replace:
- `nesting.ts` → generalized packers (linear for sticks, 2D for sheets, radial for tubes).
- `feasibility.ts` → strength heuristics per formFactor + join method.
- `help-me-build` route → system prompt forces discrete CatalogItem instances.
- WorkspaceCanvas → InstancedMesh for sticks/tubes (hundreds of pieces stay 60 fps).
- BuildReportView → BOM rows link to `searchQuery` or exampleUrl.

## UX flow (sexy + simple)

1. **Material first** (or prompt first).
   - Big MaterialSearch at top of sidebar / floating bar.
   - Type “popsicle” → ranked results with dims + cost.
2. **Mode toggle**: Freehand | Prompt | Closet (legacy parametric).
3. **Prompt example**:  
   `2 foot tower from paper towels that looks like taj mahal`  
   → selects paper-towel-roll, generates stacked + tapered structure, shows count, estimated packs, assembly steps.
4. **Freehand**: click-to-place instances of the selected product, auto-snap + join suggestions.
5. **Help Me Build** still works — now material-aware.
6. Report: exact piece count, packing diagram (or length cut list), Home Depot / Amazon search links, illustrated steps.

## Data strategy

**MVP (now):** curated seed in `catalog.ts` with real numbers from public sources (popsicle 4.5×⅜×2mm, PVC Sch40 ODs, TP ~3.7″, paper towel ~11″, etc.).

**Next:**
- User “Add custom material” (dims + photo).
- Community / import JSON.
- Optional product data partners (Channel3, open filament-style DBs, or affiliate search).
- Never claim live inventory; always “search this” links.

## Implementation phases

### Phase 0 — Foundation (done this session)
- [x] Types + seed catalog + search
- [x] MaterialSearch component
- [x] Geometry helpers + heuristic prompt mapper

### Phase 1 — Wire into workspace (next 1–2 days)
- [ ] Add `forge: ForgeConfig` to DesignJson / project state
- [ ] MaterialSearch in DesignSidebar + floating controls
- [ ] Canvas renderer for stick / tube / board primitives (InstancedMesh)
- [ ] Freehand place / delete / nudge of instances
- [ ] BOM generation from instances (count packs, cut list if canCut)

### Phase 2 — Prompt power
- [ ] Extend `/api/help-me-build` with Forge system prompt
- [ ] LLM returns array of {catalogId, position, rotation, cutLength}
- [ ] Validation: only known catalog IDs, structural sanity checks
- [ ] “Looks like Taj Mahal” style guidance via few-shot + image ref later

### Phase 3 — Packing & feasibility generalization
- [ ] Linear 1D packer for sticks / pipes
- [ ] Simple cylinder stacking / lattice rules
- [ ] Strength / tip-over heuristics for towers
- [ ] Mixed-material support (optional)

### Phase 4 — Polish & launch
- [ ] Beautiful empty states, tip cards, onboarding “build a popsicle tower”
- [ ] Advanced graphics: subtle wood grain, cardboard corrugation, PVC gloss
- [ ] Shareable project links + PDF report with material photos
- [ ] Mobile-friendly MaterialSearch

## Success metrics

- Time from “I want a paper-towel Taj Mahal” → usable BOM < 30 s
- User can switch materials mid-design and regenerate
- Zero “fake” dimensions — every number maps to a real product you can buy or recycle

## Teacher note

This is how you take a focused MVP (closets) and explode the TAM without losing the original excellence. The original sheet nesting and Help Me Build stay the gold standard for cabinetry; Forge makes BuildHq the default tool for *any* DIY builder who thinks in real objects.
