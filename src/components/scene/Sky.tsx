"use client";

import { useEffect, useMemo, useRef } from "react";
import { rng } from "./parts";
import type { Palette } from "./palette";
import type { SceneKind } from "@/lib/weather";

export type SunMode = "idle" | "focus" | "giggle";
export type MoonMode = "idle" | "wink";

const CLOUD_COUNT: Record<SceneKind, number> = {
  clear: 0, partly: 4, cloudy: 7, fog: 3, drizzle: 7, rain: 8, snow: 6, storm: 9, tornado: 10,
};

/** Track the pointer and nudge the pupils inside `faceRef` toward it. */
function useGaze(rootRef: React.RefObject<HTMLElement | null>, pupilsRef: React.RefObject<SVGGElement | null>, faceRef: React.RefObject<SVGGElement | null>) {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el || !pupilsRef.current) return;
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 260);
      pupilsRef.current.style.transform = `translate(${(dx / d) * 3.4 * k}px, ${(dy / d) * 3.4 * k}px)`;
      if (faceRef.current) faceRef.current.style.transform = `translate(${(dx / d) * 5 * k}px, ${(dy / d) * 4 * k}px)`;
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, [rootRef, pupilsRef, faceRef]);
}

function Sun({ mode }: { mode: SunMode }) {
  const root = useRef<HTMLDivElement>(null);
  const pupils = useRef<SVGGElement>(null);
  const face = useRef<SVGGElement>(null);
  useGaze(root, pupils, face);
  const rays = Array.from({ length: 14 });
  return (
    <div
      ref={root}
      data-sun
      className={`absolute z-0 ${mode === "giggle" ? "anim anim-giggle" : ""}`}
      style={{ left: "12%", top: "13%", width: "clamp(110px, 17vmin, 190px)", aspectRatio: "1" }}
    >
      <svg viewBox="-100 -100 200 200" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="sun-glow">
            <stop offset="0.3" stopColor="#ffe27a" stopOpacity="0.7" />
            <stop offset="1" stopColor="#ffe27a" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="sun-disc" cx="0.4" cy="0.35">
            <stop offset="0" stopColor="#fff2a8" />
            <stop offset="1" stopColor="#ffc531" />
          </radialGradient>
        </defs>
        <circle r="150" fill="url(#sun-glow)" opacity={mode === "focus" ? 1 : 0.8} />
        <g>
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="40s" repeatCount="indefinite" />
          {rays.map((_, i) => (
            <rect key={i} x="-3.5" y="-84" width="7" height={mode === "focus" ? 22 : 15} rx="3.5" fill="#ffc531" transform={`rotate(${(i * 360) / rays.length})`} />
          ))}
        </g>
        <circle r="56" fill="url(#sun-disc)" />
        <g ref={face} style={{ transition: "transform 0.12s ease-out" }}>
          <circle cx="-30" cy="12" r="7" fill="#ff8a65" opacity={mode === "giggle" ? 0.7 : 0.4} />
          <circle cx="30" cy="12" r="7" fill="#ff8a65" opacity={mode === "giggle" ? 0.7 : 0.4} />
          {mode === "giggle" ? (
            <g stroke="#7a3b00" strokeWidth="4.5" strokeLinecap="round" fill="none">
              <path d="M-27 -6 q 8 -10 16 0" />
              <path d="M11 -6 q 8 -10 16 0" />
            </g>
          ) : (
            <>
              <circle cx="-19" cy="-5" r="9.5" fill="#fff" />
              <circle cx="19" cy="-5" r="9.5" fill="#fff" />
              <g ref={pupils} style={{ transition: "transform 0.08s linear" }}>
                <circle cx="-19" cy="-5" r="4.6" fill="#3b2200" />
                <circle cx="19" cy="-5" r="4.6" fill="#3b2200" />
              </g>
              {mode === "focus" && (
                <g stroke="#7a3b00" strokeWidth="4" strokeLinecap="round">
                  <path d="M-30 -20 L-10 -13" />
                  <path d="M30 -20 L10 -13" />
                </g>
              )}
            </>
          )}
          {mode === "giggle" ? (
            <path d="M-17 14 Q0 40 17 14 Z" fill="#7a3b00" />
          ) : mode === "focus" ? (
            <ellipse cx="0" cy="22" rx="5" ry="4" fill="#7a3b00" />
          ) : (
            <path d="M-15 16 Q0 29 15 16" stroke="#7a3b00" strokeWidth="4.5" strokeLinecap="round" fill="none" />
          )}
        </g>
      </svg>
    </div>
  );
}

function Moon({ mode }: { mode: MoonMode }) {
  const root = useRef<HTMLDivElement>(null);
  const pupils = useRef<SVGGElement>(null);
  const face = useRef<SVGGElement>(null);
  useGaze(root, pupils, face);
  return (
    <div
      ref={root}
      data-sun
      className="absolute z-0"
      style={{ left: "12%", top: "13%", width: "clamp(90px, 14vmin, 160px)", aspectRatio: "1" }}
    >
      <svg viewBox="-100 -100 200 200" className="h-full w-full overflow-visible">
        <defs>
          <radialGradient id="moon-glow">
            <stop offset="0.35" stopColor="#dfe6ff" stopOpacity="0.35" />
            <stop offset="1" stopColor="#dfe6ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="140" fill="url(#moon-glow)" />
        <circle r="62" fill="#f4f0d9" />
        <circle cx="-34" cy="-30" r="10" fill="#e3ddbb" />
        <circle cx="36" cy="30" r="14" fill="#e3ddbb" />
        <circle cx="38" cy="-34" r="6" fill="#e3ddbb" />
        <g ref={face} style={{ transition: "transform 0.2s ease-out" }}>
          <circle cx="-22" cy="4" r="8.5" fill="#fff" />
          <g
            className="anim"
            style={{ transformOrigin: "50% 50%", animation: mode === "wink" ? "wink 0.6s ease-in-out" : undefined }}
            key={mode}
          >
            <circle cx="22" cy="4" r="8.5" fill="#fff" />
          </g>
          <g ref={pupils} style={{ transition: "transform 0.15s linear" }}>
            <circle cx="-22" cy="4" r="4.2" fill="#2b2f55" />
            <circle cx="22" cy="4" r="4.2" fill="#2b2f55" />
          </g>
          {/* sleepy lids */}
          <path d="M-31 4 a9 9 0 0 1 18 0 z" fill="#f4f0d9" />
          <path d="M13 4 a9 9 0 0 1 18 0 z" fill="#f4f0d9" />
          <path d="M-12 24 Q0 32 12 24" stroke="#5d5a47" strokeWidth="3.5" strokeLinecap="round" fill="none" />
          <circle cx="-34" cy="18" r="6" fill="#f5b5b5" opacity="0.5" />
          <circle cx="34" cy="18" r="6" fill="#f5b5b5" opacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

function Stars({ count }: { count: number }) {
  const stars = useMemo(() => {
    const r = rng(77);
    return Array.from({ length: 80 }, () => ({ x: r() * 100, y: r() * 62, s: 1 + r() * 2.2, d: 2 + r() * 4, o: r() * 4 }));
  }, []);
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {stars.slice(0, count).map((s, i) => (
        <span
          key={i}
          className="anim absolute rounded-full bg-white"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animation: `twinkle ${s.d}s ease-in-out ${s.o}s infinite` }}
        />
      ))}
    </div>
  );
}

function Cloud({ p, i, poke }: { p: Palette; i: number; poke: number }) {
  const r = rng(i * 131 + 7);
  const heavy = p.scene === "rain" || p.scene === "storm" || p.scene === "tornado" || p.scene === "drizzle";
  const top = 2 + r() * (heavy ? 24 : 34);
  const scale = (heavy ? 1.3 : 0.8) + r() * 1.1;
  const dur = 110 + r() * 160;
  return (
    <div
      className="pointer-events-none absolute left-0 z-0"
      style={{ top: `${top}%`, animation: `drift ${dur}s linear infinite`, animationDelay: `-${r() * dur}s`, opacity: p.scene === "fog" ? 0.7 : 0.95 }}
    >
      <svg
        viewBox="0 0 200 90"
        width={200 * scale}
        height={90 * scale}
        className={poke > 0 ? "anim anim-squish" : ""}
        key={poke}
        style={{ filter: heavy ? "drop-shadow(0 8px 14px rgba(0,0,0,0.25))" : undefined }}
      >
        <g fill={p.cloudShade}>
          <rect x="22" y="48" width="156" height="28" rx="14" />
        </g>
        <g fill={p.cloud}>
          <circle cx="62" cy="52" r="26" />
          <circle cx="98" cy="38" r="34" />
          <circle cx="142" cy="52" r="26" />
          <rect x="28" y="50" width="146" height="24" rx="12" />
        </g>
      </svg>
    </div>
  );
}

export function Sky({ p, sunMode, moonMode, pokes }: { p: Palette; sunMode: SunMode; moonMode: MoonMode; pokes: number }) {
  const { scene, isDay } = p;
  const clouds = CLOUD_COUNT[scene];
  const showSun = isDay && (scene === "clear" || scene === "partly");
  const showMoon = !isDay && (scene === "clear" || scene === "partly");
  const stars = !isDay ? (scene === "clear" ? 80 : scene === "partly" ? 40 : scene === "fog" ? 12 : 0) : 0;
  const gloom = scene === "rain" || scene === "storm" || scene === "tornado" || scene === "drizzle";
  const pokedCloud = clouds ? pokes % clouds : -1;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ background: `linear-gradient(to bottom, ${p.skyTop}, ${p.skyBottom})`, transition: "background 1.2s ease" }}>
      {stars > 0 && <Stars count={stars} />}
      {showSun && <Sun mode={sunMode} />}
      {showMoon && <Moon mode={moonMode} />}
      {Array.from({ length: clouds }).map((_, i) => (
        <Cloud key={`${scene}-${i}`} p={p} i={i} poke={i === pokedCloud ? pokes : 0} />
      ))}
      {gloom && (
        <div
          className="absolute inset-0"
          style={{ background: `radial-gradient(ellipse at 50% 40%, transparent 30%, rgba(5,8,20,${scene === "drizzle" ? 0.25 : 0.45}) 100%)` }}
        />
      )}
    </div>
  );
}

/** Mist that parts around the pointer. Sits above the skyline. */
export function Fog({ p }: { p: Palette }) {
  const mask = "radial-gradient(circle clamp(120px, 18vmin, 220px) at var(--mx, 50%) var(--my, 60%), rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.9) 100%)";
  return (
    <div className="pointer-events-none absolute inset-0 z-20" style={{ WebkitMaskImage: mask, maskImage: mask }}>
      {[
        { top: "20%", h: "26%", d: 38, o: 0.6 },
        { top: "42%", h: "30%", d: 52, o: 0.75 },
        { top: "66%", h: "34%", d: 44, o: 0.85 },
      ].map((b, i) => (
        <div
          key={i}
          className="anim absolute -inset-x-[10%]"
          style={{
            top: b.top,
            height: b.h,
            background: `linear-gradient(to bottom, transparent, ${p.fog} 45%, ${p.fog} 60%, transparent)`,
            opacity: b.o,
            filter: "blur(14px)",
            animation: `fog-drift ${b.d}s ease-in-out ${i % 2 ? "" : "-8s"} infinite alternate`,
          }}
        />
      ))}
    </div>
  );
}
