import { PaletteContext, Block, Row, Tree, Water, rng } from "../parts";
import { mix } from "../palette";
import type { CityScene, SkylineProps } from "../types";

const GROUND = 800;
const WATER_Y = 742;
const TOP = 410; // tower tops
const DECK = 722;
const T1 = 1100; // hero tower
const T2 = 1500;

const bump = (x: number, c: number, w: number) => Math.exp(-(((x - c) / w) ** 2));
const hillA = (x: number) => GROUND - (150 * bump(x, 230, 170) + 118 * bump(x, 620, 140) + 40 * bump(x, 20, 90));
const hillB = (x: number) => GROUND - (215 * bump(x, 420, 200) + 150 * bump(x, 40, 160) + 105 * bump(x, 770, 110));
const marin = (x: number) => 706 - (78 * bump(x, 920, 210) + 96 * bump(x, 1400, 240) + 40 * bump(x, 1600, 100));

function curve(f: (x: number) => number, a: number, b: number, floor = GROUND + 2) {
  const pts: string[] = [];
  for (let x = a; x <= b; x += 8) pts.push(`${x},${f(x).toFixed(1)}`);
  return `M${a} ${floor} L${pts.join(" L")} L${b} ${floor} Z`;
}

/** Cable height at x: parabolic main span, gently sagging side spans. */
function cableY(x: number) {
  if (x >= T1 && x <= T2) {
    const u = (x - (T1 + T2) / 2) / ((T2 - T1) / 2);
    return TOP + (DECK - 34 - TOP) * (1 - u * u);
  }
  const t = Math.min(1, x < T1 ? (T1 - x) / 380 : (x - T2) / 180);
  return TOP + (DECK - TOP - 4) * t + 22 * Math.sin(Math.PI * t);
}

/** The roadway, main cable and suspenders between x = a and x = b. */
function Span({ a, b, color }: { a: number; b: number; color: string }) {
  const pts: string[] = [];
  for (let x = a; x <= b; x += 6) pts.push(`${x},${cableY(x).toFixed(1)}`);
  const hangers: number[] = [];
  for (let x = Math.ceil(a / 16) * 16; x <= b; x += 16) {
    if (Math.abs(x - T1) > 18 && Math.abs(x - T2) > 18 && cableY(x) < DECK - 6) hangers.push(x);
  }
  return (
    <g>
      <rect x={a} y={DECK} width={b - a} height={8} fill={color} />
      <rect x={a} y={DECK + 8} width={b - a} height={3} fill={color} opacity={0.5} />
      <g stroke={color} fill="none">
        <polyline points={pts.join(" ")} strokeWidth={4.5} strokeLinejoin="round" />
        {hangers.map((x) => <line key={x} x1={x} y1={cableY(x)} x2={x} y2={DECK} strokeWidth={1.4} opacity={0.75} />)}
      </g>
    </g>
  );
}

function Tower({ x, color, base }: { x: number; color: string; base: string }) {
  return (
    <g>
      <rect x={x - 32} y={784} width={64} height={18} fill={base} />
      <rect x={x - 25} y={TOP - 6} width={14} height={400} fill={color} />
      <rect x={x + 11} y={TOP - 6} width={14} height={400} fill={color} />
      <rect x={x - 27} y={TOP - 12} width={54} height={10} fill={color} />
      {[470, 540, 610, 678].map((y) => <rect key={y} x={x - 25} y={y} width={50} height={9} fill={color} />)}
      {[470, 540, 610].map((y) => (
        <path key={y} d={`M${x - 11} ${y + 9} L${x + 11} ${y + 70} M${x + 11} ${y + 9} L${x - 11} ${y + 70}`} stroke={color} strokeWidth={2.4} />
      ))}
    </g>
  );
}

function Skyline({ p, heroClass }: SkylineProps) {
  const orange = mix("#e0482b", p.near, p.isDay ? 0.16 : 0.55);
  const steel = mix(p.near, p.ink, 0.12);
  const pastel = ["#f4c7b8", "#f6e0a4", "#bfe0c8", "#b8d3f0", "#e6b8d8", "#f1d0a0"].map((c) => mix(c, p.mid, p.isDay ? (p.scene === "clear" ? 0.28 : p.scene === "partly" ? 0.35 : 0.6) : 0.85));
  const r = rng(77);

  const houses = [0, 26].flatMap((off, row) => {
    const out: { x: number; y: number; w: number; h: number; c: string }[] = [];
    let x = row ? 70 : 28;
    while (x < 780) {
      const w = 15 + r() * 10;
      const y = hillA(x) + off;
      if (y < 792) out.push({ x, y, w, h: 18 + r() * 14, c: pastel[Math.floor(r() * pastel.length)] });
      x += w + 2 + r() * 3;
    }
    return out;
  });

  const fogs: [number, number, number, number, number][] = [
    [740, 690, 440, 30, 21],
    [1200, 656, 380, 26, 27],
    [980, 744, 480, 22, 17],
    [1400, 748, 360, 22, 24],
  ];

  return (
    <PaletteContext.Provider value={p}>
      {/* Marin headlands and downtown */}
      <path d={curve(marin, 640, 1640, WATER_Y + 4)} fill={p.far} />
      <Row seed={211} baseY={GROUND} minH={90} maxH={250} minW={44} maxW={86} fill={p.far} from={280} to={840} />
      <Row seed={223} baseY={GROUND} minH={60} maxH={170} minW={50} maxW={90} fill={p.mid} gap={8} from={330} to={800} />

      {/* Transamerica Pyramid */}
      <g>
        <clipPath id="sf-pyr">
          <polygon points="532,802 592,802 565,402 559,402" />
        </clipPath>
        <rect x={541} y={500} width={9} height={110} fill={steel} />
        <rect x={574} y={500} width={9} height={110} fill={steel} />
        <polygon points="532,802 592,802 565,402 559,402" fill={steel} />
        <rect x={532} y={402} width={60} height={400} fill="url(#windows)" opacity={p.windowOpacity * 0.8} clipPath="url(#sf-pyr)" />
        <polygon points="562,802 592,802 565,402 562,402" fill="#fff" opacity={0.08} />
        <rect x={560.6} y={330} width={2.8} height={74} fill={steel} />
      </g>

      {/* the bay */}
      <Water x={560} y={WATER_Y} w={1080} h={GROUND - WATER_Y} p={p} />
      <path d={`M820 ${WATER_Y + 3} Q845 694 905 692 Q965 696 990 ${WATER_Y + 3} Z`} fill={mix(p.mid, p.near, 0.6)} />
      <rect x={880} y={680} width={42} height={13} fill={p.near} />
      <rect x={892} y={672} width={12} height={9} fill={p.near} />
      <path d={`M1250 ${WATER_Y + 22} l24 0 l-12 -34 z M1290 ${WATER_Y + 22} l16 0 l-8 -22 z`} fill={mix(p.skyBottom, "#ffffff", 0.5)} />
      <rect x={1245} y={WATER_Y + 21} width={64} height={3} rx={1.5} fill={p.near} />

      {/* the rest of the bridge: far tower, side spans and the approach */}
      <Span a={700} b={982} color={orange} />
      <Span a={1218} b={1650} color={orange} />
      <Tower x={T2} color={orange} base={p.near} />

      {/* fog drifting through the Gate */}
      <g opacity={p.isDay ? 0.5 : 0.35}>
        {fogs.map(([x, y, w, h, d], i) => (
          <g key={i} className="anim" style={{ animation: `fog-drift ${d}s ease-in-out infinite alternate`, animationDelay: `-${i * 5}s` }}>
            <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={p.fog} />
            <rect x={x + w * 0.2} y={y - h * 0.5} width={w * 0.55} height={h} rx={h / 2} fill={p.fog} />
          </g>
        ))}
      </g>

      {/* rolling hills with painted row houses */}
      <path d={curve(hillB, -20, 840)} fill={p.mid} />
      <path d={curve(hillA, -20, 840)} fill={p.near} />
      {houses.map((h, i) => (
        <g key={i}>
          <Block x={h.x} y={h.y - h.h} w={h.w} h={h.h + 10} fill={h.c} />
          <rect x={h.x - 1} y={h.y - h.h - 3} width={h.w + 2} height={3.5} fill={mix(h.c, p.ink, 0.35)} />
        </g>
      ))}

      {/* ground and foreground */}
      <rect x={0} y={GROUND} width={1600} height={100} fill={p.ground} />
      <rect x={0} y={GROUND + 58} width={1600} height={2} fill={p.ink} opacity={0.18} />
      {[90, 330, 760, 1330, 1540].map((x, i) => <Tree key={x} x={x} y={GROUND + 5} s={0.95 + (i % 3) * 0.12} />)}

      {/* Golden Gate Bridge: the near tower and its stretch of span */}
      <g className={`hero ${heroClass}`} style={{ transformOrigin: "50% 100%" }}>
        <Span a={976} b={1224} color={orange} />
        <Tower x={T1} color={orange} base={p.near} />
      </g>
    </PaletteContext.Provider>
  );
}

const sanFrancisco: CityScene = {
  id: "san-francisco",
  focusX: 1000,
  groundY: GROUND,
  walkY: GROUND + 40,
  hero: {
    name: "The Golden Gate Bridge",
    box: { x: T1 - 120, y: TOP - 14, w: 240, h: 406 },
    base: { x: T1, y: GROUND + 2 },
    top: { x: T1, y: TOP - 12 },
  },
  accents: ["#e0482b", "#f4b942", "#3e63dd", "#30a46c", "#ffffff"],
  Skyline,
};

export default sanFrancisco;
