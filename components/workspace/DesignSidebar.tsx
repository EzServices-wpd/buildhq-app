"use client";

import { useState } from "react";
import type {
  Component,
  DesignJson,
  Dimensions,
  MaterialType,
  ForgeConfig,
} from "@/types/project";
import { MATERIAL_INFO, MATERIAL_CATEGORIES } from "@/types/project";
import { MaterialSearch } from "@/components/forge/MaterialSearch";
import { getCatalogItem } from "@/lib/forge/catalog";
import { forgeBomSummary, buildForgeBom } from "@/lib/forge/bom";
import { DREAM_EXAMPLES } from "@/lib/forge/promptToDesign";

interface Props {
  design: DesignJson;
  selected: Component | null;
  onUpdateOverall: (d: Dimensions) => void;
  onUpdateComponent: (id: string, patch: Partial<Component>) => void;
  onSelect: (id: string | null) => void;
  onUpdateLoad?: (load: "light" | "medium" | "heavy") => void;
  onUpdateInstall?: (
    patch: Partial<{
      installMode: "wall" | "freestanding" | "alcove";
      wallType: "wood_stud" | "drywall_only" | "masonry" | "concrete";
    }>
  ) => void;
  onDeleteSelected?: () => void;
  onDuplicateSelected?: () => void;
  /** Forge */
  onUpdateForge?: (patch: Partial<ForgeConfig>) => void;
  onForgePrompt?: (prompt: string) => void;
  onClearForgeInstances?: () => void;
  selectedForgeId?: string | null;
  onSelectForge?: (id: string | null) => void;
}

export function DesignSidebar({
  design,
  selected,
  onUpdateOverall,
  onUpdateComponent,
  onSelect,
  onUpdateLoad,
  onUpdateInstall,
  onDeleteSelected,
  onDuplicateSelected,
  onUpdateForge,
  onForgePrompt,
  onClearForgeInstances,
  selectedForgeId,
  onSelectForge,
}: Props) {
  const forge = design.forge ?? {
    primaryMaterialId: null,
    mode: "closet" as const,
    allowMixed: false,
  };
  const isForge = forge.mode === "freehand" || forge.mode === "prompt";
  const instances = design.forgeInstances ?? [];
  const bom = buildForgeBom(instances, forge.primaryMaterialId);
  const primaryItem = forge.primaryMaterialId
    ? getCatalogItem(forge.primaryMaterialId)
    : null;

  return (
    <aside className="w-full md:w-80 max-h-[50vh] md:max-h-none bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shrink-0 overflow-hidden">
      {/* Mode + Material Universe */}
      <div className="p-4 border-b border-slate-100 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-slate-900">Project</h2>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-[11px] font-medium">
            <button
              type="button"
              onClick={() => onUpdateForge?.({ mode: "closet" })}
              className={`px-2.5 py-1 ${
                forge.mode === "closet"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Closet
            </button>
            <button
              type="button"
              onClick={() => onUpdateForge?.({ mode: "freehand" })}
              className={`px-2.5 py-1 border-l border-slate-200 ${
                forge.mode === "freehand"
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Forge
            </button>
            <button
              type="button"
              onClick={() => onUpdateForge?.({ mode: "prompt" })}
              className={`px-2.5 py-1 border-l border-slate-200 ${
                forge.mode === "prompt"
                  ? "bg-violet-600 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Prompt
            </button>
          </div>
        </div>

        {/* Material Universe picker — always visible so users discover it */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Material Universe
          </label>
          <MaterialSearch
            value={forge.primaryMaterialId}
            onChange={(id) => onUpdateForge?.({ primaryMaterialId: id })}
            placeholder="Search: popsicle, PVC, paper towel…"
          />
          {primaryItem && (
            <p className="mt-1.5 text-[10px] text-slate-500 leading-snug">
              {primaryItem.formFactor} ·{" "}
              {primaryItem.dims.length
                ? `${primaryItem.dims.length}"`
                : ""}
              {primaryItem.dims.diameter
                ? ` ⌀${primaryItem.dims.diameter}"`
                : primaryItem.dims.width
                  ? ` × ${primaryItem.dims.width}"`
                  : ""}
              {primaryItem.canCut ? " · can cut" : ""}
            </p>
          )}
        </div>

        {isForge && (
          <div className="rounded-lg bg-indigo-50/80 border border-indigo-100 px-3 py-2">
            <p className="text-[11px] text-indigo-800 font-medium">
              {forgeBomSummary(bom)}
            </p>
            {instances.length > 0 && onClearForgeInstances && (
              <button
                type="button"
                onClick={onClearForgeInstances}
                className="mt-1 text-[10px] text-indigo-600 hover:underline"
              >
                Clear all pieces
              </button>
            )}
          </div>
        )}

        {forge.mode === "prompt" && (
          <ForgePromptBox
            lastPrompt={forge.lastPrompt}
            disabled={!forge.primaryMaterialId}
            onSubmit={(p) => onForgePrompt?.(p)}
          />
        )}
      </div>

      {/* Closet overall dims — only when in closet mode */}
      {!isForge && (
        <div className="p-4 border-b border-slate-100">
          <p className="text-xs text-slate-500 mt-0.5">Overall dimensions (inches)</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {(["width", "height", "depth"] as const).map((key) => (
              <label key={key} className="text-xs">
                <span className="text-slate-500 capitalize">{key}</span>
                <input
                  type="number"
                  value={design.overall[key]}
                  onChange={(e) =>
                    onUpdateOverall({
                      ...design.overall,
                      [key]: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  min={1}
                  step={0.25}
                />
              </label>
            ))}
          </div>
          <label className="block text-xs text-slate-500 mt-3 mb-1">Expected load</label>
          <select
            value={design.assumptions?.load ?? "medium"}
            onChange={(e) =>
              onUpdateLoad?.(e.target.value as "light" | "medium" | "heavy")
            }
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="light">Light (linens / decor)</option>
            <option value="medium">Medium (everyday storage)</option>
            <option value="heavy">Heavy (books / tools)</option>
          </select>

          <label className="block text-xs text-slate-500 mt-3 mb-1">
            Installed against
          </label>
          <select
            value={design.assumptions?.installMode ?? "wall"}
            onChange={(e) =>
              onUpdateInstall?.({
                installMode: e.target.value as "wall" | "freestanding" | "alcove",
              })
            }
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="wall">Wall-mounted (anchors into structure)</option>
            <option value="alcove">Alcove / between walls</option>
            <option value="freestanding">Freestanding (feet + anti-tip)</option>
          </select>

          {(design.assumptions?.installMode ?? "wall") !== "freestanding" && (
            <>
              <label className="block text-xs text-slate-500 mt-3 mb-1">
                Wall type
              </label>
              <select
                value={design.assumptions?.wallType ?? "wood_stud"}
                onChange={(e) =>
                  onUpdateInstall?.({
                    wallType: e.target.value as
                      | "wood_stud"
                      | "drywall_only"
                      | "masonry"
                      | "concrete",
                  })
                }
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
              >
                <option value="wood_stud">Wood studs (preferred)</option>
                <option value="drywall_only">Drywall only (hollow)</option>
                <option value="masonry">Masonry / brick</option>
                <option value="concrete">Concrete</option>
              </select>
            </>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Forge instances list */}
        {isForge && (
          <div className="p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Pieces ({instances.length})
            </h3>
            {instances.length === 0 ? (
              <p className="text-xs text-slate-400 leading-relaxed">
                {forge.mode === "prompt"
                  ? "Type a prompt above (e.g. “3 foot Eiffel Tower from popsicle sticks”)."
                  : "Select a material, then click the ground on the canvas to place pieces. Drag to move · Shift+drag for height · Delete key removes."}
              </p>
            ) : (
              <>
                {selectedForgeId && onDeleteSelected && (
                  <button
                    type="button"
                    onClick={onDeleteSelected}
                    className="mb-2 text-xs px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                  >
                    Delete selected piece
                  </button>
                )}
                <ul className="space-y-1">
                  {instances.map((inst) => {
                    const item = getCatalogItem(inst.catalogId);
                    return (
                      <li key={inst.id}>
                        <button
                          type="button"
                          onClick={() => onSelectForge?.(inst.id)}
                          className={`w-full text-left px-2.5 py-1.5 rounded text-sm truncate flex items-center gap-2 ${
                            selectedForgeId === inst.id
                              ? "bg-indigo-50 text-indigo-900 font-medium"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-sm shrink-0 border border-black/10"
                            style={{ background: item?.color ?? "#ccc" }}
                          />
                          <span className="truncate">
                            {item?.name ?? inst.catalogId}
                            {inst.cutLength != null && (
                              <span className="text-slate-400 ml-1">
                                ({inst.cutLength}")
                              </span>
                            )}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* Mini BOM */}
            {bom.lines.length > 0 && bom.totalPieces > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <h4 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  BOM
                </h4>
                <ul className="space-y-2">
                  {bom.lines.map((line) => (
                    <li key={line.catalogId} className="text-xs">
                      <div className="font-medium text-slate-800">
                        {line.name}
                      </div>
                      <div className="text-slate-500">
                        {line.quantityPieces} pcs
                        {line.packsNeeded > 0 &&
                          ` · ${line.packsNeeded} pack(s) of ${line.unitsPerPack}`}
                        {line.estCostUsd != null &&
                          line.estCostUsd > 0 &&
                          ` · ~$${line.estCostUsd.toFixed(2)}`}
                      </div>
                      {line.searchQuery && (
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(line.searchQuery)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline text-[10px]"
                        >
                          Find online →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Closet components list */}
        {!isForge && (
          <div className="p-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Components ({design.components.length})
            </h3>
            <ul className="space-y-1">
              {design.components.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => onSelect(c.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-sm truncate ${
                      selected?.id === c.id
                        ? "bg-brand-50 text-brand-800 font-medium"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    {c.name}
                    <span className="text-xs text-slate-400 ml-1">({c.type})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!isForge && selected && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="font-medium text-slate-900 truncate">
                {selected.name}
              </h3>
              <span
                className="w-4 h-4 rounded-sm border border-slate-300 shrink-0"
                style={{
                  background: MATERIAL_INFO[selected.material]?.color ?? "#ccc",
                }}
                title={MATERIAL_INFO[selected.material]?.label}
              />
            </div>
            <div className="flex gap-2 mb-3">
              {onDuplicateSelected && (
                <button
                  type="button"
                  onClick={onDuplicateSelected}
                  className="text-xs px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-50"
                >
                  Duplicate
                </button>
              )}
              {onDeleteSelected && (
                <button
                  type="button"
                  onClick={onDeleteSelected}
                  className="text-xs px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                >
                  Delete
                </button>
              )}
            </div>

            <label className="block text-xs text-slate-500 mb-1">Name</label>
            <input
              value={selected.name}
              onChange={(e) =>
                onUpdateComponent(selected.id, { name: e.target.value })
              }
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm mb-3"
            />

            <label className="block text-xs text-slate-500 mb-1">Material</label>
            <select
              value={selected.material}
              onChange={(e) =>
                onUpdateComponent(selected.id, {
                  material: e.target.value as MaterialType,
                })
              }
              className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm mb-1"
            >
              {MATERIAL_CATEGORIES.map((cat) => (
                <optgroup key={cat.id} label={cat.label}>
                  {(Object.keys(MATERIAL_INFO) as MaterialType[])
                    .filter((k) => MATERIAL_INFO[k].category === cat.id)
                    .map((key) => (
                      <option key={key} value={key}>
                        {MATERIAL_INFO[key].label}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mb-3">
              {MATERIAL_INFO[selected.material]?.description}
              {MATERIAL_INFO[selected.material]?.category === "glass" &&
                " · Renders translucent in 3D"}
              {MATERIAL_INFO[selected.material]?.category === "metal" &&
                " · Metallic finish in 3D"}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {(["width", "height", "depth"] as const).map((key) => (
                <label key={key} className="text-xs">
                  <span className="text-slate-500 capitalize">{key}</span>
                  <input
                    type="number"
                    value={selected.size[key]}
                    onChange={(e) =>
                      onUpdateComponent(selected.id, {
                        size: {
                          ...selected.size,
                          [key]: parseFloat(e.target.value) || 0.1,
                        },
                      })
                    }
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    min={0.1}
                    step={0.25}
                  />
                </label>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {(["x", "y", "z"] as const).map((key) => (
                <label key={key} className="text-xs">
                  <span className="text-slate-500">Pos {key.toUpperCase()}</span>
                  <input
                    type="number"
                    value={selected.position[key]}
                    onChange={(e) =>
                      onUpdateComponent(selected.id, {
                        position: {
                          ...selected.position,
                          [key]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1 text-sm"
                    step={0.25}
                  />
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function ForgePromptBox({
  lastPrompt,
  disabled,
  onSubmit,
}: {
  lastPrompt?: string;
  disabled?: boolean;
  onSubmit: (prompt: string) => void;
}) {
  const [text, setText] = useState(lastPrompt ?? "");

  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-medium text-slate-500">
        Describe what to build
      </label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='e.g. "3 foot Eiffel Tower from popsicle sticks"'
        rows={2}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm resize-none outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-100 disabled:opacity-50"
      />
      <button
        type="button"
        disabled={disabled || !text.trim()}
        onClick={() => onSubmit(text.trim())}
        className="w-full rounded-lg bg-violet-600 text-white text-sm font-medium py-2 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Generate structure
      </button>
      {disabled && (
        <p className="text-[10px] text-amber-600">Select a material first</p>
      )}
      {!disabled && (
        <div className="pt-1">
          <p className="text-[10px] text-slate-400 mb-1">Try a dream:</p>
          <div className="flex flex-wrap gap-1">
            {DREAM_EXAMPLES.slice(0, 4).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setText(ex);
                  onSubmit(ex);
                }}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100 text-left"
              >
                {ex.length > 36 ? ex.slice(0, 34) + "…" : ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
