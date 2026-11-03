import { PaletteContext, Row, Tree, Water, hash } from "../parts";
import type { CityScene, SkylineProps } from "../types";

const GROUND = 800;

/** Standard skyline for cities without a bespoke scene: a calm layered silhouette, varied by city id. */
export function genericScene(id: string): CityScene {
  const seed = hash(id);
  function Skyline({ p }: SkylineProps) {
    return (
      <PaletteContext.Provider value={p}>
        <Row seed={seed} baseY={GROUND} minH={90} maxH={300} fill={p.far} />
        <Row seed={seed + 1} baseY={GROUND} minH={70} maxH={240} minW={56} maxW={110} fill={p.mid} gap={8} />
        <Row seed={seed + 2} baseY={GROUND} minH={40} maxH={140} minW={70} maxW={130} fill={p.near} gap={14} />
        <rect x={0} y={GROUND} width={1600} height={100} fill={p.ground} />
        <Water y={GROUND + 62} h={38} p={p} />
        {[120, 420, 760, 1150, 1480].map((x, i) => (
          <Tree key={x} x={x} y={GROUND + 6} s={0.9 + (i % 3) * 0.12} />
        ))}
      </PaletteContext.Provider>
    );
  }
  return {
    id,
    focusX: 800,
    groundY: GROUND,
    walkY: GROUND + 34,
    hero: null,
    accents: ["#f4b942", "#e5484d", "#3e63dd", "#30a46c", "#ffffff"],
    Skyline,
  };
}
