"use client";

import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { computeFreshness, type Freshness } from "@/lib/freshness";
import { authenticateRealtime, useSupabase } from "@/lib/supabase";
import type { City, WeatherChange, WeatherRow, WorkerRun } from "@/lib/types";

export type Connection = "connecting" | "live" | "offline";

interface SelectionRow {
  city_id: string;
  position: number;
}

export interface LiveWeather {
  cities: City[];
  weather: Record<string, WeatherRow>;
  selected: string[];
  changes: WeatherChange[];
  freshness: Freshness;
  connection: Connection;
  loadError: string | null;
  toggleCity: (id: string) => Promise<void>;
}

const upsertById = <T extends { id: number }>(list: T[], item: T, max = 30) => [item, ...list.filter((x) => x.id !== item.id)].slice(0, max);

export function useLiveWeather(): LiveWeather {
  const supabase = useSupabase();
  const [cities, setCities] = useState<City[]>([]);
  const [weather, setWeather] = useState<Record<string, WeatherRow>>({});
  const [selection, setSelection] = useState<SelectionRow[]>([]);
  const [changes, setChanges] = useState<WeatherChange[]>([]);
  const [lastRun, setLastRun] = useState<WorkerRun | null>(null);
  const [lastSuccess, setLastSuccess] = useState<WorkerRun | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connection, setConnection] = useState<Connection>("connecting");
  const [now, setNow] = useState(() => Date.now());

  // Ticks once a second so ages and freshness states keep moving between realtime events.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    const [c, w, s, ch, run, ok] = await Promise.all([
      supabase.from("cities").select("*").order("sort"),
      supabase.from("weather_current").select("*"),
      supabase.from("user_cities").select("city_id, position").order("position"),
      supabase.from("weather_changes").select("*").order("created_at", { ascending: false }).limit(30),
      supabase.from("worker_runs").select("*").order("started_at", { ascending: false }).limit(1),
      supabase.from("worker_runs").select("*").eq("status", "success").order("started_at", { ascending: false }).limit(1),
    ]);
    const failure = [c, w, s, ch, run, ok].find((r) => r.error)?.error;
    if (failure) {
      setLoadError(failure.message);
      return;
    }
    setLoadError(null);
    setCities(c.data as City[]);
    setWeather(Object.fromEntries((w.data as WeatherRow[]).map((r) => [r.city_id, r])));
    setSelection(s.data as SelectionRow[]);
    setChanges(ch.data as WeatherChange[]);
    setLastRun((run.data?.[0] as WorkerRun) ?? null);
    setLastSuccess((ok.data?.[0] as WorkerRun) ?? null);
    setLoaded(true);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    const refetch = () => {
      load().catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : String(e)));
    };

    let channel: ReturnType<typeof supabase.channel> | undefined;
    let refreshAuth: ReturnType<typeof setInterval> | undefined;

    const start = async () => {
      await authenticateRealtime(supabase);
      if (cancelled) return;
      channel = supabase
        .channel("live-weather")
        .on("postgres_changes", { event: "*", schema: "public", table: "weather_current" }, (p: RealtimePostgresChangesPayload<WeatherRow>) => {
          if (p.eventType === "DELETE") return;
          setWeather((prev) => ({ ...prev, [p.new.city_id]: p.new }));
        })
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "worker_runs" }, (p: RealtimePostgresChangesPayload<WorkerRun>) => {
          const run = p.new as WorkerRun;
          setLastRun(run);
          if (run.status === "success") setLastSuccess(run);
        })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "weather_changes" },
          (p: RealtimePostgresChangesPayload<WeatherChange>) => {
            setChanges((prev) => upsertById(prev, p.new as WeatherChange));
          },
        )
        // Own selections only: RLS filters this stream, so other users' rows never arrive.
        .on("postgres_changes", { event: "*", schema: "public", table: "user_cities" }, (p: RealtimePostgresChangesPayload<SelectionRow>) => {
          if (p.eventType === "DELETE") {
            const gone = (p.old as Partial<SelectionRow>).city_id;
            if (gone) setSelection((prev) => prev.filter((s) => s.city_id !== gone));
          } else {
            const row = p.new as SelectionRow;
            setSelection((prev) => [...prev.filter((s) => s.city_id !== row.city_id), row].sort((a, b) => a.position - b.position));
          }
        })
        .subscribe((status) => {
          if (cancelled) return;
          if (status === "SUBSCRIBED") {
            setConnection("live");
            refetch(); // catch anything missed while connecting or reconnecting
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            setConnection("offline");
          }
        });
      // Clerk session tokens are short-lived; keep the socket's token fresh.
      refreshAuth = setInterval(() => void authenticateRealtime(supabase), 40_000);
    };
    start().catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : String(e)));

    return () => {
      cancelled = true;
      clearInterval(refreshAuth);
      if (channel) supabase.removeChannel(channel);
    };
  }, [supabase, load]);

  const toggleCity = useCallback(
    async (id: string) => {
      const has = selection.some((s) => s.city_id === id);
      if (has) {
        setSelection((prev) => prev.filter((s) => s.city_id !== id));
        const { error } = await supabase.from("user_cities").delete().eq("city_id", id);
        if (error) {
          setLoadError(error.message);
          load();
        }
      } else {
        const position = selection.length ? Math.max(...selection.map((s) => s.position)) + 1 : 0;
        setSelection((prev) => [...prev, { city_id: id, position }]);
        const { error } = await supabase.from("user_cities").insert({ city_id: id, position });
        if (error) {
          setLoadError(error.message);
          load();
        }
      }
    },
    [supabase, selection, load],
  );

  const freshness = useMemo(() => computeFreshness({ loaded, lastRun, lastSuccess, now }), [loaded, lastRun, lastSuccess, now]);
  const selected = useMemo(() => selection.map((s) => s.city_id), [selection]);

  return { cities, weather, selected, changes, freshness, connection, loadError, toggleCity };
}
