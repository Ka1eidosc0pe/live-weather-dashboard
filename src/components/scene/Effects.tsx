"use client";

import { mix } from "./palette";
import type { Palette } from "./palette";

/** Sprout that grows from the hero's base when it rains on it. Scene-space (1600x900) coordinates. */
export function Sprout({ x, y, scale }: { x: number; y: number; scale: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={1} rx={11} ry={3} fill="#3b2a1a" opacity={0.55} />
      <path
        d="M0 0 C -5 -16 6 -30 0 -48"
        stroke="#4caf50"
        strokeWidth={4.5}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={60}
        style={{ ["--len" as string]: 60, animation: "grow 1.3s ease-out forwards" }}
      />
      <g transform="translate(0 -44)">
        <g>
          <animateTransform attributeName="transform" type="scale" from="0" to="1" begin="1s" dur="0.6s" fill="freeze" calcMode="spline" keySplines="0.2 0.8 0.3 1" keyTimes="0;1" />
          <ellipse cx={-11} cy={-2} rx={11} ry={5.5} transform="rotate(-28 -11 -2)" fill="#66bb6a" />
          <ellipse cx={11} cy={-8} rx={12} ry={6} transform="rotate(26 11 -8)" fill="#81c784" />
        </g>
      </g>
    </g>
  );
}

/** Rising heat waves over the hero while the sun focuses on it. */
export function HeatWaves({ x, y, w }: { x: number; y: number; w: number }) {
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => (
        <path
          key={i}
          className="anim"
          d="M0 0 q 5 -7 0 -14 t 0 -14"
          stroke="#ffb15c"
          strokeWidth={3}
          fill="none"
          strokeLinecap="round"
          transform={`translate(${x - w / 2 + (w / 4) * i} ${y})`}
          style={{ animation: "heat-rise 1.3s ease-out infinite", animationDelay: `${i * 0.25}s` }}
        />
      ))}
    </g>
  );
}

/** Funnel cloud with orbiting debris. `x` is where it stands; the CSS transition makes it travel there. */
export function Tornado({ x, groundY, topY, p }: { x: number; groundY: number; topY: number; p: Palette }) {
  const layers = 40;
  const dark = mix(p.cloudShade, "#10141c", 0.35);
  const light = mix(p.cloud, "#5a6470", 0.2);
  const height = groundY - topY;
  const half = (t: number) => 12 + 150 * Math.pow(1 - t, 1.55);
  return (
    <g style={{ transform: `translateX(${x}px)`, transition: "transform 2.8s cubic-bezier(0.45, 0.05, 0.4, 1)" }}>
      {Array.from({ length: layers }).map((_, i) => {
        const t = i / (layers - 1);
        const y = topY + t * height;
        const rx = half(t);
        return (
          <g key={i} className="anim" style={{ animation: `sway ${1.4 + (i % 5) * 0.18}s ease-in-out infinite`, animationDelay: `-${i * 0.06}s` }}>
            <ellipse cx={0} cy={y} rx={rx} ry={rx * 0.12 + (height / layers) * 0.8} fill={i % 2 ? dark : light} opacity={0.9} />
            <ellipse cx={-rx * 0.28} cy={y - 1} rx={rx * 0.45} ry={rx * 0.06 + 1.5} fill="#fff" opacity={0.08} />
          </g>
        );
      })}
      {/* dust skirt */}
      <ellipse cx={0} cy={groundY + 4} rx={110} ry={20} fill={mix(p.ground, "#8a7a62", 0.3)} opacity={0.6} />
      {[0.35, 0.55, 0.72, 0.85, 0.92, 0.6, 0.78, 0.45].map((t, i) => (
        <g key={i} transform={`translate(0 ${topY + t * height})`}>
          <g>
            <animateTransform attributeName="transform" type="rotate" from={i % 2 ? "360" : "0"} to={i % 2 ? "0" : "360"} dur={`${1.1 + (i % 4) * 0.3}s`} repeatCount="indefinite" />
            <rect x={half(t) * 0.8} y={-3} width={7 + (i % 3) * 3} height={4} rx={1} fill={i % 3 === 0 ? "#6d4c2f" : "#2d2a26"} />
          </g>
        </g>
      ))}
    </g>
  );
}
