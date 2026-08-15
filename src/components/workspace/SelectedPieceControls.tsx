"use client";

import type { Component } from "@/types/project";

interface Props {
  component: Component;
  onChange: (patch: Partial<Component>) => void;
  onNudge: (axis: "x" | "y" | "z", delta: number) => void;
  onClose: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onAddOpening?: () => void;
}

/** Floating controls so you can size/move a selected piece without the sidebar */
export function SelectedPieceControls({
  component,
  onChange,
  onNudge,
  onClose,
  onDuplicate,
  onDelete,
  onAddOpening,
}: Props) {
  const step = 0.25;

  function setSize(key: "width" | "height" | "depth", value: number) {
    if (!Number.isFinite(value) || value <= 0) return;
    onChange({
      size: { ...component.size, [key]: Math.round(value * 100) / 100 },
    });
  }

  return (
    <div className="absolute left-3 bottom-14 z-30 w-[min(100%-1.5rem,320px)] rounded-xl border border-slate-200 bg-white/95 shadow-lg backdrop-blur p-3 text-xs">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">
            {component.name}
          </div>
          <div className="text-slate-500 capitalize">{component.type}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 px-1"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-2">
        {(["width", "height", "depth"] as const).map((key) => (
          <label key={key} className="block">
            <span className="text-slate-500 capitalize">{key}</span>
            <input
              type="number"
              step={step}
              min={0.25}
              value={component.size[key]}
              onChange={(e) => setSize(key, parseFloat(e.target.value))}
              className="mt-0.5 w-full rounded border border-slate-300 px-1.5 py-1"
            />
          </label>
        ))}
      </div>

      <div className="mb-2">
        <div className="text-slate-500 mb-1">Nudge position (¼″)</div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            className="px-2 py-1 rounded border bg-slate-50 hover:bg-slate-100"
            onClick={() => onNudge("y", step)}
          >
            ↑ Up
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border bg-slate-50 hover:bg-slate-100"
            onClick={() => onNudge("y", -step)}
          >
            ↓ Down
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border bg-slate-50 hover:bg-slate-100"
            onClick={() => onNudge("x", -step)}
          >
            ← Left
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border bg-slate-50 hover:bg-slate-100"
            onClick={() => onNudge("x", step)}
          >
            Right →
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border bg-slate-50 hover:bg-slate-100"
            onClick={() => onNudge("z", step)}
          >
            Depth +
          </button>
          <button
            type="button"
            className="px-2 py-1 rounded border bg-slate-50 hover:bg-slate-100"
            onClick={() => onNudge("z", -step)}
          >
            Depth −
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {onDuplicate && (
          <button
            type="button"
            onClick={onDuplicate}
            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
          >
            Duplicate
          </button>
        )}
        {onAddOpening && (
          <button
            type="button"
            onClick={onAddOpening}
            className="px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
          >
            + Opening
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
