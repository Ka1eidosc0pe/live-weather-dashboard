// Maps WMO weather codes (what Open-Meteo returns) to the scenes we can animate.

export type SceneKind = "clear" | "partly" | "cloudy" | "fog" | "drizzle" | "rain" | "snow" | "storm" | "tornado";

export const SCENE_KINDS: SceneKind[] = ["clear", "partly", "cloudy", "fog", "drizzle", "rain", "snow", "storm", "tornado"];

// Open-Meteo has no tornado code. Treat a thunderstorm with destructive gusts as one.
export const TORNADO_GUST_KPH = 90;

export function sceneFor(code: number, gustKph = 0): SceneKind {
  if (code >= 95) return gustKph >= TORNADO_GUST_KPH ? "tornado" : "storm";
  if (code === 0 || code === 1) return "clear";
  if (code === 2) return "partly";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  return "cloudy";
}

const LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Freezing fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  56: "Freezing drizzle",
  57: "Heavy freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Light showers",
  81: "Showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm with hail",
};

export function labelFor(code: number, gustKph = 0): string {
  if (sceneFor(code, gustKph) === "tornado") return "Tornado conditions";
  return LABELS[code] ?? "Unknown";
}

export const SCENE_LABELS: Record<SceneKind, string> = {
  clear: "Sunny",
  partly: "Partly cloudy",
  cloudy: "Cloudy",
  fog: "Foggy",
  drizzle: "Drizzle",
  rain: "Rainy",
  snow: "Snowy",
  storm: "Thunderstorm",
  tornado: "Tornado",
};

export function windDirection(deg: number): string {
  return ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"][
    Math.round(deg / 22.5) % 16
  ];
}

export type Units = "metric" | "imperial";
export const temp = (c: number, u: Units) => Math.round(u === "metric" ? c : (c * 9) / 5 + 32);
export const speed = (kph: number, u: Units) => Math.round(u === "metric" ? kph : kph / 1.609344);
export const speedUnit = (u: Units) => (u === "metric" ? "km/h" : "mph");
