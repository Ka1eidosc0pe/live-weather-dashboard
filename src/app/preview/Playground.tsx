"use client";

import { useState } from "react";
import { Stage } from "@/components/scene/Stage";
import { LAUNCH_CITY_IDS } from "@/components/scene/cities";
import { SCENE_KINDS, SCENE_LABELS, type SceneKind } from "@/lib/weather";

const CITIES = [...LAUNCH_CITY_IDS, "paris"];

/** Public, auth-free playground: every launch city under every kind of weather. */
export function Playground({ initialCity, initialScene, initialDay }: { initialCity: string; initialScene: SceneKind; initialDay: boolean }) {
  const [city, setCity] = useState(initialCity);
  const [scene, setScene] = useState<SceneKind>(initialScene);
  const [isDay, setIsDay] = useState(initialDay);

  const chip = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur transition ${active ? "bg-white text-slate-900" : "bg-black/30 text-white hover:bg-black/45"}`;

  return (
    <main className="fixed inset-0">
      <Stage cityId={city} scene={scene} isDay={isDay} />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-4">
        <div className="pointer-events-auto flex flex-wrap justify-center gap-1.5">
          {CITIES.map((c) => (
            <button key={c} className={chip(c === city)} onClick={() => setCity(c)}>
              {c.replace("-", " ")}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex flex-wrap justify-center gap-1.5">
          {SCENE_KINDS.map((k) => (
            <button key={k} className={chip(k === scene)} onClick={() => setScene(k)}>
              {SCENE_LABELS[k]}
            </button>
          ))}
          <button className={chip(false)} onClick={() => setIsDay((d) => !d)}>
            {isDay ? "Day" : "Night"}
          </button>
        </div>
      </div>
    </main>
  );
}
