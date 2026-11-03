import type { SceneKind } from "@/lib/weather";

export interface Palette {
  isDay: boolean;
  scene: SceneKind;
  skyTop: string;
  skyBottom: string;
  far: string;
  mid: string;
  near: string;
  ground: string;
  water: string;
  window: string;
  windowOpacity: number;
  cloud: string;
  cloudShade: string;
  fog: string;
  ink: string; // dark detail colour (people, cables, outlines)
}

type RGB = [number, number, number];
const toRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const toHex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

export function mix(a: string, b: string, t: number): string {
  const [x, y] = [toRgb(a), toRgb(b)];
  return toHex([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

const DAY = {
  skyTop: "#3f9cf0",
  skyBottom: "#dcf2ff",
  far: "#b3cde5",
  mid: "#86a9ca",
  near: "#5d83a8",
  ground: "#3e5b79",
  water: "#7fbbe6",
  ink: "#1f2d3d",
};
const NIGHT = {
  skyTop: "#050a22",
  skyBottom: "#2b3570",
  far: "#1c2452",
  mid: "#141b40",
  near: "#0d1331",
  ground: "#080c22",
  water: "#141f4d",
  ink: "#05081a",
};

// gray: desaturate toward overcast, dark: sink toward storm, light: wash toward snow/fog.
const TINT: Record<SceneKind, { gray: number; dark: number; light: number; green?: number }> = {
  clear: { gray: 0, dark: 0, light: 0 },
  partly: { gray: 0.15, dark: 0, light: 0 },
  cloudy: { gray: 0.55, dark: 0.08, light: 0 },
  fog: { gray: 0.5, dark: 0, light: 0.35 },
  drizzle: { gray: 0.62, dark: 0.18, light: 0 },
  rain: { gray: 0.75, dark: 0.34, light: 0 },
  snow: { gray: 0.45, dark: 0, light: 0.42 },
  storm: { gray: 0.85, dark: 0.5, light: 0 },
  tornado: { gray: 0.8, dark: 0.55, light: 0, green: 0.22 },
};

export function paletteFor(scene: SceneKind, isDay: boolean): Palette {
  const base = isDay ? DAY : NIGHT;
  const t = TINT[scene];
  const grayTarget = isDay ? "#8b97a6" : "#232842";
  const darkTarget = isDay ? "#1a2230" : "#02040c";
  const tint = (c: string, k = 1) => {
    let out = mix(c, grayTarget, t.gray * k);
    if (t.green) out = mix(out, "#4f6b4a", t.green * k);
    out = mix(out, darkTarget, t.dark * k);
    return mix(out, "#ffffff", t.light * k * (isDay ? 1 : 0.35));
  };
  const cloudBase = isDay ? "#ffffff" : "#6c7aa8";
  return {
    isDay,
    scene,
    skyTop: tint(base.skyTop),
    skyBottom: tint(base.skyBottom),
    far: tint(base.far, 0.8),
    mid: tint(base.mid, 0.8),
    near: tint(base.near, 0.8),
    ground: tint(base.ground, 0.7),
    water: tint(base.water, 0.8),
    window: isDay ? "#ffffff" : "#ffd98a",
    windowOpacity: isDay ? 0.1 : scene === "rain" || scene === "storm" || scene === "tornado" ? 0.95 : 0.8,
    cloud: mix(cloudBase, grayTarget, t.gray * 0.9),
    cloudShade: mix(mix(cloudBase, grayTarget, t.gray), darkTarget, 0.25 + t.dark * 0.6),
    fog: isDay ? "#e8eef4" : "#4a5578",
    ink: base.ink,
  };
}
