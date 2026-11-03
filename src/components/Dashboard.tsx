"use client";

import { UserButton } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import { CityPicker } from "./CityPicker";
import { FreshnessBadge } from "./FreshnessBadge";
import { Stage } from "./scene/Stage";
import { WeatherCard } from "./WeatherCard";
import { useLiveWeather } from "@/hooks/useLiveWeather";
import { SCENE_KINDS, SCENE_LABELS, sceneFor, type SceneKind, type Units } from "@/lib/weather";

interface Preview {
  scene: SceneKind;
  isDay: boolean;
}

const pill = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-xl transition ${
    active ? "border-white bg-white text-slate-900" : "border-white/15 bg-black/25 text-white hover:bg-black/40"
  }`;

export function Dashboard() {
  const { cities, weather, selected, changes, freshness, connection, loadError, toggleCity } = useLiveWeather();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [units, setUnits] = useState<Units>(() => (typeof window !== "undefined" && localStorage.getItem("units") === "imperial" ? "imperial" : "metric"));
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => localStorage.setItem("units", units), [units]);

  const byId = useMemo(() => Object.fromEntries(cities.map((c) => [c.id, c])), [cities]);
  const mine = useMemo(() => selected.map((id) => byId[id]).filter(Boolean), [selected, byId]);
  const active = (activeId && mine.find((c) => c.id === activeId)) || mine[0] || null;
  const row = active ? weather[active.id] : undefined;

  const live = row ? { scene: sceneFor(row.weather_code, row.wind_gust_kph), isDay: row.is_day } : { scene: "partly" as SceneKind, isDay: true };
  const shown = preview ?? live;

  const latestChange = useMemo(() => (active ? changes.find((c) => c.city_id === active.id) : undefined), [changes, active]);

  // The preview describes a specific city's scene; drop it when you switch.
  const pick = (id: string) => {
    setActiveId(id);
    setPreview(null);
  };

  return (
    <main className="fixed inset-0 overflow-hidden">
      <Stage cityId={active?.id ?? null} scene={shown.scene} isDay={shown.isDay} />

      <div className="pointer-events-none absolute inset-0 z-50 flex flex-col p-4 sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <div className="pointer-events-auto rounded-full border border-white/15 bg-black/25 px-4 py-2 text-sm font-medium tracking-wide text-white backdrop-blur-xl">Skyline</div>
          <div className="pointer-events-auto flex items-center gap-2">
            <FreshnessBadge freshness={freshness} connection={connection} />
            <button onClick={() => setUnits((u) => (u === "metric" ? "imperial" : "metric"))} className={`${pill(false)} !px-3 !py-2 text-xs`} aria-label="Toggle units">
              °{units === "metric" ? "C" : "F"}
            </button>
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className={`${pill(!!preview)} !px-3 !py-2 text-xs`}>
                Try weather
              </button>
              {menuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-white/15 bg-slate-900/90 p-2 text-white shadow-2xl backdrop-blur-xl">
                  <p className="px-2 pb-1 pt-1 text-[11px] text-white/50">Preview any weather in {active?.name ?? "your city"}</p>
                  {SCENE_KINDS.map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        setPreview({ scene: k, isDay: preview?.isDay ?? live.isDay });
                        setMenuOpen(false);
                      }}
                      className="block w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/10"
                    >
                      {SCENE_LABELS[k]}
                    </button>
                  ))}
                  <button
                    onClick={() => setPreview({ scene: shown.scene, isDay: !shown.isDay })}
                    className="mt-1 block w-full rounded-lg border-t border-white/10 px-2 py-1.5 pt-2 text-left text-sm hover:bg-white/10"
                  >
                    Switch to {shown.isDay ? "night" : "day"}
                  </button>
                </div>
              )}
            </div>
            <UserButton />
          </div>
        </header>

        {loadError && (
          <div role="alert" className="pointer-events-auto mx-auto mt-3 max-w-md rounded-xl bg-red-500/25 px-4 py-2 text-xs text-red-50 backdrop-blur-xl">
            Couldn&apos;t reach the database: {loadError}
          </div>
        )}

        <div className="flex min-h-0 flex-1 items-center justify-center py-4">
          {active ? (
            <WeatherCard
              city={active}
              row={row}
              units={units}
              freshness={freshness}
              preview={preview}
              onClearPreview={() => setPreview(null)}
              now={now}
            />
          ) : (
            <section className="pointer-events-auto w-[min(92vw,26rem)] rounded-[2rem] border border-white/15 bg-black/25 p-8 text-center text-white backdrop-blur-xl">
              {freshness.state === "loading" ? (
                <div className="animate-pulse space-y-3" aria-label="Loading">
                  <div className="mx-auto h-6 w-40 rounded-full bg-white/10" />
                  <div className="mx-auto h-4 w-56 rounded-full bg-white/10" />
                </div>
              ) : (
                <>
                  <h1 className="text-xl font-medium">Pick your first city</h1>
                  <p className="mt-2 text-sm text-white/60">Choose the places you care about. Only they will show up here, and updates arrive live.</p>
                  <button onClick={() => setPickerOpen(true)} className={`${pill(true)} mt-5`}>
                    Choose cities
                  </button>
                </>
              )}
            </section>
          )}
        </div>

        <footer className="flex flex-col items-center gap-3">
          {latestChange && (
            <p className="pointer-events-auto rounded-full bg-black/25 px-3 py-1 text-[11px] text-white/70 backdrop-blur-xl">
              Last change in {active?.name}: {Object.keys(latestChange.changes).slice(0, 3).map((k) => k.replace(/_(c|kph)$/, "").replace("_", " ")).join(", ")} ·{" "}
              {Math.max(0, Math.round((now - Date.parse(latestChange.created_at)) / 60000))}m ago
            </p>
          )}
          <nav className="pointer-events-auto flex max-w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {mine.map((c) => (
              <button key={c.id} onClick={() => pick(c.id)} className={`${pill(c.id === active?.id)} shrink-0`}>
                {c.name}
              </button>
            ))}
            {cities.length > 0 && (
              <button onClick={() => setPickerOpen(true)} className={`${pill(false)} shrink-0`} aria-label="Add or remove cities">
                {mine.length ? "+" : "+ Add city"}
              </button>
            )}
          </nav>
        </footer>
      </div>

      {pickerOpen && <CityPicker cities={cities} selected={selected} onToggle={toggleCity} onClose={() => setPickerOpen(false)} />}
    </main>
  );
}
