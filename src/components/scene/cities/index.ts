import type { CityScene } from "../types";
import chicago from "./chicago";
import { genericScene } from "./generic";
import london from "./london";
import newYork from "./new-york";
import sanFrancisco from "./san-francisco";
import singapore from "./singapore";
import tokyo from "./tokyo";

const LAUNCH: Record<string, CityScene> = {
  chicago,
  "new-york": newYork,
  "san-francisco": sanFrancisco,
  london,
  tokyo,
  singapore,
};

const cache = new Map<string, CityScene>();

/** Bespoke scene for launch cities, a standard skyline for everyone else. */
export function sceneForCity(id: string | null | undefined): CityScene {
  const key = id ?? "default";
  if (LAUNCH[key]) return LAUNCH[key];
  let g = cache.get(key);
  if (!g) {
    g = genericScene(key);
    cache.set(key, g);
  }
  return g;
}

export const LAUNCH_CITY_IDS = Object.keys(LAUNCH);
