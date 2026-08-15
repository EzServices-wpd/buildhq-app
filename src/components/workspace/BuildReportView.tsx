"use client";

import type { BuildReport } from "@/types/project";
import { MATERIAL_INFO } from "@/types/project";
import { StepDiagram } from "@/components/workspace/StepDiagram";
import { estimateBomCost } from "@/lib/pricing";

interface Props {
  report: BuildReport;
  onClose: () => void;
  onDownloadPdf?: () => void;
  isGeneratingPdf?: boolean;
  onHighlightParts?: (ids: string[] | null) => void;
}

export function BuildReportView({
  report,
  onClose,
  onDownloadPdf,
  isGeneratingPdf,
  onHighlightParts,
}: Props) {
  const cost = estimateBomCost(report.bom);
  const statusColor =
    report.feasibility.status === "ok"
      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
      : report.feasibility.status === "warnings"
        ? "bg-amber-50 text-amber-800 border-amber-200"
        : "bg-red-50 text-red-800 border-red-200";

  return (
    <div className="absolute inset-x-0 bottom-0 max-h-[55%] bg-white border-t border-slate-200 shadow-2xl z-40 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-slate-50 shrink-0">
        <h3 className="font-semibold text-sm text-slate-900">
          Help Me Build Report
        </h3>
        <div className="flex items-center gap-2">
          {onDownloadPdf && (
            <button
              onClick={onDownloadPdf}
              disabled={isGeneratingPdf}
              className="text-xs px-3 py-1.5 rounded-md bg-sky-600 text-white font-medium hover:bg-sky-700 disabled:opacity-60"
            >
              {isGeneratingPdf ? "Generating PDF…" : "Download PDF"}
            </button>
          )}
          <button
            onClick={onClose}
            className="text-sm text-slate-500 hover:text-slate-800 px-2"
          >
            Close
          </button>
        </div>
      </div>

      <div className="overflow-y-auto p-4 space-y-5 text-sm">
        {/* Feasibility */}
        <section>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusColor}`}
          >
            {report.feasibility.status === "ok" && "✓ Looks good"}
            {report.feasibility.status === "warnings" && "⚠ Recommendations"}
            {report.feasibility.status === "critical" && "✕ Critical issues"}
          </div>
          <p className="mt-2 text-slate-700">{report.feasibility.summary}</p>
          {report.feasibility.issues.length > 0 && (
            <ul className="mt-3 space-y-2">
              {report.feasibility.issues.map((issue, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="font-medium text-slate-900">
                    {issue.severity === "critical" ? "Critical" : "Warning"}:{" "}
                    {issue.message}
                  </div>
                  {issue.suggestion && (
                    <div className="mt-1 text-slate-600 text-xs">
                      → {issue.suggestion}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Optimized sheet layouts */}
        {report.sheets && report.sheets.length > 0 && (
          <section>
            <h4 className="font-semibold text-slate-900 mb-2">
              Cut Sheets{" "}
              {report.nestSummary && (
                <span className="font-normal text-slate-500 text-xs">
                  · {report.nestSummary.totalSheets} sheet
                  {report.nestSummary.totalSheets === 1 ? "" : "s"} ·{" "}
                  {(report.nestSummary.averageUtilization * 100).toFixed(0)}% avg
                  use
                </span>
              )}
            </h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {report.sheets.map((sheet) => {
                const scale = 180 / Math.max(sheet.width, sheet.height);
                return (
                  <div
                    key={sheet.index}
                    className="rounded-lg border border-slate-200 p-2 bg-slate-50"
                  >
                    <div className="text-xs font-medium text-slate-700 mb-1.5 flex justify-between">
                      <span>
                        Sheet {sheet.index} ·{" "}
                        {MATERIAL_INFO[sheet.material as keyof typeof MATERIAL_INFO]
                          ?.label ?? sheet.material}
                      </span>
                      <span className="text-slate-500">
                        {(sheet.utilization * 100).toFixed(0)}%
                      </span>
                    </div>
                    <svg
                      width={sheet.width * scale}
                      height={sheet.height * scale}
                      className="bg-white border border-slate-300 rounded"
                    >
                      {sheet.parts.map((p, i) => (
                        <g key={p.id + i}>
                          <rect
                            x={p.x * scale}
                            y={p.y * scale}
                            width={p.width * scale}
                            height={p.height * scale}
                            fill={
                              [
                                "#bae6fd",
                                "#a7f3d0",
                                "#fde68a",
                                "#fbcfe8",
                                "#ddd6fe",
                              ][i % 5]
                            }
                            stroke="#0369a1"
                            strokeWidth={0.8}
                          />
                          <text
                            x={(p.x + p.width / 2) * scale}
                            y={(p.y + p.height / 2) * scale}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={8}
                            fill="#0f172a"
                          >
                            {p.name.length > 12
                              ? p.name.slice(0, 10) + "…"
                              : p.name}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Cut List */}
        <section>
          <h4 className="font-semibold text-slate-900 mb-2">Cut List</h4>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Part</th>
                  <th className="text-left px-3 py-2 font-medium">Qty</th>
                  <th className="text-left px-3 py-2 font-medium">Size (L × W × T)</th>
                  <th className="text-left px-3 py-2 font-medium">Material</th>
                </tr>
              </thead>
              <tbody>
                {report.cutList.map((item) => (
                  <tr key={item.partId} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-900">{item.name}</td>
                    <td className="px-3 py-2">{item.quantity}</td>
                    <td className="px-3 py-2 font-mono">
                      {item.lengthIn.toFixed(2)}" × {item.widthIn.toFixed(2)}" ×{" "}
                      {item.thicknessIn.toFixed(2)}"
                    </td>
                    <td className="px-3 py-2">
                      {MATERIAL_INFO[item.material]?.label ?? item.material}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cost estimate */}
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
          <div className="text-xs text-emerald-800 font-medium">
            Rough material estimate
          </div>
          <div className="text-lg font-bold text-emerald-900">
            ~${cost.totalUsd.toFixed(0)} USD
          </div>
          <div className="text-[10px] text-emerald-700">
            Guidance only — local prices vary. Hardware included at rough box rates.
          </div>
        </section>

        {/* BOM */}
        <section>
          <h4 className="font-semibold text-slate-900 mb-2">
            Bill of Materials
          </h4>
          <ul className="space-y-2">
            {report.bom.map((item, i) => {
              const hdQuery = item.searchTerms?.[0] ?? item.name;
              const hdUrl = `https://www.homedepot.com/s/${encodeURIComponent(hdQuery)}`;
              return (
                <li
                  key={i}
                  className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">{item.name}</div>
                    {item.notes && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        {item.notes}
                      </div>
                    )}
                    <a
                      href={hdUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex mt-1 text-xs font-medium text-sky-700 hover:text-sky-900 underline-offset-2 hover:underline"
                    >
                      Search at Home Depot →
                    </a>
                  </div>
                  <div className="text-slate-700 whitespace-nowrap shrink-0">
                    {item.quantity} {item.unit}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Instructions with diagrams */}
        <section>
          <h4 className="font-semibold text-slate-900 mb-2">
            Assembly Steps
          </h4>
          <ol className="space-y-4">
            {report.instructions.map((step) => (
              <li
                key={step.step}
                className="flex gap-3 rounded-lg border border-slate-100 bg-white p-2 hover:border-sky-200"
                onMouseEnter={() =>
                  onHighlightParts?.(step.partsUsed ?? null)
                }
                onMouseLeave={() => onHighlightParts?.(null)}
              >
                <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center shrink-0">
                  {step.step}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900">{step.title}</div>
                  <div className="text-slate-600 text-xs mt-0.5">
                    {step.description}
                  </div>
                  {step.tips && (
                    <div className="text-xs text-amber-700 mt-1">
                      Tip: {step.tips}
                    </div>
                  )}
                  <StepDiagram kind={step.diagram} />
                </div>
              </li>
            ))}
          </ol>
        </section>

        <p className="text-[11px] text-slate-400 pt-2 border-t">
          Generated {new Date(report.generatedAt).toLocaleString()} · Guidance
          only — not a substitute for professional engineering.
        </p>
      </div>
    </div>
  );
}
