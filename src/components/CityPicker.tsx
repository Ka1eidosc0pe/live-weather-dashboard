"use client";

import { useEffect, useMemo, useState } from "react";
import type { City } from "@/lib/types";

export function CityPicker({
  cities,
  selected,
  onToggle,
  onClose,
}: {
  cities: City[];
  selected: string[];
  onToggle: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cities.filter((c) => !q || c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q));
  }, [cities, query]);

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-label="Choose cities"
        className="flex max-h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-[2rem] border border-white/15 bg-slate-900/90 text-white shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-5">
          <h2 className="text-lg font-medium">Your cities</h2>
          <button onClick={onClose} className="rounded-full bg-white/10 px-3 py-1 text-xs hover:bg-white/20">
            Done
          </button>
        </div>
        <p className="px-6 pt-1 text-xs text-white/50">
          Cities marked <span className="text-amber-200">animated</span> have a hand-drawn skyline you can play with.
        </p>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search cities"
          className="mx-6 mt-4 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm outline-none placeholder:text-white/40 focus:border-white/30"
        />
        <ul className="mt-3 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
          {visible.map((c) => {
            const on = selected.includes(c.id);
            return (
              <li key={c.id}>
                <button
                  onClick={() => onToggle(c.id)}
                  aria-pressed={on}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-white/10"
                >
                  <span>
                    <span className="text-sm font-medium">{c.name}</span>
                    <span className="ml-2 text-xs text-white/45">{c.country}</span>
                    {c.animated && <span className="ml-2 text-[10px] uppercase tracking-wider text-amber-200">animated</span>}
                  </span>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[11px] ${on ? "border-emerald-300 bg-emerald-400 text-slate-900" : "border-white/30"}`}>
                    {on ? "✓" : ""}
                  </span>
                </button>
              </li>
            );
          })}
          {visible.length === 0 && <li className="px-3 py-6 text-center text-sm text-white/50">No cities match “{query}”.</li>}
        </ul>
      </div>
    </div>
  );
}
