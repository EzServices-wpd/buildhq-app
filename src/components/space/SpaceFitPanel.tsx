"use client";

import { useMemo, useState } from "react";
import {
  suggestWindowsForRoughOpening,
  estimateWindowFraming,
  FRAMING_GLOSSARY,
  type ClearanceMode,
} from "@/lib/knowledge/framing";
import {
  suggestForSpace,
  type SpaceMeasurement,
} from "@/lib/knowledge/spaceFit";
import {
  CONTRACTING_BASICS,
  MATERIAL_HANDLING_TIPS,
} from "@/lib/knowledge/materials";

type Tab = "space" | "window" | "framing" | "materials" | "contracting";

export function SpaceFitPanel({
  onClose,
  onApplyWindowJob,
}: {
  onClose: () => void;
  onApplyWindowJob?: (job: {
    roWidthIn: number;
    roHeightIn: number;
    unitWidthIn: number;
    unitHeightIn: number;
  }) => void;
}) {
  const [tab, setTab] = useState<Tab>("space");
  const [w, setW] = useState(36);
  const [h, setH] = useState(48);
  const [d, setD] = useState(16);
  const [mode, setMode] = useState<ClearanceMode>("manufacturer_half");
  const [bearing, setBearing] = useState(true);

  const space: SpaceMeasurement = {
    widthIn: w,
    heightIn: h,
    depthIn: d,
  };

  const spaceOptions = useMemo(() => suggestForSpace(space), [w, h, d]);
  const windowFits = useMemo(
    () => suggestWindowsForRoughOpening({ roWidthIn: w, roHeightIn: h }, mode),
    [w, h, mode]
  );
  const framing = useMemo(
    () =>
      estimateWindowFraming(w, bearing ? "bearing_roof" : "non_bearing"),
    [w, bearing]
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "space", label: "Space → ideas" },
    { id: "window", label: "Window fit" },
    { id: "framing", label: "Framing" },
    { id: "materials", label: "Materials" },
    { id: "contracting", label: "Basics" },
  ];

  return (
    <div className="absolute inset-x-0 bottom-0 max-h-[70%] bg-white border-t border-slate-200 shadow-2xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div>
          <h2 className="font-semibold text-slate-900">Space Fit & Knowledge</h2>
          <p className="text-xs text-slate-500">
            Enter measurements → options, window matches, framing checklist
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm px-3 py-1 rounded border border-slate-300 hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="flex gap-1 px-4 pt-2 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-xs px-3 py-1.5 rounded-full border shrink-0 ${
              tab === t.id
                ? "bg-sky-600 text-white border-sky-600"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-100">
        <label className="text-xs">
          <span className="text-slate-500">Width (in)</span>
          <input
            type="number"
            className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={w}
            min={1}
            step={0.25}
            onChange={(e) => setW(Number(e.target.value))}
          />
        </label>
        <label className="text-xs">
          <span className="text-slate-500">Height (in)</span>
          <input
            type="number"
            className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={h}
            min={1}
            step={0.25}
            onChange={(e) => setH(Number(e.target.value))}
          />
        </label>
        <label className="text-xs">
          <span className="text-slate-500">Depth (in) — optional</span>
          <input
            type="number"
            className="mt-0.5 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            value={d}
            min={0}
            step={0.25}
            onChange={(e) => setD(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-4 text-sm space-y-3">
        {tab === "space" && (
          <>
            <p className="text-xs text-slate-500">
              What you might put in a {w}&quot; × {h}&quot; × {d}&quot; space:
            </p>
            {spaceOptions.map((o) => (
              <div
                key={o.id}
                className="rounded-lg border border-slate-200 p-3 bg-slate-50/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{o.title}</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-500">
                    {o.confidence}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">{o.summary}</p>
                <ul className="mt-2 text-xs text-slate-600 list-disc pl-4 space-y-0.5">
                  {o.nextSteps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        )}

        {tab === "window" && (
          <>
            <div className="flex flex-wrap gap-3 items-center text-xs">
              <span className="text-slate-500">Clearance model:</span>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={mode === "manufacturer_half"}
                  onChange={() => setMode("manufacturer_half")}
                />
                +½&quot; W/H (common vinyl/fiberglass)
              </label>
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  checked={mode === "flange_generous"}
                  onChange={() => setMode("flange_generous")}
                />
                +2&quot; / +2.5&quot; (generous / some flange installs)
              </label>
            </div>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded p-2">
              Always confirm the exact rough opening on the manufacturer&apos;s
              install sheet. These are planning matches only.
            </p>
            {windowFits.length === 0 && (
              <p className="text-slate-600">
                No standard catalog sizes fit under this clearance model. Check
                measurements or consider a custom unit.
              </p>
            )}
            {windowFits.map((s) => (
              <div
                key={s.nominalCode + s.unitWidthIn}
                className="rounded-lg border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <div className="font-medium">
                    {s.unitWidthIn}&quot; × {s.unitHeightIn}&quot; unit
                    <span className="text-slate-400 text-xs ml-2">
                      ({s.nominalCode})
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Expected RO ≈ {s.expectedRoWidthIn}&quot; ×{" "}
                    {s.expectedRoHeightIn}&quot;
                  </div>
                  <div className="text-xs text-slate-600 mt-1">{s.notes}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      s.fit === "good"
                        ? "bg-emerald-100 text-emerald-800"
                        : s.fit === "tight"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {s.fit}
                  </span>
                  {onApplyWindowJob && (
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded bg-sky-600 text-white hover:bg-sky-700"
                      onClick={() =>
                        onApplyWindowJob({
                          roWidthIn: w,
                          roHeightIn: h,
                          unitWidthIn: s.unitWidthIn,
                          unitHeightIn: s.unitHeightIn,
                        })
                      }
                    >
                      Use in BOM
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {tab === "framing" && (
          <>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={bearing}
                onChange={(e) => setBearing(e.target.checked)}
              />
              Treat as exterior / bearing wall (more conservative header)
            </label>
            <div className="rounded-lg border border-slate-200 p-3 space-y-1 text-xs">
              <div>
                <strong>Kings:</strong> {framing.kingStuds} ·{" "}
                <strong>Jacks:</strong> {framing.jackStuds}
              </div>
              <div>
                <strong>Header (heuristic):</strong> {framing.headerDescription}
              </div>
              <div>
                <strong>Sill:</strong> {framing.sill}
              </div>
              <div>
                <strong>Cripples:</strong> {framing.cripplesNote}
              </div>
            </div>
            <h3 className="font-medium text-slate-900">Framing sequence</h3>
            <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-700">
              {framing.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            {framing.warnings.map((w) => (
              <p
                key={w}
                className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded p-2"
              >
                {w}
              </p>
            ))}
            <h3 className="font-medium text-slate-900 pt-2">Glossary</h3>
            <ul className="space-y-1 text-xs">
              {FRAMING_GLOSSARY.map((g) => (
                <li key={g.term}>
                  <strong>{g.term}:</strong> {g.def}
                </li>
              ))}
            </ul>
          </>
        )}

        {tab === "materials" && (
          <ul className="space-y-2">
            {MATERIAL_HANDLING_TIPS.map((t) => (
              <li
                key={t.id}
                className="rounded-lg border border-slate-200 p-3 text-xs"
              >
                <div className="font-medium text-slate-900">{t.title}</div>
                <div className="text-slate-600 mt-0.5">{t.body}</div>
                <div className="text-[10px] uppercase text-slate-400 mt-1">
                  {t.category}
                </div>
              </li>
            ))}
          </ul>
        )}

        {tab === "contracting" && (
          <div className="space-y-3">
            {CONTRACTING_BASICS.map((c) => (
              <div key={c.title} className="rounded-lg border border-slate-200 p-3">
                <div className="font-medium text-slate-900">{c.title}</div>
                <ul className="mt-1 list-disc pl-4 text-xs text-slate-600 space-y-0.5">
                  {c.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="text-[11px] text-slate-400">
              BuildHq is a planning and DIY design tool — not licensed
              engineering, architecture, or code enforcement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
