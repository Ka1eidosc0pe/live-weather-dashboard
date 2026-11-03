"use client";

import { useState } from "react";
import type { Connection } from "@/hooks/useLiveWeather";
import { WORKER_INTERVAL_MS, formatAge, type Freshness, type FreshnessState } from "@/lib/freshness";

const STYLE: Record<FreshnessState, { dot: string; ring: string; label: string }> = {
  loading: { dot: "bg-slate-300 animate-pulse", ring: "border-white/20", label: "Connecting" },
  empty: { dot: "bg-slate-300", ring: "border-white/20", label: "Waiting for first update" },
  fresh: { dot: "bg-emerald-400", ring: "border-emerald-300/30", label: "Live" },
  stale: { dot: "bg-amber-400", ring: "border-amber-300/40", label: "Delayed" },
  outdated: { dot: "bg-orange-500", ring: "border-orange-400/50", label: "Out of date" },
  failed: { dot: "bg-red-500", ring: "border-red-400/60", label: "Update failed" },
};

export function headline(f: Freshness): string {
  const age = formatAge(f.ageMs);
  switch (f.state) {
    case "loading":
      return "Connecting…";
    case "empty":
      return "Waiting for the first worker run";
    case "fresh":
      return `Live · updated ${age}`;
    case "stale":
      return `Delayed · last update ${age}`;
    case "outdated":
      return `Out of date · last update ${age}`;
    case "failed":
      return f.lastSuccessAt ? `Update failed · showing data from ${age}` : "Update failed · no data yet";
  }
}

export function explanation(f: Freshness): string {
  const mins = WORKER_INTERVAL_MS / 60000;
  switch (f.state) {
    case "loading":
      return "Fetching the latest readings.";
    case "empty":
      return `The worker has not completed a run yet. It runs every ${mins} minutes.`;
    case "fresh":
      return `The worker runs every ${mins} minutes and the latest run succeeded on schedule.`;
    case "stale":
      return `${f.missedRuns} scheduled run${f.missedRuns > 1 ? "s were" : " was"} missed. The numbers below are the last known readings.`;
    case "outdated":
      return `${f.missedRuns} runs in a row were missed, so these readings may no longer match the weather outside.`;
    case "failed":
      return "The most recent worker run hit an error. The numbers below are the last successful readings.";
  }
}

export function FreshnessBadge({ freshness, connection }: { freshness: Freshness; connection: Connection }) {
  const [open, setOpen] = useState(false);
  const s = STYLE[freshness.state];
  const time = (ms: number | null) => (ms === null ? "never" : new Date(ms).toLocaleTimeString());

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        data-freshness={freshness.state}
        className={`flex items-center gap-2 rounded-full border bg-black/30 px-3.5 py-2 text-xs font-medium text-white backdrop-blur-xl transition hover:bg-black/40 ${s.ring}`}
      >
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        <span className="max-w-[60vw] truncate sm:max-w-none">{headline(freshness)}</span>
        {connection !== "live" && freshness.state !== "loading" && <span className="text-white/60">· reconnecting</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-white/15 bg-slate-900/85 p-4 text-sm text-white shadow-2xl backdrop-blur-xl">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <span className={`h-2 w-2 rounded-full ${s.dot}`} />
            {s.label}
          </div>
          <p className="text-white/70">{explanation(freshness)}</p>
          {freshness.state === "failed" && freshness.error && (
            <p className="mt-3 rounded-lg bg-red-500/15 p-2 font-mono text-xs text-red-200">{freshness.error}</p>
          )}
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs text-white/70">
            <dt>Last success</dt>
            <dd className="text-right text-white">{time(freshness.lastSuccessAt)}</dd>
            {freshness.failedAt !== null && (
              <>
                <dt>Last failure</dt>
                <dd className="text-right text-white">{time(freshness.failedAt)}</dd>
              </>
            )}
            <dt>Missed runs</dt>
            <dd className="text-right text-white">{freshness.missedRuns}</dd>
            <dt>Realtime</dt>
            <dd className="text-right text-white">{connection === "live" ? "connected" : connection === "connecting" ? "connecting" : "reconnecting"}</dd>
          </dl>
        </div>
      )}
    </div>
  );
}
