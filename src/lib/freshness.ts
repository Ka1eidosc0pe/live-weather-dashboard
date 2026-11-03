import type { WorkerRun } from "./types";

// pg_cron runs the worker every 5 minutes (supabase/migrations/*_cron.sql).
export const WORKER_INTERVAL_MS = 5 * 60_000;

export type FreshnessState =
  | "loading" // initial fetch in flight
  | "empty" // loaded, but the worker has never succeeded
  | "fresh" // within ~1 interval of the last success
  | "stale" // 1-2 runs missed
  | "outdated" // 3+ runs missed
  | "failed"; // the most recent run errored

export interface Freshness {
  state: FreshnessState;
  lastSuccessAt: number | null;
  ageMs: number | null;
  missedRuns: number;
  error: string | null;
  failedAt: number | null;
}

interface Input {
  loaded: boolean;
  lastRun: WorkerRun | null;
  lastSuccess: WorkerRun | null;
  now: number;
}

export function computeFreshness({ loaded, lastRun, lastSuccess, now }: Input): Freshness {
  const lastSuccessAt = lastSuccess ? Date.parse(lastSuccess.finished_at) : null;
  const ageMs = lastSuccessAt === null ? null : Math.max(0, now - lastSuccessAt);
  // Allow half an interval of slack so a run that is a few seconds late is not "missed".
  const missedRuns = ageMs === null ? 0 : Math.max(0, Math.floor((ageMs - WORKER_INTERVAL_MS / 2) / WORKER_INTERVAL_MS));
  const base = { lastSuccessAt, ageMs, missedRuns, error: null, failedAt: null };

  if (!loaded) return { ...base, state: "loading" };
  if (lastRun?.status === "error") {
    return { ...base, state: "failed", error: lastRun.error, failedAt: Date.parse(lastRun.started_at) };
  }
  if (ageMs === null) return { ...base, state: "empty" };
  if (missedRuns === 0) return { ...base, state: "fresh" };
  if (missedRuns < 3) return { ...base, state: "stale" };
  return { ...base, state: "outdated" };
}

export function formatAge(ms: number | null): string {
  if (ms === null) return "never";
  const s = Math.round(ms / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60 ? `${s % 60}s ` : ""}ago`.replace("  ", " ");
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ${m % 60}m ago`;
  return `${Math.floor(h / 24)}d ago`;
}
