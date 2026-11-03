import assert from "node:assert/strict";
import { test } from "node:test";
import { buildUrl, diffReading, forecastChanged, localToIso, parseResponse } from "../supabase/functions/poll-weather/logic.ts";

const cities = [
  { id: "chicago", latitude: 41.8781, longitude: -87.6298 },
  { id: "tokyo", latitude: 35.6762, longitude: 139.6503 },
];

const location = (temp: number, code: number, offset: number) => ({
  utc_offset_seconds: offset,
  current: {
    time: "2026-11-02T18:30",
    temperature_2m: temp,
    apparent_temperature: temp - 1,
    relative_humidity_2m: 80,
    precipitation: 0,
    cloud_cover: 50,
    weather_code: code,
    is_day: 1,
    wind_speed_10m: 12,
    wind_gusts_10m: 30,
    wind_direction_10m: 180,
  },
  hourly: { time: ["2026-11-02T18:00"], temperature_2m: [temp], weather_code: [code], precipitation_probability: [null] },
  daily: {
    time: ["2026-11-02"],
    weather_code: [code],
    temperature_2m_max: [temp + 2],
    temperature_2m_min: [temp - 2],
    precipitation_probability_max: [10],
    sunrise: ["2026-11-02T06:24"],
    sunset: ["2026-11-02T16:43"],
  },
});

test("buildUrl batches every city into one request", () => {
  const url = new URL(buildUrl(cities));
  assert.equal(url.searchParams.get("latitude"), "41.8781,35.6762");
  assert.equal(url.searchParams.get("longitude"), "-87.6298,139.6503");
});

test("localToIso converts city-local time to a real instant", () => {
  assert.equal(localToIso("2026-11-02T18:30", -21600), "2026-11-03T00:30:00.000Z");
  assert.equal(localToIso("2026-11-02T18:30", 32400), "2026-11-02T09:30:00.000Z");
});

test("parseResponse maps each location to its city and normalises fields", () => {
  const [chi, tok] = parseResponse(cities, [location(14.2, 3, -21600), location(16.2, 1, 32400)]);
  assert.equal(chi.city_id, "chicago");
  assert.equal(chi.temperature_c, 14.2);
  assert.equal(chi.is_day, true);
  assert.equal(chi.observed_at, "2026-11-03T00:30:00.000Z");
  assert.equal(chi.forecast.hourly[0].pop, 0, "null precipitation probability becomes 0");
  assert.equal(tok.city_id, "tokyo");
});

test("parseResponse rejects a response with the wrong number of locations", () => {
  assert.throws(() => parseResponse(cities, [location(1, 1, 0)]), /returned 1 locations, expected 2/);
});

test("parseResponse rejects a location without current conditions", () => {
  assert.throws(() => parseResponse(cities, [location(1, 1, 0), { utc_offset_seconds: 0 }]), /tokyo is missing current/);
});

test("diffReading reports only the fields that moved", () => {
  const [a] = parseResponse([cities[0]], location(14.2, 3, -21600));
  assert.deepEqual(diffReading(a, a), {});
  const b = { ...a, temperature_c: 15.1, weather_code: 61 };
  assert.deepEqual(diffReading(a, b), {
    temperature_c: { from: 14.2, to: 15.1 },
    weather_code: { from: 3, to: 61 },
  });
});

test("a city seen for the first time has no changes to log", () => {
  const [a] = parseResponse([cities[0]], location(14.2, 3, -21600));
  assert.deepEqual(diffReading(undefined, a), {});
  assert.equal(forecastChanged(undefined, a), true);
});

test("forecastChanged detects revised forecasts independently of current conditions", () => {
  const [a] = parseResponse([cities[0]], location(14.2, 3, -21600));
  const b = structuredClone(a);
  assert.equal(forecastChanged(a, b), false);
  b.forecast.daily[0].max += 1;
  assert.equal(forecastChanged(a, b), true);
  assert.deepEqual(diffReading(a, b), {});
});

test("forecastChanged ignores key order, which jsonb does not preserve", () => {
  const [a] = parseResponse([cities[0]], location(14.2, 3, -21600));
  const reordered = JSON.parse(JSON.stringify(a));
  reordered.forecast.daily = reordered.forecast.daily.map((d: Record<string, unknown>) => Object.fromEntries(Object.entries(d).reverse()));
  reordered.forecast = { daily: reordered.forecast.daily, hourly: reordered.forecast.hourly };
  assert.equal(forecastChanged(a, reordered), false);
});
