import { PaletteContext, Row, Tree } from "../parts";
import { mix } from "../palette";
import type { CityScene, SkylineProps } from "../types";

const GROUND = 800;
const TT = 1070; // Tokyo Tower centre line
const FUJI = "M250 802 C400 772 535 565 604 392 L676 392 C745 565 880 772 1040 802 Z";

/** Half-width of the tower's lattice at height y. */
const hw = (y: number) =>
  y >= 560 ? 26 + 30 * ((y - 560) / 240) ** 1.4 : y >= 440 ? 12 + 14 * ((y - 440) / 120) ** 1.2 : 6 + 6 * ((y - 400) / 40);

/** One painted band of lattice between two heights: side members, a beam and X bracing. */
function Band({ ya, yb, c }: { ya: number; yb: number; c: string }) {
  const a = hw(ya);
  const b = hw(yb);
  return (
    <g stroke={c} fill="none" strokeLinecap="butt">
      <path d={`M${TT - a} ${ya} L${TT - b} ${yb} M${TT + a} ${ya} L${TT + b} ${yb}`} strokeWidth={6} />
      <path d={`M${TT - a} ${ya} L${TT + b} ${yb} M${TT + a} ${ya} L${TT - b} ${yb}`} strokeWidth={2.6} />
      <path d={`M${TT - a} ${ya} L${TT + a} ${ya}`} strokeWidth={4} />
    </g>
  );
}

function Skyline({ p, heroClass }: SkylineProps) {
  const orange = mix("#f0562a", p.near, p.isDay ? 0.12 : 0.55);
  const white = mix("#f6f6f6", p.mid, p.isDay ? 0.2 : 0.78);
  const steel = mix(p.near, p.skyBottom, p.isDay ? 0.12 : 0);
  const pink = mix("#f6a6c1", p.near, p.isDay ? 0.12 : 0.65);
  const roof = mix("#8a3b32", p.near, p.isDay ? 0.35 : 0.8);
  const wall = mix(p.mid, p.skyBottom, 0.2);
  const torii = mix("#d93a2f", p.near, p.isDay ? 0.2 : 0.6);
  const snow = mix(p.skyBottom, "#ffffff", p.isDay ? 0.75 : 0.3);

  const lower = [790, 735, 680, 620, 560];
  const upper = [560, 520, 480, 440, 400];
  const mast = [400, 385, 370, 355, 340, 322, 304, 286, 268];

  return (
    <PaletteContext.Provider value={p}>
      {/* Mount Fuji, pale and far away */}
      <g>
        <clipPath id="tk-fuji">
          <path d={FUJI} />
        </clipPath>
        <path d={FUJI} fill={mix(p.far, p.skyBottom, 0.35)} />
        <polygon
          points="560,380 720,380 720,470 702,450 686,490 668,454 652,494 634,456 618,492 602,452 586,488 570,456 560,468"
          fill={snow}
          clipPath="url(#tk-fuji)"
        />
      </g>

      {/* dense towers */}
      <Row seed={401} baseY={GROUND} minH={120} maxH={310} minW={40} maxW={76} fill={p.far} gap={3} />
      <Row seed={419} baseY={GROUND} minH={90} maxH={250} minW={44} maxW={84} fill={p.mid} gap={4} />

      {/* Tokyo Skytree */}
      <g fill={steel}>
        <path d="M1318 802 Q1342 700 1344 540 L1356 540 Q1358 700 1382 802 Z" />
        <rect x={1344} y={300} width={12} height={245} />
        <ellipse cx={1350} cy={470} rx={22} ry={8} />
        <ellipse cx={1350} cy={420} rx={14} ry={6} />
        <rect x={1348.4} y={218} width={3.2} height={90} />
      </g>

      <Row seed={433} baseY={GROUND} minH={50} maxH={150} minW={54} maxW={100} fill={p.near} gap={8} />

      {/* pagoda and torii */}
      <g>
        {[0, 1, 2, 3, 4].map((i) => {
          const yb = GROUND - i * 26;
          const bw = 40 - i * 6;
          const rw = bw + 24;
          return (
            <g key={i}>
              <rect x={880 - bw / 2} y={yb - 18} width={bw} height={19} fill={wall} />
              <path d={`M${880 - rw / 2} ${yb - 16} L${880 + rw / 2} ${yb - 16} L${880 + rw / 2 - 7} ${yb - 28} L${880 - rw / 2 + 7} ${yb - 28} Z`} fill={roof} />
            </g>
          );
        })}
        <rect x={878.8} y={GROUND - 156} width={2.4} height={26} fill={roof} />
        <g fill={torii}>
          <rect x={1189} y={GROUND - 72} width={7} height={74} />
          <rect x={1234} y={GROUND - 72} width={7} height={74} />
          <path d={`M1176 ${GROUND - 70} Q1215 ${GROUND - 82} 1254 ${GROUND - 70} L1250 ${GROUND - 61} Q1215 ${GROUND - 69} 1180 ${GROUND - 61} Z`} />
          <rect x={1185} y={GROUND - 52} width={60} height={6} />
        </g>
      </g>

      {/* ground and cherry blossoms */}
      <rect x={0} y={GROUND} width={1600} height={100} fill={p.ground} />
      <rect x={0} y={GROUND + 58} width={1600} height={2} fill={p.ink} opacity={0.18} />
      {[330, 560, 800, 960, 1170, 1270, 1490].map((x, i) => <Tree key={x} x={x} y={GROUND + 5} s={0.95 + (i % 3) * 0.12} fill={pink} />)}
      <Tree x={110} y={GROUND + 5} s={1.1} />

      {/* Tokyo Tower: orange and white lattice bands, two decks and an antenna */}
      <g className={`hero ${heroClass}`} style={{ transformOrigin: "50% 100%" }}>
        <rect x={TT - 68} y={GROUND - 14} width={136} height={16} fill={steel} />
        {lower.slice(0, -1).map((y, i) => <Band key={y} ya={y} yb={lower[i + 1]} c={i % 2 ? white : orange} />)}
        {upper.slice(0, -1).map((y, i) => <Band key={y} ya={y} yb={upper[i + 1]} c={i % 2 ? white : orange} />)}
        <rect x={TT - 36} y={546} width={72} height={18} rx={2} fill={orange} />
        <rect x={TT - 36} y={553} width={72} height={4} fill={white} />
        <rect x={TT - 20} y={430} width={40} height={12} rx={2} fill={white} />
        <rect x={TT - 20} y={434} width={40} height={3} fill={orange} />
        {mast.slice(0, -1).map((y, i) => (
          <rect key={y} x={TT - (y > 340 ? 2.2 : 1.3)} y={mast[i + 1]} width={y > 340 ? 4.4 : 2.6} height={y - mast[i + 1] + 0.5} fill={i % 2 ? white : orange} />
        ))}
      </g>
    </PaletteContext.Provider>
  );
}

const tokyo: CityScene = {
  id: "tokyo",
  focusX: 1000,
  groundY: GROUND,
  walkY: GROUND + 40,
  hero: {
    name: "Tokyo Tower",
    box: { x: TT - 70, y: 266, w: 140, h: 538 },
    base: { x: TT, y: GROUND + 2 },
    top: { x: TT, y: 268 },
  },
  accents: ["#ff7aa8", "#ffffff", "#3e63dd", "#f4b942", "#e5484d"],
  Skyline,
};

export default tokyo;
