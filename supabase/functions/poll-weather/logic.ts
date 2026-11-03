// Pure helpers for the poll-weather worker (no Deno or network APIs, so they can be unit tested anywhere).

export interface City {
  id: string;
  latitude: number;
  longitude: number;
}

export interface Reading {
  city_id: string;
  temperature_c: number;
  apparent_c: number;
  humidity: number;
  precipitation: number;
  cloud_cover: number;
  weather_code: number;
  is_day: boolean;
  wind_kph: number;
  wind_gust_kph: number;
  wind_dir: number;
  observed_at: string;
  forecast: {
    hourly: { time: string; temp: number; code: number; pop: number }[];
    daily: { date: string; code: number; max: number; min: number; pop: number; sunrise: string; sunset: string }[];
  };
}

// Fields compared to decide whether the weather "changed". Forecast is stored but not diffed.
export const TRACKED_FIELDS = [
  "temperature_c",
  "apparent_c",
  "humidity",
  "precipitation",
  "cloud_cover",
  "weather_code",
  "is_day",
  "wind_kph",
  "wind_gust_kph",
  "wind_dir",
] as const;

type Tracked = (typeof TRACKED_FIELDS)[number];
export type Changes = Partial<Record<Tracked, { from: unknown; to: unknown }>>;

export const CURRENT_VARS =
  "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,wind_gusts_10m";
export const HOURLY_VARS = "temperature_2m,weather_code,precipitation_probability";
export const DAILY_VARS =
  "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset";

export function buildUrl(cities: City[]): string {
  const p = new URLSearchParams({
    latitude: cities.map((c) => c.latitude).join(","),
    longitude: cities.map((c) => c.longitude).join(","),
    current: CURRENT_VARS,
    hourly: HOURLY_VARS,
    daily: DAILY_VARS,
    timezone: "auto",
    forecast_days: "6",
    forecast_hours: "12",
  });
  return `https://api.open-meteo.com/v1/forecast?${p}`;
}

// Open-Meteo returns an object for one location and an array for several.
// Timestamps are local to the city; `utc_offset_seconds` lets us turn them into real instants.
export function parseResponse(cities: City[], body: unknown): Reading[] {
  const items = Array.isArray(body) ? body : [body];
  if (items.length !== cities.length) {
    throw new Error(`Open-Meteo returned ${items.length} locations, expected ${cities.length}`);
  }
  return items.map((raw, i) => {
    // deno-lint-ignore no-explicit-any
    const r = raw as any;
    const c = r?.current;
    if (!c || typeof c.temperature_2m !== "number" || typeof c.weather_code !== "number") {
      throw new Error(`Open-Meteo response for ${cities[i].id} is missing current conditions`);
    }
    const offset = Number(r.utc_offset_seconds ?? 0);
    const hourly = (r.hourly?.time ?? []).map((time: string, k: number) => ({
      time,
      temp: r.hourly.temperature_2m[k],
      code: r.hourly.weather_code[k],
      pop: r.hourly.precipitation_probability[k] ?? 0,
    }));
    const daily = (r.daily?.time ?? []).map((date: string, k: number) => ({
      date,
      code: r.daily.weather_code[k],
      max: r.daily.temperature_2m_max[k],
      min: r.daily.temperature_2m_min[k],
      pop: r.daily.precipitation_probability_max[k] ?? 0,
      sunrise: r.daily.sunrise[k],
      sunset: r.daily.sunset[k],
    }));
    return {
      city_id: cities[i].id,
      temperature_c: c.temperature_2m,
      apparent_c: c.apparent_temperature,
      humidity: c.relative_humidity_2m,
      precipitation: c.precipitation,
      cloud_cover: c.cloud_cover,
      weather_code: c.weather_code,
      is_day: c.is_day === 1,
      wind_kph: c.wind_speed_10m,
      wind_gust_kph: c.wind_gusts_10m,
      wind_dir: c.wind_direction_10m,
      observed_at: localToIso(c.time, offset),
      forecast: { hourly, daily },
    };
  });
}

export function localToIso(local: string, offsetSeconds: number): string {
  // "2026-11-02T18:30" in a zone at `offsetSeconds` from UTC.
  const asUtc = Date.parse(`${local}:00Z`);
  if (Number.isNaN(asUtc)) throw new Error(`Bad timestamp from Open-Meteo: ${local}`);
  return new Date(asUtc - offsetSeconds * 1000).toISOString();
}

export function diffReading(prev: Partial<Reading> | undefined, next: Reading): Changes {
  const changes: Changes = {};
  if (!prev) return changes;
  for (const f of TRACKED_FIELDS) {
    if (prev[f] !== next[f]) changes[f] = { from: prev[f], to: next[f] };
  }
  return changes;
}

export function forecastChanged(prev: Partial<Reading> | undefined, next: Reading): boolean {
  return JSON.stringify(prev?.forecast ?? null) !== JSON.stringify(next.forecast);
}
