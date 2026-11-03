"use client";

import { createContext, useContext, type ReactNode } from "react";
import { mix, type Palette } from "./palette";
import { VB_W } from "./types";

// ---------------------------------------------------------------------------
// Shared drawing helpers for the city skylines.
// ---------------------------------------------------------------------------

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export const PaletteContext = createContext<Palette | null>(null);
export function usePalette(): Palette {
  const p = useContext(PaletteContext);
  if (!p) throw new Error("usePalette outside <PaletteContext>");
  return p;
}

/** Filters and patterns referenced by id across the scene SVGs. */
export function SceneDefs({ p }: { p: Palette }) {
  return (
    <defs>
      <pattern id="windows" width="10" height="14" patternUnits="userSpaceOnUse">
        <rect x="2.5" y="4" width="4" height="6" rx="0.6" fill={p.window} />
      </pattern>
      {/* Snow caps: the top edge of every shape in the group turns white. */}
      <filter id="snowcap" filterUnits="userSpaceOnUse" x="-100" y="-100" width="1800" height="1100" colorInterpolationFilters="sRGB">
        <feOffset in="SourceAlpha" dy="7" result="shifted" />
        <feComposite in="SourceAlpha" in2="shifted" operator="out" result="edge" />
        <feTurbulence type="fractalNoise" baseFrequency="0.09" numOctaves="2" seed="4" result="noise" />
        <feDisplacementMap in="edge" in2="noise" scale="7" result="ragged" />
        <feFlood floodColor="#ffffff" floodOpacity="0.96" />
        <feComposite in2="ragged" operator="in" result="snow" />
        <feMerge>
          <feMergeNode in="SourceGraphic" />
          <feMergeNode in="snow" />
        </feMerge>
      </filter>
      {/* Heat: warm glow plus a wobbling shimmer. */}
      <filter id="heated" x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feTurbulence type="turbulence" baseFrequency="0.012 0.05" numOctaves="1" result="t">
          <animate attributeName="baseFrequency" dur="1.2s" values="0.012 0.05;0.016 0.07;0.012 0.05" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="t" scale="5" result="wobble" />
        <feColorMatrix in="wobble" type="matrix" values="1.15 0.12 0 0 0.06  0 0.95 0 0 0.02  0 0 0.55 0 0  0 0 0 1 0" result="warm" />
        <feGaussianBlur in="warm" stdDeviation="9" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="0 0 0 0 1  0 0 0 0 0.62  0 0 0 0 0.2  0 0 0 0.9 0" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="warm" />
        </feMerge>
      </filter>
      <linearGradient id="water-sheen" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.28" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

/** A building: flat block with an optional lit-window overlay (visible at night). */
export function Block({
  x,
  y,
  w,
  h,
  fill,
  windows = true,
  rx = 0,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  windows?: boolean;
  rx?: number;
}) {
  const p = usePalette();
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} rx={rx} />
      {windows && <rect x={x} y={y + 3} width={w} height={h - 3} fill="url(#windows)" opacity={p.windowOpacity} />}
    </g>
  );
}

/** A deterministic row of generic buildings standing on `baseY`; used for the distant skyline layers. */
export function Row({
  seed,
  baseY,
  minH,
  maxH,
  minW = 46,
  maxW = 90,
  fill,
  gap = 4,
  from = -40,
  to = VB_W + 40,
  windows = true,
}: {
  seed: number;
  baseY: number;
  minH: number;
  maxH: number;
  minW?: number;
  maxW?: number;
  fill: string;
  gap?: number;
  from?: number;
  to?: number;
  windows?: boolean;
}) {
  const r = rng(seed);
  const out: ReactNode[] = [];
  let x = from;
  let i = 0;
  while (x < to) {
    const w = minW + r() * (maxW - minW);
    const h = minH + r() * (maxH - minH);
    out.push(<Block key={i++} x={x} y={baseY - h} w={w} h={h + 2} fill={fill} windows={windows} />);
    if (r() > 0.78) out.push(<rect key={i++} x={x + w / 2 - 1.5} y={baseY - h - 18} width={3} height={18} fill={fill} />);
    x += w + gap * (0.5 + r());
  }
  return <>{out}</>;
}

export function Tree({ x, y, s = 1, fill }: { x: number; y: number; s?: number; fill?: string }) {
  const p = usePalette();
  const leaf = fill ?? mix(p.near, "#3f8a55", p.isDay ? 0.55 : 0.2);
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-2} y={-26} width={4} height={26} fill={p.ink} opacity={0.7} />
      <circle cx={0} cy={-38} r={16} fill={leaf} />
      <circle cx={-9} cy={-30} r={10} fill={leaf} />
      <circle cx={9} cy={-31} r={11} fill={leaf} />
    </g>
  );
}

/** Animated water band (rivers, bays, the lake). */
export function Water({ x = 0, y, w = VB_W, h, p }: { x?: number; y: number; w?: number; h: number; p: Palette }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={p.water} />
      <rect x={x} y={y} width={w} height={h} fill="url(#water-sheen)" />
      <g className="anim anim-wave" opacity={0.35}>
        {Array.from({ length: Math.ceil(w / 80) + 2 }).map((_, i) =>
          [0.28, 0.62, 0.86].map((f, k) => (
            <path
              key={`${i}-${k}`}
              d={`M${x + i * 80 + k * 23} ${y + h * f} q 10 -5 20 0 t 20 0`}
              stroke="#fff"
              strokeWidth={1.6}
              fill="none"
              strokeLinecap="round"
            />
          )),
        )}
      </g>
    </g>
  );
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

const SKIN = ["#f1c9a5", "#d9a273", "#a8744f", "#7b5239", "#f5d5b8"];

function Person({ p, cloth, skin, seed }: { p: Palette; cloth: string; skin: string; seed: number }) {
  const scene = p.scene;
  const wet = scene === "rain" || scene === "drizzle" || scene === "storm";
  const cold = scene === "snow";
  const hot = scene === "clear" && p.isDay;
  const pants = mix(p.ink, cloth, 0.25);
  return (
    <g>
      <g className="anim" style={{ animation: "bob 0.5s ease-in-out infinite" }}>
        <rect
          className="anim"
          x={-4.5}
          y={-15}
          width={4}
          height={15}
          rx={2}
          fill={pants}
          style={{ transformOrigin: "50% 0%", animation: "leg 0.55s ease-in-out infinite alternate", animationDelay: `${(seed % 5) * 0.07}s` }}
        />
        <rect
          className="anim"
          x={0.5}
          y={-15}
          width={4}
          height={15}
          rx={2}
          fill={pants}
          style={{ transformOrigin: "50% 0%", animation: "leg 0.55s ease-in-out infinite alternate-reverse", animationDelay: `${(seed % 5) * 0.07}s` }}
        />
        <rect x={-6.5} y={-33} width={13} height={20} rx={5.5} fill={cloth} />
        {cold && <rect x={-6} y={-35} width={12} height={4} rx={2} fill="#e5484d" />}
        <circle cx={0} cy={-39} r={5.6} fill={skin} />
        {cold && <path d="M-6 -41 a6 6 0 0 1 12 0 z" fill="#e5484d" />}
        {hot && <rect x={0.5} y={-40.5} width={5.5} height={2} rx={1} fill={p.ink} />}
        {cold && (
          <g>
            <rect x={5} y={-27} width={5.5} height={6.5} rx={1.2} fill="#f5efe6" />
            <rect x={5} y={-27} width={5.5} height={2} fill="#6b3f2a" />
            {[0, 1].map((i) => (
              <path
                key={i}
                className="anim"
                d={`M${6.2 + i * 2.6} -29 q 1.5 -2 0 -4`}
                stroke="#fff"
                strokeWidth={0.9}
                fill="none"
                strokeLinecap="round"
                style={{ animation: "steam 1.6s ease-out infinite", animationDelay: `${i * 0.5}s` }}
              />
            ))}
          </g>
        )}
        {wet && (
          <g>
            <line x1={0} y1={-55} x2={0} y2={-31} stroke={p.ink} strokeWidth={1.2} />
            <path d="M-19 -50 Q0 -70 19 -50 Q9.5 -54 0 -50 Q-9.5 -54 -19 -50 Z" fill={cloth === "#f4b942" ? "#e5484d" : mix(cloth, "#000", 0.1)} />
          </g>
        )}
      </g>
    </g>
  );
}

export function Walkers({ p, y, accents, seed }: { p: Palette; y: number; accents: string[]; seed: number }) {
  const counts: Record<Palette["scene"], number> = {
    clear: 6, partly: 5, cloudy: 4, fog: 3, drizzle: 4, rain: 4, snow: 6, storm: 2, tornado: 0,
  };
  const n = Math.max(0, counts[p.scene] - (p.isDay ? 0 : 2));
  const r = rng(seed);
  return (
    <g className="walkers">
      {Array.from({ length: n }).map((_, i) => {
        const scale = 1.05 + r() * 0.5;
        const dur = 34 + r() * 40;
        const rev = r() > 0.5;
        const lane = y + (r() - 0.5) * 22 + scale * 6;
        return (
          <g
            key={`${p.scene}-${i}`}
            className="walker anim"
            style={{ animation: `${rev ? "walk-rev" : "walk"} ${dur}s linear infinite`, animationDelay: `-${r() * dur}s` }}
          >
            <g transform={`translate(0 ${lane}) scale(${rev ? -scale : scale} ${scale})`}>
              <Person p={p} cloth={accents[i % accents.length]} skin={SKIN[Math.floor(r() * SKIN.length)]} seed={i + seed} />
            </g>
          </g>
        );
      })}
    </g>
  );
}
