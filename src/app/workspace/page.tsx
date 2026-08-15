"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { createId } from "@/lib/utils";
import type {
  DesignJson,
  Component,
  BuildReport,
  ForgeConfig,
  ForgeInstance,
} from "@/types/project";
import {
  WorkspaceCanvas,
  type CameraPreset,
} from "@/components/workspace/WorkspaceCanvas";
import { DesignSidebar } from "@/components/workspace/DesignSidebar";
import { BuildReportView } from "@/components/workspace/BuildReportView";
import { downloadReportAsPdf } from "@/lib/pdf/buildReportPdf";
import { withUpdatedJoints } from "@/lib/ai/joints";
import { TEMPLATES, type TemplateId } from "@/lib/templates";
import { SpaceFitPanel } from "@/components/space/SpaceFitPanel";
import { CanvasErrorBoundary } from "@/components/workspace/CanvasErrorBoundary";
import { SelectedPieceControls } from "@/components/workspace/SelectedPieceControls";
import { heuristicPromptToDesign } from "@/lib/forge/promptToDesign";
import { getCatalogItem } from "@/lib/forge/catalog";
import { toPrimitive } from "@/lib/forge/geometry";

function makeDefaultDesign(): DesignJson {
  const left = createId("up");
  const right = createId("up");
  const bottom = createId("sh");
  const mid = createId("sh");
  const top = createId("sh");

  // Default: slightly irregular bathroom / linen closet (wonky opening)
  const W = 31.5;
  const H = 78;
  const D = 16;
  const panel = 0.75;
  const inner = W - panel * 2;
  const base: DesignJson = {
    version: 1,
    overall: { width: W, height: H, depth: D },
    components: [
      {
        id: left,
        type: "upright",
        name: "Left upright",
        position: { x: 0, y: 0, z: 0 },
        size: { width: panel, height: H, depth: D },
        material: "plywood_3_4",
      },
      {
        id: right,
        type: "upright",
        name: "Right upright",
        position: { x: W - panel, y: 0, z: 0 },
        size: { width: panel, height: H, depth: D },
        material: "plywood_3_4",
      },
      {
        id: bottom,
        type: "shelf",
        name: "Bottom shelf",
        position: { x: panel, y: 0, z: 0 },
        size: { width: inner, height: panel, depth: D },
        material: "plywood_3_4",
      },
      {
        id: mid,
        type: "shelf",
        name: "Middle shelf",
        position: { x: panel, y: 28, z: 0 },
        size: { width: inner, height: panel, depth: D },
        material: "plywood_3_4",
      },
      {
        id: top,
        type: "shelf",
        name: "Top shelf",
        position: { x: panel, y: 54, z: 0 },
        size: { width: inner, height: panel, depth: D },
        material: "plywood_3_4",
      },
    ],
    fasteners: [],
    forge: {
      primaryMaterialId: null,
      mode: "closet",
      allowMixed: false,
    },
    forgeInstances: [],
    assumptions: {
      load: "medium",
      units: "inches",
      installMode: "wall",
      wallType: "wood_stud",
    },
  };
  return withUpdatedJoints(base);
}

export default function WorkspacePage() {
  const [design, setDesign] = useState<DesignJson>(() => {
    if (typeof window === "undefined") return makeDefaultDesign();
    try {
      const raw = localStorage.getItem("buildhq_design_v1");
      if (raw) {
        const parsed = JSON.parse(raw) as DesignJson;
        if (parsed?.components?.length) return withUpdatedJoints(parsed);
      }
    } catch {
      /* ignore */
    }
    return makeDefaultDesign();
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedForgeId, setSelectedForgeId] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [report, setReport] = useState<BuildReport | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [explode, setExplode] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("iso");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSpaceFit, setShowSpaceFit] = useState(false);
  const [history, setHistory] = useState<DesignJson[]>([]);
  const [future, setFuture] = useState<DesignJson[]>([]);
  const [highlightIds, setHighlightIds] = useState<string[] | null>(null);
  const [showDims, setShowDims] = useState(true);

  const selected = design.components.find((c) => c.id === selectedId) ?? null;

  const commitDesign = useCallback((next: DesignJson) => {
    const updated = withUpdatedJoints(next);
    setHistory((h) => {
      const nextHist = [...h, design].slice(-40);
      return nextHist;
    });
    setFuture([]);
    setDesign(updated);
    try {
      localStorage.setItem("buildhq_design_v1", JSON.stringify(updated));
    } catch {
      /* ignore quota */
    }
  }, [design]);

  function undo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture((f) => [design, ...f].slice(0, 40));
      setDesign(prev);
      try {
        localStorage.setItem("buildhq_design_v1", JSON.stringify(prev));
      } catch {
        /* ignore */
      }
      return h.slice(0, -1);
    });
  }

  function redo() {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      setHistory((h) => [...h, design].slice(-40));
      setDesign(next);
      try {
        localStorage.setItem("buildhq_design_v1", JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return f.slice(1);
    });
  }

  function importDesignJson(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as DesignJson;
        if (!parsed?.components || !parsed?.overall) {
          alert("Invalid BuildHq design file.");
          return;
        }
        commitDesign({
          version: 1,
          overall: parsed.overall,
          components: parsed.components,
          fasteners: parsed.fasteners ?? [],
          assumptions: parsed.assumptions ?? {
            load: "medium",
            units: "inches",
            installMode: "wall",
            wallType: "wood_stud",
          },
          forge: parsed.forge,
          forgeInstances: parsed.forgeInstances ?? [],
        });
        setSelectedId(null);
        setReport(null);
      } catch {
        alert("Could not parse JSON.");
      }
    };
    reader.readAsText(file);
  }

  function addWindowCutout() {
    if (!selected) return;
    if (
      selected.type !== "back" &&
      selected.type !== "door" &&
      selected.type !== "upright" &&
      selected.type !== "divider"
    ) {
      // allow on any large panel
    }
    const margin = 2;
    const w = Math.max(4, selected.size.width - margin * 2);
    const h = Math.max(4, selected.size.height - margin * 2);
    const cutout = {
      id: createId("cut"),
      x: margin,
      y: margin,
      width: Math.min(w, selected.size.width - margin * 2),
      height: Math.min(h, selected.size.height * 0.4),
      label: "Opening",
    };
    updateComponent(selected.id, {
      cutouts: [...(selected.cutouts ?? []), cutout],
      type:
        selected.type === "upright" || selected.type === "divider"
          ? selected.type
          : selected.type === "door"
            ? "door"
            : selected.type,
    });
  }

  function updateComponent(id: string, patch: Partial<Component>) {
    commitDesign({
      ...design,
      components: design.components.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      ),
    });
  }

  function handleMoveComponent(
    id: string,
    position: { x: number; y: number; z: number }
  ) {
    commitDesign({
      ...design,
      components: design.components.map((c) =>
        c.id === id ? { ...c, position } : c
      ),
    });
  }

  function addShelf() {
    const newShelf: Component = {
      id: createId("sh"),
      type: "shelf",
      name: `Shelf ${design.components.filter((c) => c.type === "shelf").length + 1}`,
      position: { x: 0.75, y: 40, z: 0 },
      size: {
        width: design.overall.width - 1.5,
        height: 0.75,
        depth: design.overall.depth,
      },
      material: "plywood_3_4",
    };
    commitDesign({
      ...design,
      components: [...design.components, newShelf],
    });
    setSelectedId(newShelf.id);
  }

  function addGlassShelf() {
    const panel = 0.75;
    const newShelf: Component = {
      id: createId("gl"),
      type: "glass_panel",
      name: `Glass shelf ${design.components.filter((c) => c.type === "glass_panel").length + 1}`,
      position: { x: panel, y: 42, z: 0.5 },
      size: {
        width: design.overall.width - panel * 2,
        height: 0.25,
        depth: design.overall.depth - 1,
      },
      material: "glass_clear_1_4",
    };
    commitDesign({
      ...design,
      components: [...design.components, newShelf],
    });
    setSelectedId(newShelf.id);
  }

  async function handleHelpMeBuild() {
    setIsBuilding(true);
    setReport(null);
    try {
      const res = await fetch("/api/help-me-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ design }),
      });
      if (!res.ok) throw new Error("Build request failed");
      const data = (await res.json()) as BuildReport;
      setReport(data);
    } catch {
      // Client-side fallback so the demo never dies
      const { buildReport } = await import("@/lib/ai/feasibility");
      setReport(buildReport(design));
    } finally {
      setIsBuilding(false);
    }
  }

  function handleDownloadPdf() {
    if (!report) return;
    setIsGeneratingPdf(true);
    try {
      downloadReportAsPdf(report, "Custom Closet");
    } finally {
      setTimeout(() => setIsGeneratingPdf(false), 800);
    }
  }

  function loadTemplate(id: TemplateId) {
    const t = TEMPLATES.find((x) => x.id === id);
    if (!t) return;
    const next = t.build();
    setDesign(next);
    setSelectedId(null);
    setReport(null);
    setShowTemplates(false);
    setCameraPreset("iso");
  }

  function deleteSelected() {
    if (selectedForgeId) {
      commitDesign({
        ...design,
        forgeInstances: (design.forgeInstances ?? []).filter(
          (i) => i.id !== selectedForgeId
        ),
      });
      setSelectedForgeId(null);
      return;
    }
    if (!selectedId) return;
    commitDesign({
      ...design,
      components: design.components.filter((c) => c.id !== selectedId),
    });
    setSelectedId(null);
  }

  function duplicateSelected() {
    if (!selected) return;
    const copy: Component = {
      ...selected,
      id: createId("cp"),
      name: `${selected.name} copy`,
      position: {
        ...selected.position,
        y: selected.position.y + 2,
      },
    };
    commitDesign({
      ...design,
      components: [...design.components, copy],
    });
    setSelectedId(copy.id);
  }

  function addDivider() {
    const panel = 0.75;
    const div: Component = {
      id: createId("dv"),
      type: "divider",
      name: `Divider ${design.components.filter((c) => c.type === "divider").length + 1}`,
      position: {
        x: design.overall.width / 2 - panel / 2,
        y: 0,
        z: 0,
      },
      size: {
        width: panel,
        height: design.overall.height,
        depth: design.overall.depth,
      },
      material: "plywood_3_4",
    };
    commitDesign({
      ...design,
      components: [...design.components, div],
    });
    setSelectedId(div.id);
  }

  function exportDesignJson() {
    const blob = new Blob([JSON.stringify(design, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "buildhq-design.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function clearSaved() {
    try {
      localStorage.removeItem("buildhq_design_v1");
    } catch {
      /* ignore */
    }
    setDesign(makeDefaultDesign());
    setSelectedId(null);
    setReport(null);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      )
        return;
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        (e.key === "y" || (e.key === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        redo();
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (!selectedId) return;
        e.preventDefault();
        commitDesign({
          ...design,
          components: design.components.filter((c) => c.id !== selectedId),
        });
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, design, history, future]);

  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-2 sm:px-4 shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded bg-sky-600 text-white text-xs font-bold flex items-center justify-center">
              BH
            </div>
            <span className="font-semibold text-slate-800 hidden sm:inline">
              BuildHq
            </span>
          </Link>
          <span className="text-slate-300 hidden sm:inline">/</span>
          <span className="text-sm text-slate-600 truncate">Workspace</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
          <div className="relative">
            <button
              onClick={() => setShowTemplates((v) => !v)}
              className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
            >
              Templates
            </button>
            {showTemplates && (
              <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-lg border border-slate-200 bg-white shadow-lg p-1">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => loadTemplate(t.id)}
                    className="w-full text-left px-3 py-2 rounded-md hover:bg-sky-50 text-sm"
                  >
                    <div className="font-medium text-slate-900">{t.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {t.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowSpaceFit(true)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
            title="Measurements → options, windows, framing"
          >
            Space Fit
          </button>
          <button
            onClick={addShelf}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50"
          >
            + Wood
          </button>
          <button
            onClick={addGlassShelf}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md border border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100"
          >
            + Glass
          </button>
          <button
            onClick={addDivider}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 hidden sm:inline-flex"
          >
            + Divider
          </button>
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="text-xs sm:text-sm px-2 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 hidden sm:inline-flex"
            title="Undo (Ctrl/Cmd+Z)"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="text-xs sm:text-sm px-2 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 hidden sm:inline-flex"
            title="Redo"
          >
            Redo
          </button>
          <button
            onClick={exportDesignJson}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 hidden md:inline-flex"
            title="Download design JSON"
          >
            Export
          </button>
          <label className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 hidden md:inline-flex cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importDesignJson(f);
                e.target.value = "";
              }}
            />
          </label>
          <button
            onClick={clearSaved}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 hidden lg:inline-flex"
            title="Reset to default design"
          >
            Reset
          </button>
          <button
            onClick={handleHelpMeBuild}
            disabled={isBuilding}
            className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 rounded-md bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-60"
          >
            {isBuilding ? "…" : "Help Me Build"}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="flex-1 relative min-h-[45vh] md:min-h-0">
          <CanvasErrorBoundary>
            <WorkspaceCanvas
              design={design}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMoveComponent={handleMoveComponent}
              explode={explode}
              cameraPreset={cameraPreset}
              highlightIds={highlightIds}
              selectedForgeId={selectedForgeId}
              onSelectForge={setSelectedForgeId}
              onMoveForge={(id, pos) => {
                commitDesign({
                  ...design,
                  forgeInstances: (design.forgeInstances ?? []).map((inst) =>
                    inst.id === id ? { ...inst, position: pos } : inst
                  ),
                });
              }}
              onPlaceForge={(point) => {
                const materialId = design.forge?.primaryMaterialId;
                if (!materialId || design.forge?.mode !== "freehand") return;
                const item = getCatalogItem(materialId);
                if (!item) return;
                const prim = toPrimitive(item);
                // Sit on ground: center Y at half height for boxes, half length for upright cylinders
                const isCyl =
                  item.formFactor === "tube" ||
                  item.formFactor === "pipe" ||
                  item.formFactor === "dowel";
                const y = isCyl ? prim.length / 2 : prim.height / 2;
                const inst: ForgeInstance = {
                  id: createId("fi"),
                  catalogId: materialId,
                  position: { x: point.x, y, z: point.z },
                  rotation: { x: 0, y: 0, z: 0 },
                };
                const nextInstances = [...(design.forgeInstances ?? []), inst];
                // Expand overall bounds roughly
                const maxY = Math.max(
                  design.overall.height,
                  ...nextInstances.map((i) => i.position.y + (isCyl ? prim.length / 2 : prim.height / 2))
                );
                commitDesign({
                  ...design,
                  forgeInstances: nextInstances,
                  overall: {
                    ...design.overall,
                    height: Math.max(design.overall.height, maxY + 2),
                    width: Math.max(design.overall.width, Math.abs(point.x) * 2 + 12),
                    depth: Math.max(design.overall.depth, Math.abs(point.z) * 2 + 12),
                  },
                });
                setSelectedForgeId(inst.id);
              }}
            />
          </CanvasErrorBoundary>

          {selected && (
            <SelectedPieceControls
              component={selected}
              onChange={(patch) => updateComponent(selected.id, patch)}
              onNudge={(axis, delta) => {
                const pos = { ...selected.position };
                pos[axis] = Math.round((pos[axis] + delta) * 100) / 100;
                updateComponent(selected.id, { position: pos });
              }}
              onClose={() => setSelectedId(null)}
              onDuplicate={duplicateSelected}
              onDelete={deleteSelected}
              onAddOpening={addWindowCutout}
            />
          )}

          <div className="absolute right-3 top-3 flex flex-col gap-1 z-10">
            {(["iso", "front", "side", "top"] as CameraPreset[]).map((p) => (
              <button
                key={p}
                onClick={() => setCameraPreset(p)}
                className={`text-[10px] uppercase px-2 py-1 rounded border shadow-sm ${
                  cameraPreset === p
                    ? "bg-sky-600 text-white border-sky-600"
                    : "bg-white/95 text-slate-700 border-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setExplode((v) => !v)}
              className={`text-[10px] px-2 py-1 rounded border shadow-sm ${
                explode
                  ? "bg-amber-500 text-white border-amber-500"
                  : "bg-white/95 text-slate-700 border-slate-200"
              }`}
            >
              Explode
            </button>
            {selectedId && (
              <>
                <button
                  onClick={duplicateSelected}
                  className="text-[10px] px-2 py-1 rounded border bg-white/95 text-slate-700 border-slate-200 shadow-sm"
                >
                  Duplicate
                </button>
                <button
                  onClick={addWindowCutout}
                  className="text-[10px] px-2 py-1 rounded border bg-white/95 text-slate-700 border-slate-200 shadow-sm"
                  title="Add rectangular opening"
                >
                  + Opening
                </button>
                <button
                  onClick={deleteSelected}
                  className="text-[10px] px-2 py-1 rounded border bg-red-50 text-red-700 border-red-200 shadow-sm"
                >
                  Delete
                </button>
              </>
            )}
          </div>
          <div className="pointer-events-none absolute left-3 top-3 max-w-xs rounded-lg border border-sky-200 bg-white/95 px-3 py-2 text-xs text-slate-700 shadow-sm">
            <p className="font-medium text-sky-800">How to use</p>
            <ul className="mt-1 space-y-0.5 text-slate-600">
              <li>• Click a piece to select</li>
              <li>• Drag shelves up/down · uprights left/right</li>
              <li>• Screws appear where parts meet</li>
              <li>• Then hit <strong>Help Me Build</strong></li>
            </ul>
          </div>
          <div className="absolute bottom-3 left-3 rounded-md bg-slate-900/70 px-2 py-1 text-[11px] text-white">
            {design.fasteners?.length ?? 0} joints · {design.components.length} parts
          </div>
        </div>
        <DesignSidebar
          design={design}
          selected={selected}
          onUpdateOverall={(overall) =>
            commitDesign({ ...design, overall })
          }
          onUpdateComponent={updateComponent}
          onSelect={setSelectedId}
          onUpdateLoad={(load) =>
            commitDesign({
              ...design,
              assumptions: {
                ...design.assumptions,
                load,
                units: "inches",
                installMode: design.assumptions?.installMode ?? "wall",
                wallType: design.assumptions?.wallType ?? "wood_stud",
              },
            })
          }
          onUpdateInstall={(patch) =>
            commitDesign({
              ...design,
              assumptions: {
                load: design.assumptions?.load ?? "medium",
                units: "inches",
                installMode: design.assumptions?.installMode ?? "wall",
                wallType: design.assumptions?.wallType ?? "wood_stud",
                ...patch,
                windowRoughOpening: design.assumptions?.windowRoughOpening,
              },
            })
          }
          onDeleteSelected={deleteSelected}
          onDuplicateSelected={duplicateSelected}
          onUpdateForge={(patch) => {
            const nextForge: ForgeConfig = {
              primaryMaterialId: design.forge?.primaryMaterialId ?? null,
              mode: design.forge?.mode ?? "closet",
              allowMixed: design.forge?.allowMixed ?? false,
              lastPrompt: design.forge?.lastPrompt,
              ...patch,
            };
            commitDesign({
              ...design,
              forge: nextForge,
              forgeInstances: design.forgeInstances ?? [],
            });
          }}
          onForgePrompt={(prompt) => {
            const materialId = design.forge?.primaryMaterialId;
            if (!materialId) return;
            const result = heuristicPromptToDesign(prompt, materialId);
            if (!result) {
              alert("Could not generate from that prompt. Try a different description.");
              return;
            }
            const instances: ForgeInstance[] = result.instances.map((inst) => ({
              id: createId("fi"),
              catalogId: inst.catalogId,
              position: {
                x: inst.position[0],
                y: inst.position[1],
                z: inst.position[2],
              },
              rotation: {
                x: inst.rotation[0],
                y: inst.rotation[1],
                z: inst.rotation[2],
              },
              cutLength: inst.cutLength,
            }));
            commitDesign({
              ...design,
              overall: result.overall,
              forge: {
                primaryMaterialId: materialId,
                mode: "prompt",
                allowMixed: design.forge?.allowMixed ?? false,
                lastPrompt: prompt,
              },
              forgeInstances: instances,
            });
            setSelectedForgeId(null);
            setReport(null);
          }}
          onClearForgeInstances={() => {
            commitDesign({
              ...design,
              forgeInstances: [],
            });
            setSelectedForgeId(null);
          }}
          selectedForgeId={selectedForgeId}
          onSelectForge={setSelectedForgeId}
        />
      </div>

      {report && (
        <BuildReportView
          report={report}
          onClose={() => {
            setReport(null);
            setHighlightIds(null);
          }}
          onDownloadPdf={handleDownloadPdf}
          isGeneratingPdf={isGeneratingPdf}
          onHighlightParts={setHighlightIds}
        />
      )}

      {showSpaceFit && (
        <SpaceFitPanel
          onClose={() => setShowSpaceFit(false)}
          onApplyWindowJob={(job) => {
            commitDesign({
              ...design,
              assumptions: {
                load: design.assumptions?.load ?? "medium",
                units: "inches",
                installMode: design.assumptions?.installMode ?? "wall",
                wallType: design.assumptions?.wallType ?? "wood_stud",
                windowRoughOpening: {
                  widthIn: job.roWidthIn,
                  heightIn: job.roHeightIn,
                  unitWidthIn: job.unitWidthIn,
                  unitHeightIn: job.unitHeightIn,
                },
              },
            });
            setShowSpaceFit(false);
            alert(
              "Window job saved on this project. Run Help Me Build to get the full framing + install materials list."
            );
          }}
        />
      )}
    </div>
  );
}
