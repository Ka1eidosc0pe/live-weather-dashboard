// poll-weather: fetch current conditions and forecasts for every city from Open-Meteo,
// write only what changed, log the diff and record the run so the UI can show freshness.
// Invoked by pg_cron (see supabase/migrations/*_cron.sql) with `Authorization: Bearer $CRON_SECRET`.
import { createClient } from "npm:@supabase/supabase-js@2";
import { buildUrl, diffReading, forecastChanged, parseResponse, type City, type Reading } from "./logic.ts";

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

function authorised(req: Request): boolean {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return false;
  const given = req.headers.get("Authorization") ?? "";
  const expected = `Bearer ${secret}`;
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

async function fetchWithRetry(url: string, attempts = 3): Promise<unknown> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}: ${(await res.text()).slice(0, 200)}`);
      return await res.json();
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 500 * 2 ** i));
    }
  }
  throw lastError;
}

async function poll(): Promise<{ checked: number; changed: number }> {
  const { data: cities, error: citiesErr } = await supabase
    .from("cities")
    .select("id, latitude, longitude")
    .order("sort");
  if (citiesErr) throw new Error(`Loading cities failed: ${citiesErr.message}`);
  if (!cities?.length) throw new Error("No cities configured");

  const readings: Reading[] = parseResponse(cities as City[], await fetchWithRetry(buildUrl(cities as City[])));

  const { data: existing, error: existingErr } = await supabase.from("weather_current").select("*");
  if (existingErr) throw new Error(`Loading current weather failed: ${existingErr.message}`);
  const prevById = new Map((existing ?? []).map((row) => [row.city_id as string, row as Reading]));

  const upserts: (Reading & { updated_at: string })[] = [];
  const logs: { city_id: string; changes: unknown }[] = [];
  for (const next of readings) {
    const prev = prevById.get(next.city_id);
    const changes = diffReading(prev, next);
    const hasChanges = Object.keys(changes).length > 0;
    if (!prev || hasChanges || forecastChanged(prev, next)) {
      upserts.push({ ...next, updated_at: new Date().toISOString() });
    }
    if (hasChanges) logs.push({ city_id: next.city_id, changes });
  }

  if (upserts.length) {
    const { error } = await supabase.from("weather_current").upsert(upserts);
    if (error) throw new Error(`Saving weather failed: ${error.message}`);
  }
  if (logs.length) {
    const { error } = await supabase.from("weather_changes").insert(logs);
    if (error) throw new Error(`Saving change log failed: ${error.message}`);
  }
  return { checked: readings.length, changed: upserts.length };
}

Deno.serve(async (req) => {
  if (!authorised(req)) return new Response("Unauthorized", { status: 401 });

  const startedAt = new Date().toISOString();
  try {
    const { checked, changed } = await poll();
    await supabase.from("worker_runs").insert({
      started_at: startedAt,
      status: "success",
      cities_checked: checked,
      cities_changed: changed,
    });
    return Response.json({ ok: true, checked, changed });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("poll-weather failed:", message);
    // Best effort: if the database itself is down this insert fails too and the UI falls back to age-based staleness.
    await supabase.from("worker_runs").insert({ started_at: startedAt, status: "error", error: message.slice(0, 500) });
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
});
