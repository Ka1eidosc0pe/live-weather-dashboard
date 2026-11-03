import assert from "node:assert/strict";
import { test } from "node:test";
import { WORKER_INTERVAL_MS, computeFreshness, formatAge } from "../src/lib/freshness.ts";
import type { WorkerRun } from "../src/lib/types.ts";

const NOW = Date.parse("2026-11-02T12:00:00Z");
const run = (minutesAgo: number, status: WorkerRun["status"] = "success"): WorkerRun => {
  const at = new Date(NOW - minutesAgo * 60_000).toISOString();
  return { id: 1, started_at: at, finished_at: at, status, cities_checked: 22, cities_changed: 0, error: status === "error" ? "boom" : null };
};
const state = (minutesAgo: number) => computeFreshness({ loaded: true, lastRun: run(minutesAgo), lastSuccess: run(minutesAgo), now: NOW });

test("interval matches the 5 minute cron schedule", () => {
  assert.equal(WORKER_INTERVAL_MS, 5 * 60_000);
});

test("loading until the first fetch completes", () => {
  assert.equal(computeFreshness({ loaded: false, lastRun: null, lastSuccess: null, now: NOW }).state, "loading");
});

test("empty when the worker has never run", () => {
  assert.equal(computeFreshness({ loaded: true, lastRun: null, lastSuccess: null, now: NOW }).state, "empty");
});

test("fresh within one interval plus slack, even if slightly late", () => {
  for (const m of [0.1, 4, 7]) assert.equal(state(m).state, "fresh", `${m}m`);
});

test("stale after one or two missed runs", () => {
  assert.deepEqual([9, 14].map((m) => state(m).state), ["stale", "stale"]);
  assert.equal(state(9).missedRuns, 1);
  assert.equal(state(16).missedRuns, 2);
});

test("outdated after three or more missed runs", () => {
  assert.equal(state(18).state, "outdated");
  assert.equal(state(120).state, "outdated");
});

test("failed takes priority and keeps the age of the last good data", () => {
  const f = computeFreshness({ loaded: true, lastRun: run(0.5, "error"), lastSuccess: run(4), now: NOW });
  assert.equal(f.state, "failed");
  assert.equal(f.error, "boom");
  assert.equal(f.ageMs, 4 * 60_000);
});

test("recovers to fresh once a run succeeds again", () => {
  assert.equal(computeFreshness({ loaded: true, lastRun: run(0.2), lastSuccess: run(0.2), now: NOW }).state, "fresh");
});

test("formatAge", () => {
  assert.equal(formatAge(null), "never");
  assert.equal(formatAge(2000), "just now");
  assert.equal(formatAge(42_000), "42s ago");
  assert.equal(formatAge(125_000), "2m 5s ago");
  assert.equal(formatAge(3 * 3600_000 + 5 * 60_000), "3h 5m ago");
});
