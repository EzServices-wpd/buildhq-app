"use client";

/**
 * Word-style searchable material dropdown.
 * Fast, keyboard-friendly, category-aware, sexy.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  FORGE_CATALOG,
  searchCatalog,
  CATALOG_CATEGORIES,
  getCatalogItem,
} from "@/lib/forge/catalog";
import type { CatalogItem } from "@/lib/forge/types";
import { clsx } from "clsx";

interface Props {
  value: string | null; // catalog id
  onChange: (id: string | null) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export function MaterialSearch({
  value,
  onChange,
  placeholder = "Search materials… (popsicle, PVC, paper towel…)",
  className,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = value ? getCatalogItem(value) : null;

  const results = useMemo(() => {
    if (!query.trim()) {
      // show by category when empty
      return FORGE_CATALOG;
    }
    return searchCatalog(query, 50);
  }, [query]);

  // group when no query
  const grouped = useMemo(() => {
    if (query.trim()) return null;
    const map = new Map<string, CatalogItem[]>();
    for (const cat of CATALOG_CATEGORIES) {
      const items = FORGE_CATALOG.filter((i) => i.category === cat.id);
      if (items.length) map.set(cat.id, items);
    }
    return map;
  }, [query]);

  const flatForKeys = results;

  const select = useCallback(
    (item: CatalogItem) => {
      onChange(item.id);
      setQuery("");
      setOpen(false);
      setHighlight(0);
    },
    [onChange]
  );

  const clear = () => {
    onChange(null);
    setQuery("");
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, flatForKeys.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter" && flatForKeys[highlight]) {
        e.preventDefault();
        select(flatForKeys[highlight]);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, highlight, flatForKeys, select]);

  // scroll highlighted into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlight}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  const dimLabel = (item: CatalogItem) => {
    const d = item.dims;
    if (item.formFactor === "stick" || item.formFactor === "board") {
      return `${d.length}" × ${d.width}" × ${d.thickness ?? d.height}"`;
    }
    if (item.formFactor === "tube" || item.formFactor === "pipe" || item.formFactor === "dowel") {
      return `${d.length}" L × ⌀${d.diameter}"`;
    }
    if (item.formFactor === "sheet") {
      return `${d.length}" × ${d.width}" × ${d.thickness}"`;
    }
    return Object.values(d)
      .filter(Boolean)
      .map((v) => `${v}"`)
      .join(" × ");
  };

  return (
    <div className={clsx("relative", className)}>
      {/* Trigger / display */}
      <div
        className={clsx(
          "flex items-center gap-2 rounded-xl border bg-white shadow-sm transition",
          open ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-300",
          compact ? "px-2.5 py-1.5" : "px-3 py-2.5"
        )}
      >
        {selected ? (
          <>
            <div
              className="w-4 h-4 rounded-sm shrink-0 border border-black/10"
              style={{ background: selected.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-900 truncate">
                {selected.name}
              </div>
              {!compact && (
                <div className="text-[11px] text-slate-500 truncate">
                  {dimLabel(selected)} · {selected.formFactor}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={clear}
              className="text-slate-400 hover:text-slate-600 text-xs px-1"
              aria-label="Clear material"
            >
              ✕
            </button>
          </>
        ) : (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
        )}
        <button
          type="button"
          onClick={() => {
            setOpen((o) => !o);
            if (!open) setTimeout(() => inputRef.current?.focus(), 10);
          }}
          className="text-slate-400 hover:text-slate-600"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div
            ref={listRef}
            className="absolute z-50 mt-1.5 w-full min-w-[320px] max-h-[380px] overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl"
          >
            {/* Live search when open + selected */}
            {selected && (
              <div className="sticky top-0 p-2 border-b bg-slate-50">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setHighlight(0);
                  }}
                  placeholder="Search to change…"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
                />
              </div>
            )}

            {query.trim() ? (
              // flat results
              <ul className="py-1">
                {results.length === 0 && (
                  <li className="px-4 py-6 text-center text-sm text-slate-400">
                    No materials match “{query}”
                  </li>
                )}
                {results.map((item, idx) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      data-idx={idx}
                      onClick={() => select(item)}
                      className={clsx(
                        "w-full flex items-start gap-3 px-3 py-2.5 text-left transition",
                        idx === highlight ? "bg-indigo-50" : "hover:bg-slate-50"
                      )}
                    >
                      <div
                        className="mt-0.5 w-5 h-5 rounded border border-black/10 shrink-0"
                        style={{ background: item.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-slate-900">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {dimLabel(item)} · {item.formFactor}
                          {item.unitCostUsd != null && item.unitCostUsd > 0 && (
                            <> · ~${item.unitCostUsd.toFixed(2)}/ea</>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              // grouped
              <div className="py-1">
                {CATALOG_CATEGORIES.map((cat) => {
                  const items = grouped?.get(cat.id);
                  if (!items?.length) return null;
                  return (
                    <div key={cat.id}>
                      <div className="sticky top-0 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-50/95 backdrop-blur">
                        {cat.emoji} {cat.label}
                      </div>
                      {items.map((item) => {
                        const globalIdx = flatForKeys.findIndex((r) => r.id === item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            data-idx={globalIdx}
                            onClick={() => select(item)}
                            className={clsx(
                              "w-full flex items-start gap-3 px-3 py-2 text-left transition",
                              globalIdx === highlight ? "bg-indigo-50" : "hover:bg-slate-50"
                            )}
                          >
                            <div
                              className="mt-0.5 w-4 h-4 rounded-sm border border-black/10 shrink-0"
                              style={{ background: item.color }}
                            />
                            <div className="min-w-0">
                              <div className="text-sm text-slate-900">{item.name}</div>
                              <div className="text-[10px] text-slate-500">{dimLabel(item)}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="sticky bottom-0 border-t bg-slate-50 px-3 py-2 text-[10px] text-slate-400">
              {FORGE_CATALOG.length} materials · type to search · ↑↓ Enter
            </div>
          </div>
        </>
      )}
    </div>
  );
}
