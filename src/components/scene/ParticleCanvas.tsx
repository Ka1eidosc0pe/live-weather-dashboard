"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import type { SceneKind } from "@/lib/weather";

export type BurstKind = "water" | "snow" | "splash";
export interface ParticleHandle {
  burst: (kind: BurstKind, x: number, y: number) => void;
}

interface Drop { x: number; y: number; vy: number; vx: number; len: number; stop: number; z: number }
interface Flake { x: number; y: number; r: number; vy: number; ph: number; z: number }
interface Bit { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; color: string; g: number }

// Fall speeds in px/s, particles per 1M px of screen, horizontal wind in px/s.
const RAIN: Partial<Record<SceneKind, { density: number; speed: number; wind: number; alpha: number }>> = {
  drizzle: { density: 70, speed: 620, wind: 60, alpha: 0.35 },
  rain: { density: 190, speed: 1000, wind: 120, alpha: 0.5 },
  storm: { density: 280, speed: 1250, wind: 260, alpha: 0.55 },
  tornado: { density: 260, speed: 1100, wind: 520, alpha: 0.55 },
};

/** Screen-space canvas for rain, snow and the little bursts clicks make. Never intercepts the pointer. */
export function ParticleCanvas({
  scene,
  getGroundY,
  ref,
}: {
  scene: SceneKind;
  /** Screen y where the street is; rain splashes there. */
  getGroundY: () => number;
  ref?: Ref<ParticleHandle>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bits = useRef<Bit[]>([]);
  const groundRef = useRef(getGroundY);
  useEffect(() => {
    groundRef.current = getGroundY;
  }, [getGroundY]);

  useImperativeHandle(ref, () => ({
    burst(kind, x, y) {
      const out = bits.current;
      const n = kind === "snow" ? 26 : kind === "water" ? 16 : 7;
      for (let i = 0; i < n; i++) {
        const a = kind === "splash" ? -Math.PI / 2 + (Math.random() - 0.5) * 2 : Math.random() * Math.PI * 2;
        const v = kind === "splash" ? 80 + Math.random() * 120 : 60 + Math.random() * 160;
        out.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: kind === "water" ? Math.abs(Math.sin(a)) * v * 0.6 + 40 : Math.sin(a) * v - (kind === "snow" ? 40 : 0),
          life: 0,
          max: kind === "snow" ? 1.1 + Math.random() * 0.6 : 0.5 + Math.random() * 0.4,
          r: kind === "snow" ? 2.5 + Math.random() * 3 : 1.6 + Math.random() * 1.4,
          color: kind === "snow" ? "255,255,255" : "190,225,255",
          g: kind === "snow" ? 120 : 520,
        });
      }
    },
  }));

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let drops: Drop[] = [];
    let flakes: Flake[] = [];
    const rain = RAIN[scene];

    const spawnDrop = (fromTop: boolean): Drop => {
      const z = 0.55 + Math.random() * 0.6;
      const ground = groundRef.current();
      return {
        x: Math.random() * (w + 300) - 150,
        y: fromTop ? -Math.random() * 60 : Math.random() * h,
        vy: (rain?.speed ?? 1000) * z,
        vx: (rain?.wind ?? 0) * z,
        len: 10 + Math.random() * 12 * z,
        stop: ground + Math.random() * Math.max(10, h - ground - 8),
        z,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const area = (w * h) / 1e6;
      const dropCount = rain ? Math.round(rain.density * area * (reduced ? 0.4 : 1)) : 0;
      drops = Array.from({ length: dropCount }, () => spawnDrop(false));
      const flakeCount = scene === "snow" ? Math.round(170 * area * (reduced ? 0.4 : 1)) : 0;
      flakes = Array.from({ length: flakeCount }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 1.2 + Math.random() * 3,
        vy: 25 + Math.random() * 55,
        ph: Math.random() * Math.PI * 2,
        z: 0.5 + Math.random() * 0.8,
      }));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const splashes: { x: number; y: number; age: number }[] = [];

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, w, h);

      if (rain) {
        ctx.lineCap = "round";
        for (const bucket of [0, 1]) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(205,225,255,${bucket ? rain.alpha : rain.alpha * 0.6})`;
          ctx.lineWidth = bucket ? 1.5 : 1;
          for (const d of drops) {
            if ((d.z > 0.85 ? 1 : 0) !== bucket) continue;
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d.x - (d.vx / d.vy) * d.len, d.y - d.len);
          }
          ctx.stroke();
        }
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          d.y += d.vy * dt;
          d.x += d.vx * dt;
          if (d.y >= d.stop) {
            if (!reduced && Math.random() < 0.5) splashes.push({ x: d.x, y: d.stop, age: 0 });
            drops[i] = spawnDrop(true);
          }
        }
        ctx.strokeStyle = "rgba(220,235,255,0.5)";
        ctx.lineWidth = 1;
        for (let i = splashes.length - 1; i >= 0; i--) {
          const s = splashes[i];
          s.age += dt;
          if (s.age > 0.35) {
            splashes.splice(i, 1);
            continue;
          }
          const k = s.age / 0.35;
          ctx.globalAlpha = 1 - k;
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, 2 + k * 9, 1 + k * 3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      if (flakes.length) {
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        for (const f of flakes) {
          f.ph += dt * (0.8 + f.z);
          f.y += f.vy * f.z * dt;
          f.x += Math.sin(f.ph) * 22 * dt + 8 * dt;
          if (f.y > h + 6) {
            f.y = -6;
            f.x = Math.random() * w;
          }
          if (f.x > w + 6) f.x = -6;
          ctx.moveTo(f.x + f.r * f.z, f.y);
          ctx.arc(f.x, f.y, f.r * f.z, 0, Math.PI * 2);
        }
        ctx.fill();
      }

      const out = bits.current;
      for (let i = out.length - 1; i >= 0; i--) {
        const b = out[i];
        b.life += dt;
        if (b.life > b.max) {
          out.splice(i, 1);
          continue;
        }
        b.vy += b.g * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        ctx.fillStyle = `rgba(${b.color},${1 - b.life / b.max})`;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [scene]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 z-10 h-full w-full" />;
}
