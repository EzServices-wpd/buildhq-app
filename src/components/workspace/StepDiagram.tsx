"use client";

import type { DiagramKind } from "@/types/project";

/** Simple SVG diagrams for assembly instruction steps */
export function StepDiagram({ kind }: { kind?: DiagramKind }) {
  const k = kind ?? "generic";

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 w-full max-w-[220px]">
      <svg viewBox="0 0 120 80" className="w-full h-auto" aria-hidden>
        {k === "uprights" && <UprightsDiagram />}
        {k === "shelf" && <ShelfDiagram />}
        {k === "fasteners" && <FastenersDiagram />}
        {k === "glass" && <GlassDiagram />}
        {k === "door" && <DoorDiagram />}
        {k === "layout" && <LayoutDiagram />}
        {k === "finish" && <FinishDiagram />}
        {(k === "generic" || !k) && <LayoutDiagram />}
      </svg>
    </div>
  );
}

function UprightsDiagram() {
  return (
    <>
      <rect x="18" y="10" width="10" height="60" rx="1" fill="#d4a574" stroke="#8b6914" />
      <rect x="92" y="10" width="10" height="60" rx="1" fill="#d4a574" stroke="#8b6914" />
      <text x="60" y="42" textAnchor="middle" fontSize="8" fill="#64748b">
        uprights
      </text>
    </>
  );
}

function ShelfDiagram() {
  return (
    <>
      <rect x="18" y="12" width="8" height="56" rx="1" fill="#c4a574" />
      <rect x="94" y="12" width="8" height="56" rx="1" fill="#c4a574" />
      <rect x="26" y="22" width="68" height="6" rx="1" fill="#e0b887" stroke="#0369a1" strokeWidth="1.5" />
      <rect x="26" y="48" width="68" height="6" rx="1" fill="#e0b887" />
      <text x="60" y="76" textAnchor="middle" fontSize="7" fill="#0369a1">
        seat shelf · level
      </text>
    </>
  );
}

function FastenersDiagram() {
  return (
    <>
      <rect x="20" y="20" width="12" height="45" rx="1" fill="#d4a574" />
      <rect x="32" y="35" width="55" height="8" rx="1" fill="#e0b887" />
      <circle cx="32" cy="39" r="3" fill="#0ea5e9" />
      <circle cx="32" cy="28" r="3" fill="#0ea5e9" />
      <circle cx="32" cy="50" r="3" fill="#0ea5e9" />
      <text x="70" y="22" fontSize="7" fill="#0369a1">
        screws @ joint
      </text>
    </>
  );
}

function GlassDiagram() {
  return (
    <>
      <rect x="22" y="12" width="8" height="56" rx="1" fill="#c4a574" />
      <rect x="90" y="12" width="8" height="56" rx="1" fill="#c4a574" />
      <rect
        x="30"
        y="24"
        width="60"
        height="40"
        rx="2"
        fill="#a8d4e8"
        fillOpacity="0.45"
        stroke="#0284c7"
        strokeWidth="1.2"
      />
      <text x="60" y="48" textAnchor="middle" fontSize="7" fill="#0369a1">
        glass / acrylic
      </text>
    </>
  );
}

function DoorDiagram() {
  return (
    <>
      <rect x="30" y="10" width="60" height="60" rx="2" fill="#e8d5a3" stroke="#8b6914" />
      <circle cx="78" cy="40" r="3" fill="#64748b" />
      <line x1="30" y1="10" x2="30" y2="70" stroke="#475569" strokeWidth="2" />
      <text x="60" y="78" textAnchor="middle" fontSize="7" fill="#64748b">
        door + hinge side
      </text>
    </>
  );
}

function LayoutDiagram() {
  return (
    <>
      <rect x="25" y="15" width="70" height="50" rx="2" fill="none" stroke="#94a3b8" strokeDasharray="3 2" />
      <rect x="30" y="20" width="8" height="40" fill="#d4a574" />
      <rect x="82" y="20" width="8" height="40" fill="#d4a574" />
      <rect x="38" y="52" width="44" height="5" fill="#e0b887" />
      <text x="60" y="12" textAnchor="middle" fontSize="7" fill="#64748b">
        dry-fit layout
      </text>
    </>
  );
}

function FinishDiagram() {
  return (
    <>
      <rect x="30" y="15" width="60" height="45" rx="2" fill="#d4a574" />
      <path d="M40 50 Q55 25 80 40" fill="none" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
      <text x="60" y="72" textAnchor="middle" fontSize="7" fill="#64748b">
        sand · finish
      </text>
    </>
  );
}
