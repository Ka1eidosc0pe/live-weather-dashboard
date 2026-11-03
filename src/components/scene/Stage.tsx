"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sceneForCity } from "./cities";
import { HeatWaves, Sprout, Tornado } from "./Effects";
import { ParticleCanvas, type ParticleHandle } from "./ParticleCanvas";
import { paletteFor } from "./palette";
import { PaletteContext, SceneDefs, Walkers, hash } from "./parts";
import { Fog, Sky, type MoonMode, type SunMode } from "./Sky";
import { VB_H, VB_W, type Box } from "./types";
import type { SceneKind } from "@/lib/weather";

interface Bubble { id: number; x: number; y: number; text: string }
interface Bolt { id: number; x: number; points: string; branch: string }
interface Beam { id: number; x1: number; y1: number; x2: number; y2: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const inBox = (x: number, y: number, b: Box, pad: number) =>
  x >= b.x - pad && x <= b.x + b.w + pad && y >= b.y - pad && y <= b.y + b.h + pad;

function jagged(x: number, y0: number, y1: number, spread: number) {
  const pts: string[] = [];
  let cx = x;
  const steps = 9;
  for (let i = 0; i <= steps; i++) {
    const y = y0 + ((y1 - y0) * i) / steps;
    pts.push(`${cx.toFixed(1)},${y.toFixed(1)}`);
    cx += (Math.random() - 0.5) * spread;
  }
  return pts.join(" ");
}

export interface StageProps {
  /** City id (launch cities get their own landmark scene). */
  cityId: string | null;
  scene: SceneKind;
  isDay: boolean;
  /** Pointer-driven interactions. Off for thumbnails. */
  interactive?: boolean;
}

/**
 * The full-screen animated backdrop. Sky, particles and fog live in screen space; the skyline, people,
 * sprouts and tornado live in a 1600x900 scene space that is bottom-anchored and scaled to cover the screen.
 */
export function Stage({ cityId, scene, isDay, interactive = true }: StageProps) {
  const city = useMemo(() => sceneForCity(cityId), [cityId]);
  const p = useMemo(() => paletteFor(scene, isDay), [scene, isDay]);
  const rootRef = useRef<HTMLDivElement>(null);
  const particles = useRef<ParticleHandle>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const [sunMode, setSunMode] = useState<SunMode>("idle");
  const [moonMode, setMoonMode] = useState<MoonMode>("idle");
  const [heated, setHeated] = useState(false);
  const [heroAnim, setHeroAnim] = useState<"shiver" | "zap" | null>(null);
  const [beam, setBeam] = useState<Beam | null>(null);
  const [sprouts, setSprouts] = useState<{ id: number; dx: number; scale: number }[]>([]);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [bolts, setBolts] = useState<Bolt[]>([]);
  const [shooting, setShooting] = useState<{ id: number; x: number; y: number } | null>(null);
  const [pokes, setPokes] = useState(0);
  const [tornadoX, setTornadoX] = useState(VB_W * 0.35);
  const nextId = useRef(1);
  const lastClick = useRef(0);
  const busy = useRef(false);
  const timers = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  // A change of weather, time of day or city resets every transient effect.
  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      timers.current = [];
      busy.current = false;
      setSunMode("idle");
      setMoonMode("idle");
      setHeated(false);
      setHeroAnim(null);
      setBeam(null);
      setSprouts([]);
      setBubbles([]);
      setBolts([]);
      setShooting(null);
    };
  }, [scene, isDay, cityId]);

  useEffect(() => {
    const el = rootRef.current!;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Cover-fit geometry: scale so the scene fills the screen, anchored to the bottom and centred on the city's focus.
  const geo = useMemo(() => {
    if (!size) return null;
    const s = Math.max(size.w / VB_W, size.h / VB_H);
    const vbW = size.w / s;
    const vbH = size.h / s;
    const x0 = clamp(city.focusX - vbW / 2, 0, Math.max(0, VB_W - vbW));
    const y0 = VB_H - vbH;
    return { s, vbW, vbH, x0, y0 };
  }, [size, city.focusX]);

  const toScene = useCallback((px: number, py: number) => (geo ? { x: geo.x0 + px / geo.s, y: geo.y0 + py / geo.s } : { x: 0, y: 0 }), [geo]);
  const toScreen = useCallback((x: number, y: number) => (geo ? { x: (x - geo.x0) * geo.s, y: (y - geo.y0) * geo.s } : { x: 0, y: 0 }), [geo]);
  const groundScreenY = useCallback(() => toScreen(0, city.groundY + 18).y, [toScreen, city.groundY]);

  // Fog parts around the pointer.
  useEffect(() => {
    if (scene !== "fog" || !interactive) return;
    const move = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el) return;
      el.style.setProperty("--mx", `${e.clientX}px`);
      el.style.setProperty("--my", `${e.clientY}px`);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [scene, interactive]);

  // The tornado drifts on its own unless you recently told it where to go.
  useEffect(() => {
    if (scene !== "tornado" || !geo) return;
    const { x0, vbW } = geo;
    const t = setInterval(() => {
      if (Date.now() - lastClick.current > 6000) setTornadoX(x0 + 120 + Math.random() * (vbW - 240));
    }, 3600);
    return () => clearInterval(t);
  }, [scene, geo]);

  const say = useCallback(
    (x: number, y: number, text: string) => {
      const id = nextId.current++;
      setBubbles((b) => [...b.slice(-3), { id, x, y, text }]);
      later(() => setBubbles((b) => b.filter((v) => v.id !== id)), 1700);
    },
    [later],
  );

  const strike = useCallback(
    (x: number) => {
      const id = nextId.current++;
      const ground = groundScreenY();
      const points = jagged(x, -10, ground, 70);
      const mid = points.split(" ")[4].split(",").map(Number);
      const branch = jagged(mid[0], mid[1], mid[1] + (ground - mid[1]) * 0.55, 90).replace(/^[^ ]+ /, `${mid[0]},${mid[1]} `);
      setBolts((b) => [...b, { id, x, points, branch }]);
      later(() => setBolts((b) => b.filter((v) => v.id !== id)), 900);
    },
    [groundScreenY, later],
  );

  // Thunderstorms flash on their own too.
  useEffect(() => {
    if (scene !== "storm" || !geo) return;
    let id: number;
    const schedule = () => {
      id = window.setTimeout(() => {
        strike(toScreen(geo.x0 + 100 + Math.random() * (geo.vbW - 200), 0).x);
        schedule();
      }, 3500 + Math.random() * 6500);
    };
    schedule();
    return () => clearTimeout(id);
  }, [scene, geo, strike, toScreen]);

  const heroCenter = city.hero ? { x: city.hero.box.x + city.hero.box.w / 2, y: city.hero.box.y + city.hero.box.h / 2 } : null;

  const onPointerDown = (e: React.PointerEvent) => {
    if (!interactive || !geo) return;
    const rect = rootRef.current!.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const v = toScene(px, py);
    const hero = city.hero;
    const hit = !!hero && inBox(v.x, v.y, hero.box, 14);
    lastClick.current = Date.now();

    switch (scene) {
      case "clear":
      case "partly": {
        if (!isDay) {
          if (busy.current) return;
          busy.current = true;
          setMoonMode("wink");
          setShooting({ id: nextId.current++, x: rect.width * (0.55 + Math.random() * 0.35), y: rect.height * (0.06 + Math.random() * 0.15) });
          later(() => {
            setMoonMode("idle");
            setShooting(null);
            busy.current = false;
          }, 1400);
          break;
        }
        if (busy.current) return;
        const sun = rootRef.current!.querySelector("[data-sun]")?.getBoundingClientRect();
        if (!sun) return;
        busy.current = true;
        const from = { x: sun.left - rect.left + sun.width / 2, y: sun.top - rect.top + sun.height / 2 };
        const to = heroCenter ? toScreen(heroCenter.x, heroCenter.y) : { x: px, y: py };
        setBeam({ id: nextId.current++, x1: from.x, y1: from.y, x2: to.x, y2: to.y });
        setSunMode("focus");
        if (hero) {
          setHeated(true);
          say(toScreen(hero.top.x, hero.top.y).x, toScreen(hero.top.x, hero.top.y).y - 30, `${hero.name} is getting toasty`);
        }
        later(() => {
          setBeam(null);
          setHeated(false);
          setSunMode("giggle");
          say(from.x, from.y - sun.height * 0.65, "hehehe!");
        }, 3200);
        later(() => {
          setSunMode("idle");
          busy.current = false;
        }, 5100);
        break;
      }
      case "rain":
      case "drizzle": {
        if (hit && hero) {
          setSprouts((s) => [...s.slice(-5), { id: nextId.current++, dx: (Math.random() - 0.5) * 90, scale: 0.9 + Math.random() * 0.5 }]);
          const top = toScreen(hero.top.x, hero.top.y);
          particles.current?.burst("water", top.x, top.y - 10);
          if (!sprouts.length) say(top.x, top.y - 40, "something's sprouting!");
        } else {
          particles.current?.burst("splash", px, py);
        }
        break;
      }
      case "snow": {
        if (hit && hero) {
          setHeroAnim("shiver");
          const top = toScreen(hero.top.x, hero.top.y);
          particles.current?.burst("snow", top.x, top.y + 6);
          say(top.x, top.y - 30, "brrr!");
          later(() => setHeroAnim(null), 950);
        } else {
          particles.current?.burst("snow", px, py);
        }
        break;
      }
      case "storm": {
        strike(px);
        if (hero && heroCenter && Math.abs(v.x - heroCenter.x) < hero.box.w) {
          setHeroAnim("zap");
          later(() => setHeroAnim(null), 850);
        }
        break;
      }
      case "tornado": {
        setTornadoX(clamp(v.x, geo.x0 + 60, geo.x0 + geo.vbW - 60));
        break;
      }
      case "cloudy": {
        setPokes((n) => n + 1);
        particles.current?.burst("water", px, clamp(py, 0, rect.height * 0.3));
        break;
      }
      case "fog": {
        say(px, py, "whoosh");
        break;
      }
    }
  };

  const leaning = scene === "tornado" && heroCenter && Math.abs(heroCenter.x - tornadoX) < 280;
  const heroClass = heated ? "hero--heated" : heroAnim === "shiver" ? "anim-shiver" : heroAnim === "zap" ? "anim-zap" : leaning ? "hero--lean" : "";
  const walkSeed = hash(cityId ?? "default");
  const snowy = scene === "snow";
  const heroTopY = Math.max(geo ? geo.y0 + 40 : 0, 60);
  const Skyline = city.Skyline;

  return (
    <div
      ref={rootRef}
      className="scene absolute inset-0 touch-none select-none overflow-hidden"
      onPointerDown={onPointerDown}
      data-scene={scene}
      data-day={isDay}
      data-city={cityId ?? ""}
    >
      <Sky p={p} sunMode={sunMode} moonMode={moonMode} pokes={pokes} />

      {geo && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox={`${geo.x0} ${geo.y0} ${geo.vbW} ${geo.vbH}`}
          preserveAspectRatio="none"
        >
          <PaletteContext.Provider value={p}>
            <SceneDefs p={p} />
            <g filter={snowy ? "url(#snowcap)" : undefined}>
              <Skyline p={p} heroClass={heroClass} />
            </g>
            {snowy && (
              <path
                d={`M-20 ${city.groundY + 6} q 40 -14 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 t 80 0 V 900 H -20 Z`}
                fill="#f3f8ff"
                opacity={0.96}
              />
            )}
            <Walkers p={p} y={city.walkY} accents={city.accents} seed={walkSeed} />
            {city.hero &&
              sprouts.map((s) => <Sprout key={s.id} x={city.hero!.base.x + s.dx} y={city.hero!.base.y} scale={s.scale} />)}
            {city.hero && heated && <HeatWaves x={city.hero.top.x} y={city.hero.top.y + 4} w={city.hero.box.w * 0.7} />}
            {scene === "tornado" && <Tornado x={tornadoX} groundY={city.groundY + 20} topY={heroTopY} p={p} />}
          </PaletteContext.Provider>
        </svg>
      )}

      <ParticleCanvas ref={particles} scene={scene} getGroundY={groundScreenY} />
      {scene === "fog" && <Fog p={p} />}

      {/* screen-space effects */}
      <svg className="pointer-events-none absolute inset-0 z-30 h-full w-full overflow-visible">
        <defs>
          <linearGradient id="beam-grad" gradientUnits="userSpaceOnUse" x1={beam?.x1 ?? 0} y1={beam?.y1 ?? 0} x2={beam?.x2 ?? 0} y2={beam?.y2 ?? 0}>
            <stop offset="0" stopColor="#fff3b0" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffd45e" stopOpacity="0.55" />
          </linearGradient>
          <filter id="bolt-glow" x="-50%" y="-10%" width="200%" height="120%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {beam && (() => {
          const dx = beam.x2 - beam.x1;
          const dy = beam.y2 - beam.y1;
          const len = Math.hypot(dx, dy) || 1;
          const nx = -dy / len;
          const ny = dx / len;
          const half = 34;
          return (
            <g key={beam.id} style={{ animation: "flash-in 0.5s ease-out both" }}>
              <polygon
                points={`${beam.x1 + nx * 8},${beam.y1 + ny * 8} ${beam.x2 + nx * half},${beam.y2 + ny * half} ${beam.x2 - nx * half},${beam.y2 - ny * half} ${beam.x1 - nx * 8},${beam.y1 - ny * 8}`}
                fill="url(#beam-grad)"
              />
              <circle cx={beam.x2} cy={beam.y2} r={half * 1.5} fill="#ffd45e" opacity={0.28} />
            </g>
          );
        })()}
        {bolts.map((b) => (
          <g key={b.id} style={{ animation: "bolt 0.8s linear forwards" }} filter="url(#bolt-glow)">
            <polyline points={b.points} fill="none" stroke="#fffbe0" strokeWidth={3.5} strokeLinejoin="round" />
            <polyline points={b.branch} fill="none" stroke="#fffbe0" strokeWidth={2} strokeLinejoin="round" />
          </g>
        ))}
        {shooting && (
          <g key={shooting.id} className="anim" style={{ animation: "shoot 1.1s ease-in forwards" }}>
            <line x1={shooting.x} y1={shooting.y} x2={shooting.x + 70} y2={shooting.y - 40} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={0.9} />
            <circle cx={shooting.x} cy={shooting.y} r={3} fill="#fff" />
          </g>
        )}
      </svg>
      {bolts.map((b) => (
        <div key={`f${b.id}`} className="pointer-events-none absolute inset-0 z-30 bg-white" style={{ animation: "flash 0.8s ease-out forwards", opacity: 0 }} />
      ))}
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="pointer-events-none absolute z-40 whitespace-nowrap rounded-full bg-white/95 px-3.5 py-1.5 text-sm font-medium text-slate-800 shadow-lg"
          style={{ left: b.x, top: b.y, animation: "pop 1.7s ease-out forwards" }}
        >
          {b.text}
        </div>
      ))}
    </div>
  );
}
