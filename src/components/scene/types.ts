import type { ComponentType } from "react";
import type { Palette } from "./palette";

export const VB_W = 1600;
export const VB_H = 900;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The landmark each launch city lets you poke (Chicago's Bean, Big Ben, ...). Coordinates are in the 1600x900 scene space. */
export interface Hero {
  name: string;
  /** Click target. */
  box: Box;
  /** Where it meets the ground: sprouts grow here. */
  base: { x: number; y: number };
  /** Top centre: snow puffs and speech bubbles anchor here. */
  top: { x: number; y: number };
}

export interface SkylineProps {
  p: Palette;
  heroClass: string;
}

export interface CityScene {
  id: string;
  /** Scene-space x to keep centred on narrow (portrait) screens. */
  focusX: number;
  /** y where buildings stand and the ground strip begins. */
  groundY: number;
  /** People walk along this y. */
  walkY: number;
  hero: Hero | null;
  /** Accent colours for people's clothes etc. */
  accents: string[];
  /** Draws the whole static skyline. `heroClass` must be put on the hero landmark's <g> (it drives heat/shiver/zap effects). */
  Skyline: ComponentType<SkylineProps>;
}
