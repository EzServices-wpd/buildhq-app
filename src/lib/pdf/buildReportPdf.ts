import type { BuildReport } from "@/types/project";
import { MATERIAL_INFO } from "@/types/project";
import { estimateBomCost } from "@/lib/pricing";

/**
 * Client-side PDF generation using the browser print API as a reliable MVP.
 * Later we can swap to @react-pdf/renderer for fully custom layout.
 */
export function downloadReportAsPdf(report: BuildReport, projectName = "BuildHq Project") {
  const statusLabel =
    report.feasibility.status === "ok"
      ? "Looks good"
      : report.feasibility.status === "warnings"
        ? "Recommendations"
        : "Critical issues";

  const cutRows = report.cutList
    .map(
      (item) =>
        `<tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${item.quantity}</td>
          <td>${item.lengthIn.toFixed(2)}" × ${item.widthIn.toFixed(2)}" × ${item.thicknessIn.toFixed(2)}"</td>
          <td>${escapeHtml(MATERIAL_INFO[item.material]?.label ?? item.material)}</td>
        </tr>`
    )
    .join("");

  const cost = estimateBomCost(report.bom);

  const bomItems = report.bom
    .map(
      (item) =>
        `<li><strong>${escapeHtml(item.name)}</strong> — ${item.quantity} ${item.unit}${
          item.searchTerms?.length
            ? `<br/><span class="muted">Search: ${escapeHtml(item.searchTerms.join(" · "))}</span>`
            : ""
        }</li>`
    )
    .join("");

  const steps = report.instructions
    .map(
      (s) =>
        `<div class="step"><div class="num">${s.step}</div><div><strong>${escapeHtml(
          s.title
        )}</strong><br/>${escapeHtml(s.description)}${
          s.tips ? `<br/><em>Tip: ${escapeHtml(s.tips)}</em>` : ""
        }</div></div>`
    )
    .join("");

  const issues =
    report.feasibility.issues.length === 0
      ? "<p class='muted'>No issues flagged.</p>"
      : `<ul>${report.feasibility.issues
          .map(
            (i) =>
              `<li><strong>${i.severity}</strong>: ${escapeHtml(i.message)}${
                i.suggestion ? `<br/><span class="muted">→ ${escapeHtml(i.suggestion)}</span>` : ""
              }</li>`
          )
          .join("")}</ul>`;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(projectName)} – Help Me Build</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 800px; margin: 40px auto; padding: 0 24px; font-size: 13px; line-height: 1.5; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    h2 { font-size: 15px; margin: 28px 0 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
    .ok { background: #ecfdf5; color: #065f46; }
    .warnings { background: #fffbeb; color: #92400e; }
    .critical { background: #fef2f2; color: #991b1b; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #475569; }
    .muted { color: #64748b; font-size: 11px; }
    .step { display: flex; gap: 12px; margin-bottom: 12px; }
    .num { width: 22px; height: 22px; border-radius: 999px; background: #e0f2fe; color: #0369a1; font-weight: 700; font-size: 11px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(projectName)}</h1>
  <p class="muted">Help Me Build Report · ${new Date(report.generatedAt).toLocaleString()}</p>

  <h2>Feasibility</h2>
  <div class="badge ${report.feasibility.status}">${statusLabel}</div>
  <p>${escapeHtml(report.feasibility.summary)}</p>
  ${issues}

  <h2>Cut List</h2>
  <table>
    <thead><tr><th>Part</th><th>Qty</th><th>Size (L × W × T)</th><th>Material</th></tr></thead>
    <tbody>${cutRows}</tbody>
  </table>

  <h2>Bill of Materials</h2>
  <p><strong>Rough estimate: ~$${cost.totalUsd.toFixed(0)} USD</strong>
  <span class="muted"> (local prices vary)</span></p>
  <ul>${bomItems}</ul>

  ${
    report.nestSummary
      ? `<h2>Sheet Nesting</h2>
  <p>${report.nestSummary.totalSheets} sheet(s) · avg utilization ${(
          report.nestSummary.averageUtilization * 100
        ).toFixed(0)}%${
          report.nestSummary.unplacedCount
            ? ` · ${report.nestSummary.unplacedCount} part(s) not nested (glass/lumber ordered separately)`
            : ""
        }</p>`
      : ""
  }

  <h2>Assembly Steps</h2>
  ${steps}

  <footer>
    BuildHq MVP · Guidance only — not a substitute for professional engineering or local building codes.
  </footer>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to download the PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
