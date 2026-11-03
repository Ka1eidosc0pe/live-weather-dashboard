import { PaletteContext, Block, Row, Tree, Water } from "../parts";
import { mix } from "../palette";
import type { Palette } from "../palette";
import type { CityScene, SkylineProps } from "../types";

const GROUND = 800;
const BEN = 990; // Elizabeth Tower centre line
const EYE = { x: 470, y: 660, r: 108 };
const WATER_Y = 776;

/** London Eye: legs, a slowly turning rim with upright pods (SMIL, so it turns about its own centre). */
function Eye({ p, c }: { p: Palette; c: string }) {
  const { x, y, r } = EYE;
  const pods = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return { px: x + Math.cos(a) * r, py: y + Math.sin(a) * r };
  });
  return (
    <g>
      <polygon points={`${x - 44},${GROUND + 2} ${x - 36},${GROUND + 2} ${x + 4},${y} ${x - 4},${y}`} fill={c} />
      <polygon points={`${x + 44},${GROUND + 2} ${x + 36},${GROUND + 2} ${x - 4},${y} ${x + 4},${y}`} fill={c} />
      <g>
        <animateTransform attributeName="transform" type="rotate" from={`0 ${x} ${y}`} to={`360 ${x} ${y}`} dur="200s" repeatCount="indefinite" />
        <circle cx={x} cy={y} r={r} fill="none" stroke={c} strokeWidth={4.5} />
        <circle cx={x} cy={y} r={r - 9} fill="none" stroke={c} strokeWidth={1.4} opacity={0.6} />
        {pods.map((q, i) => (
          <line key={i} x1={x} y1={y} x2={q.px} y2={q.py} stroke={c} strokeWidth={1} opacity={0.6} />
        ))}
        {pods.map((q, i) => (
          <g key={`p${i}`}>
            <animateTransform attributeName="transform" type="rotate" from={`0 ${q.px} ${q.py}`} to={`-360 ${q.px} ${q.py}`} dur="200s" repeatCount="indefinite" />
            <rect x={q.px - 5.5} y={q.py - 4.5} width={11} height={9} rx={3.5} fill={mix(c, p.skyBottom, 0.35)} />
          </g>
        ))}
      </g>
      <circle cx={x} cy={y} r={8} fill={c} />
    </g>
  );
}

function TowerBridge({ p, stone }: { p: Palette; stone: string }) {
  const blue = mix("#4f7fd0", p.near, p.isDay ? 0.2 : 0.55);
  const xs = [1350, 1460];
  return (
    <g>
      <rect x={1280} y={746} width={330} height={9} fill={blue} />
      <rect x={1367} y={612} width={76} height={10} fill={blue} />
      <path d="M1333 620 Q1312 700 1280 746 M1477 620 Q1498 700 1530 746 M1350 620 Q1405 690 1460 620" stroke={blue} strokeWidth={4} fill="none" />
      {xs.map((x) => (
        <g key={x} fill={stone}>
          <rect x={x - 17} y={604} width={34} height={198} />
          <polygon points={`${x - 19},604 ${x + 19},604 ${x},560`} />
          {[x - 17, x + 11].map((tx) => (
            <polygon key={tx} points={`${tx},606 ${tx + 6},606 ${tx + 3},582`} />
          ))}
          <rect x={x - 22} y={700} width={44} height={6} />
          {[650, 720].map((y) => <rect key={y} x={x - 2} y={y} width={4} height={20} fill={mix(stone, p.ink, 0.45)} />)}
        </g>
      ))}
    </g>
  );
}

function Skyline({ p, heroClass }: SkylineProps) {
  const stone = mix(p.near, "#d2b27a", p.isDay ? 0.42 : 0.08);
  const dim = mix(stone, p.ink, 0.4);
  const glass = mix(p.near, p.skyTop, p.isDay ? 0.3 : 0.12);
  const eyeC = mix(p.mid, p.near, 0.45);
  const bus = mix("#d9262e", p.near, p.isDay ? 0.1 : 0.5);
  const face = p.isDay ? mix("#f5efe6", p.near, 0.1) : p.window;

  return (
    <PaletteContext.Provider value={p}>
      {/* distant towers */}
      <Row seed={301} baseY={GROUND} minH={100} maxH={260} fill={p.far} />
      <Row seed={313} baseY={GROUND} minH={80} maxH={200} minW={56} maxW={104} fill={p.mid} gap={8} />

      {/* The Shard and the Gherkin */}
      <g>
        <clipPath id="ldn-shard">
          <polygon points="1180,802 1250,802 1218,296" />
        </clipPath>
        <polygon points="1180,802 1250,802 1218,296" fill={glass} />
        <rect x={1180} y={296} width={70} height={506} fill="url(#windows)" opacity={p.windowOpacity * 0.7} clipPath="url(#ldn-shard)" />
        <polygon points="1218,296 1250,802 1226,802" fill="#fff" opacity={0.12} />
        {[380, 470, 560, 650, 740].map((y) => <rect key={y} x={1180} y={y} width={70} height={2} fill="#fff" opacity={0.18} clipPath="url(#ldn-shard)" />)}
      </g>
      <g fill={mix(p.mid, p.near, 0.55)}>
        <path d="M1105 562 C1080 590 1076 640 1082 700 C1086 760 1090 802 1090 802 L1120 802 C1120 802 1124 760 1128 700 C1134 640 1130 590 1105 562 Z" />
        <circle cx={1105} cy={560} r={4} />
      </g>

      {/* the Thames, with the embankment left dry for Parliament */}
      <Water x={-10} y={WATER_Y} w={606} h={GROUND - WATER_Y} p={p} />
      <Water x={1030} y={WATER_Y} w={590} h={GROUND - WATER_Y} p={p} />

      {/* Houses of Parliament */}
      <g>
        <Block x={598} y={706} w={368} h={96} fill={stone} />
        {Array.from({ length: 11 }).map((_, i) => (
          <g key={i} fill={stone}>
            <rect x={674 + i * 30} y={684} width={9} height={24} />
            <polygon points={`${673 + i * 30},684 ${684 + i * 30},684 ${678.5 + i * 30},664`} />
          </g>
        ))}
        {Array.from({ length: 28 }).map((_, i) => <rect key={i} x={690 + i * 10.4} y={726} width={3.4} height={13} rx={1.7} fill={dim} opacity={0.55} />)}
        {Array.from({ length: 28 }).map((_, i) => <rect key={i} x={690 + i * 10.4} y={758} width={3.4} height={13} rx={1.7} fill={dim} opacity={0.55} />)}
        <polygon points="780,706 880,706 830,648" fill={stone} />
        <rect x={827} y={618} width={6} height={34} fill={stone} />
        {/* Victoria Tower */}
        <Block x={606} y={560} w={54} h={242} fill={stone} />
        <rect x={601} y={552} width={64} height={10} fill={stone} />
        {[601, 656].map((x) => <polygon key={x} points={`${x},552 ${x + 9},552 ${x + 4.5},528`} fill={stone} />)}
        <rect x={631} y={532} width={4} height={22} fill={stone} />
        {[590, 640, 690].map((y) => <rect key={y} x={627} y={y} width={12} height={24} rx={6} fill={dim} opacity={0.55} />)}
      </g>

      {/* Tower Bridge and the London Eye */}
      <TowerBridge p={p} stone={mix(p.mid, "#c2a77c", p.isDay ? 0.2 : 0.05)} />
      <Eye p={p} c={eyeC} />
      <Row seed={331} baseY={GROUND} minH={36} maxH={90} minW={64} maxW={110} fill={p.near} gap={14} from={-60} to={250} />

      {/* ground, road and a bus */}
      <rect x={0} y={GROUND} width={1600} height={100} fill={p.ground} />
      <rect x={0} y={GROUND + 62} width={1600} height={38} fill={mix(p.ground, p.ink, 0.3)} />
      {Array.from({ length: 24 }).map((_, i) => <rect key={i} x={i * 70 + 24} y={GROUND + 84} width={32} height={3} fill="#fff" opacity={0.3} />)}
      {[70, 300, 1050, 1180, 1560].map((x, i) => <Tree key={x} x={x} y={GROUND + 5} s={0.95 + (i % 3) * 0.1} />)}
      <g className="anim" style={{ animation: "walk-rev 70s linear infinite", animationDelay: "-26s" }}>
        <g transform={`translate(0 ${GROUND + 80})`}>
          <rect x={0} y={-17} width={72} height={16} rx={3} fill={bus} />
          <rect x={3} y={-32} width={66} height={16} rx={3} fill={bus} />
          {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={8 + i * 12} y={-29} width={9} height={8} rx={1.5} fill={p.skyBottom} opacity={0.85} />)}
          {[0, 1, 2].map((i) => <rect key={i} x={10 + i * 17} y={-14} width={11} height={7} rx={1.5} fill={p.skyBottom} opacity={0.75} />)}
          <circle cx={15} cy={-1} r={5.2} fill={p.ink} />
          <circle cx={57} cy={-1} r={5.2} fill={p.ink} />
        </g>
      </g>

      {/* Big Ben (Elizabeth Tower) */}
      <g className={`hero ${heroClass}`} style={{ transformOrigin: "50% 100%" }}>
        <rect x={BEN - 22} y={716} width={44} height={86} fill={stone} />
        <rect x={BEN - 17} y={500} width={34} height={220} fill={stone} />
        <rect x={BEN - 25} y={410} width={50} height={94} fill={stone} />
        <rect x={BEN - 20} y={372} width={40} height={40} fill={stone} />
        <polygon points={`${BEN - 24},374 ${BEN + 24},374 ${BEN},306`} fill={stone} />
        <rect x={BEN - 1.2} y={282} width={2.4} height={26} fill={stone} />
        {[BEN - 29, BEN + 23].map((x) => (
          <g key={x} fill={stone}>
            <rect x={x} y={396} width={6} height={50} />
            <polygon points={`${x - 1},396 ${x + 7},396 ${x + 3},380`} />
          </g>
        ))}
        {[-13, -3, 7].map((dx) => <rect key={dx} x={BEN + dx} y={380} width={6} height={22} rx={3} fill={dim} opacity={0.7} />)}
        {[540, 600, 660].map((y) => <rect key={y} x={BEN - 2} y={y} width={4} height={22} rx={2} fill={dim} opacity={0.6} />)}
        {[512, 572, 632, 692].map((y) => <rect key={y} x={BEN - 17} y={y} width={34} height={3} fill="#fff" opacity={0.12} />)}
        <circle cx={BEN} cy={456} r={20} fill={dim} />
        <circle cx={BEN} cy={456} r={16.5} fill={face} />
        {[0, 90, 180, 270].map((a) => <rect key={a} x={BEN - 0.9} y={440.5} width={1.8} height={4} fill={p.ink} transform={`rotate(${a} ${BEN} 456)`} />)}
        <path d={`M${BEN} 456 L${BEN - 7.5} 451.6 M${BEN} 456 L${BEN + 11} 449.6`} stroke={p.ink} strokeWidth={1.9} strokeLinecap="round" />
      </g>
    </PaletteContext.Provider>
  );
}

const london: CityScene = {
  id: "london",
  focusX: 920,
  groundY: GROUND,
  walkY: GROUND + 40,
  hero: {
    name: "Big Ben",
    box: { x: BEN - 60, y: 280, w: 120, h: 524 },
    base: { x: BEN, y: GROUND + 2 },
    top: { x: BEN, y: 282 },
  },
  accents: ["#d9262e", "#3e63dd", "#f4b942", "#ffffff", "#30a46c"],
  Skyline,
};

export default london;
