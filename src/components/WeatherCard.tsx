"use client";

import { headline } from "./FreshnessBadge";
import { WeatherIcon } from "./WeatherIcon";
import type { Freshness } from "@/lib/freshness";
import { formatAge } from "@/lib/freshness";
import type { City, WeatherRow } from "@/lib/types";
import { labelFor, sceneFor, speed, speedUnit, temp, windDirection, type SceneKind, type Units } from "@/lib/weather";

const hourLabel = (iso: string) => {
  const h = parseInt(iso.slice(11, 13), 10);
  return `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;
};
const weekday = (date: string, i: number) =>
  i === 0 ? "Today" : new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wider text-white/50">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  );
}

export function WeatherCard({
  city,
  row,
  units,
  freshness,
  preview,
  onClearPreview,
  now,
}: {
  city: City;
  row: WeatherRow | undefined;
  units: Units;
  freshness: Freshness;
  preview: { scene: SceneKind; isDay: boolean } | null;
  onClearPreview: () => void;
  now: number;
}) {
  const degraded = freshness.state === "stale" || freshness.state === "outdated" || freshness.state === "failed";

  return (
    <section
      data-state={freshness.state}
      className="pointer-events-auto w-[min(92vw,26rem)] max-h-full overflow-y-auto rounded-[2rem] border border-white/15 bg-black/25 p-6 text-white shadow-2xl backdrop-blur-xl [scrollbar-width:none]"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium tracking-tight">{city.name}</h1>
          <p className="text-sm text-white/55">{city.country}</p>
        </div>
        {preview && (
          <button onClick={onClearPreview} className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium hover:bg-white/25">
            Previewing · reset
          </button>
        )}
      </header>

      {freshness.state === "loading" || (!row && freshness.state !== "empty") ? (
        <div className="mt-8 animate-pulse space-y-4" aria-label="Loading weather">
          <div className="h-24 w-40 rounded-2xl bg-white/10" />
          <div className="h-4 w-32 rounded-full bg-white/10" />
          <div className="h-16 rounded-2xl bg-white/10" />
        </div>
      ) : !row ? (
        <p className="mt-8 text-sm text-white/70">No reading for {city.name} yet. It will appear here as soon as the worker has run.</p>
      ) : (
        <>
          {degraded && (
            <div
              role="status"
              className={`mt-4 rounded-xl px-3 py-2 text-xs ${
                freshness.state === "failed" ? "bg-red-500/20 text-red-100" : freshness.state === "outdated" ? "bg-orange-500/20 text-orange-100" : "bg-amber-400/20 text-amber-100"
              }`}
            >
              {headline(freshness)}
            </div>
          )}

          <div className={`transition-opacity duration-500 ${freshness.state === "outdated" ? "opacity-60" : ""}`}>
            <div className="mt-4 flex items-end gap-3">
              <span key={row.updated_at} className="text-[6.5rem] font-extralight leading-none tracking-tighter tabular-nums" style={{ animation: "value-flash 1.4s ease-out" }}>
                {temp(row.temperature_c, units)}
              </span>
              <span className="pb-3 text-3xl font-light text-white/70">°{units === "metric" ? "C" : "F"}</span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-lg">
              <WeatherIcon kind={sceneFor(row.weather_code, row.wind_gust_kph)} night={!row.is_day} />
              {labelFor(row.weather_code, row.wind_gust_kph)}
            </p>
            <p className="text-sm text-white/55">Feels like {temp(row.apparent_c, units)}°</p>

            <div className="mt-5 grid grid-cols-4 gap-3 border-t border-white/10 pt-4">
              <Stat label="Wind" value={`${speed(row.wind_kph, units)} ${speedUnit(units)} ${windDirection(row.wind_dir)}`} />
              <Stat label="Humidity" value={`${Math.round(row.humidity)}%`} />
              <Stat label="Rain" value={`${row.precipitation.toFixed(1)} mm`} />
              <Stat label="Cloud" value={`${Math.round(row.cloud_cover)}%`} />
            </div>

            {row.forecast.hourly && row.forecast.hourly.length > 0 && (
              <div className="mt-5 flex gap-4 overflow-x-auto border-t border-white/10 pt-4 [scrollbar-width:none]">
                {row.forecast.hourly.slice(0, 10).map((h, i) => (
                  <div key={h.time} className="flex shrink-0 flex-col items-center gap-1.5 text-xs">
                    <span className="text-white/55">{i === 0 ? "Now" : hourLabel(h.time)}</span>
                    <WeatherIcon kind={sceneFor(h.code)} night={false} className="h-5 w-5" />
                    <span className="font-medium tabular-nums">{temp(h.temp, units)}°</span>
                  </div>
                ))}
              </div>
            )}

            {row.forecast.daily && row.forecast.daily.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
                {row.forecast.daily.slice(0, 5).map((d, i) => (
                  <li key={d.date} className="grid grid-cols-[3.5rem_1.5rem_1fr_auto] items-center gap-3">
                    <span className="text-white/70">{weekday(d.date, i)}</span>
                    <WeatherIcon kind={sceneFor(d.code)} className="h-5 w-5" />
                    <span className="text-xs text-sky-200/80 tabular-nums">{d.pop > 10 ? `${d.pop}%` : ""}</span>
                    <span className="tabular-nums">
                      <span className="text-white/50">{temp(d.min, units)}°</span>
                      <span className="mx-1.5 text-white/25">/</span>
                      {temp(d.max, units)}°
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 text-[11px] text-white/40">
              Reading from {formatAge(now - Date.parse(row.observed_at))} · Open-Meteo
            </p>
          </div>
        </>
      )}
    </section>
  );
}
