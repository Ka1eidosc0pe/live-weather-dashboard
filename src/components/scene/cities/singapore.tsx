import { PaletteContext, Row, Water } from "../parts";
import { mix } from "../palette";
import type { Palette } from "../palette";
import type { CityScene, SkylineProps } from "../types";

const GROUND = 800;
const ML = 1100; // Merlion centre line
const WATER_Y = 772;
const BODY = "M-34 -40 C-50 -80 -40 -120 -22 -142 L26 -142 C44 -118 52 -84 40 -40 Z";

/** Marina Bay Sands: three leaning towers under the boat-shaped SkyPark. */
function MarinaBay({ p }: { p: Palette }) {
  const towers = [
    { x: 638, lean: 12 },
    { x: 705, lean: 0 },
    { x: 772, lean: -12 },
  ].map(({ x, lean }) => `${x - 26},802 ${x + 26},802 ${x + 24 + lean},440 ${x - 24 + lean},440`);
  const fill = mix(p.mid, p.near, 0.3);
  const deck = mix(p.near, p.ink, 0.15);
  return (
    <g>
      <clipPath id="sg-mbs">
        {towers.map((pts) => <polygon key={pts} points={pts} />)}
      </clipPath>
      {towers.map((pts) => <polygon key={pts} points={pts} fill={fill} />)}
      <rect x={600} y={440} width={200} height={362} fill="url(#windows)" opacity={p.windowOpacity * 0.8} clipPath="url(#sg-mbs)" />
      {[638, 705, 772].map((x) => <rect key={x} x={x - 1} y={444} width={2} height={358} fill="#fff" opacity={0.1} clipPath="url(#sg-mbs)" />)}
      <path d="M552 418 L876 418 Q890 418 880 429 Q864 446 824 447 L610 447 Q574 445 558 430 Q546 418 552 418 Z" fill={deck} />
      <rect x={660} y={414} width={130} height={4} rx={2} fill={mix(p.water, "#ffffff", 0.3)} />
      {[570, 592, 614, 636, 810, 832, 854].map((x) => <circle key={x} cx={x} cy={415} r={5} fill={mix(p.near, "#3f9a5a", p.isDay ? 0.5 : 0.15)} />)}
    </g>
  );
}

function Lotus({ x, p }: { x: number; p: Palette }) {
  const c = mix(p.mid, p.near, 0.35);
  return (
    <g fill={c}>
      <rect x={x - 38} y={754} width={76} height={24} rx={8} />
      {[-72, -48, -24, 0, 24, 48, 72].map((a) => (
        <path key={a} d="M0 0 C-9 -20 -7 -42 0 -58 C7 -42 9 -20 0 0 Z" transform={`translate(${x} 758) rotate(${a})`} />
      ))}
    </g>
  );
}

function SuperTree({ x, top, r, c, p }: { x: number; top: number; r: number; c: string; p: Palette }) {
  return (
    <g>
      <path d={`M${x - 11} 802 Q${x - 3} ${top + 130} ${x - 3} ${top} L${x + 3} ${top} Q${x + 3} ${top + 130} ${x + 11} 802 Z`} fill={mix(p.near, p.ink, 0.15)} />
      <path d={`M${x - r * 0.95} ${top} A${r * 0.95} ${r * 0.55} 0 0 0 ${x + r * 0.95} ${top} Z`} fill={c} />
      <ellipse cx={x} cy={top - 2} rx={r} ry={r * 0.2} fill={mix(c, "#ffffff", 0.15)} />
      {[-0.6, -0.2, 0.2, 0.6].map((f) => <line key={f} x1={x + r * f} y1={top + 4} x2={x + r * f * 0.7} y2={top + r * 0.45} stroke={mix(c, p.ink, 0.25)} strokeWidth={1.4} />)}
    </g>
  );
}

function Palm({ x, h, dx, leaf, trunk }: { x: number; h: number; dx: number; leaf: string; trunk: string }) {
  const y = GROUND + 8;
  const tx = x + dx;
  const ty = y - h;
  return (
    <g>
      <path d={`M${x - 4.5} ${y} Q${x + dx * 0.15} ${y - h * 0.55} ${tx - 3} ${ty} L${tx + 3} ${ty} Q${x + dx * 0.15 + 8} ${y - h * 0.55} ${x + 4.5} ${y} Z`} fill={trunk} />
      {[-165, -135, -105, -75, -45, -15, 15].map((a) => (
        <path key={a} d="M0 0 Q26 -28 66 8 Q32 -8 0 0 Z" fill={leaf} transform={`translate(${tx} ${ty}) rotate(${a})`} />
      ))}
    </g>
  );
}

function Skyline({ p, heroClass }: SkylineProps) {
  const stone = mix(p.near, p.ink, 0.06);
  const mane = mix(stone, p.ink, 0.14);
  const dark = mix(p.ink, stone, 0.2);
  const leaf = mix(p.near, "#3f9a5a", p.isDay ? 0.55 : 0.18);
  const jet = mix(p.water, "#ffffff", 0.7);

  return (
    <PaletteContext.Provider value={p}>
      {/* the business district across the bay */}
      <Row seed={501} baseY={GROUND} minH={110} maxH={290} fill={p.far} />
      <Row seed={517} baseY={GROUND} minH={80} maxH={210} minW={54} maxW={100} fill={p.mid} gap={8} />
      <MarinaBay p={p} />
      <Lotus x={905} p={p} />
      <SuperTree x={1335} top={590} r={46} c={mix(p.near, "#2fae7a", p.isDay ? 0.45 : 0.1)} p={p} />
      <SuperTree x={1420} top={530} r={56} c={mix(p.near, "#d56aa0", p.isDay ? 0.35 : 0.1)} p={p} />
      <SuperTree x={1505} top={615} r={40} c={mix(p.near, "#2fae7a", p.isDay ? 0.45 : 0.1)} p={p} />
      <Row seed={533} baseY={GROUND} minH={34} maxH={90} minW={60} maxW={110} fill={p.near} gap={12} from={-60} to={540} />

      {/* the bay and the Merlion's jetty */}
      <Water y={WATER_Y} h={GROUND - WATER_Y} p={p} />
      <rect x={1000} y={788} width={200} height={16} rx={7} fill={p.ground} />

      {/* ground and tropical palms */}
      <rect x={0} y={GROUND + 2} width={1600} height={98} fill={p.ground} />
      <rect x={0} y={GROUND + 58} width={1600} height={2} fill={p.ink} opacity={0.18} />
      <Palm x={110} h={108} dx={14} leaf={leaf} trunk={mix(p.ink, p.near, 0.5)} />
      <Palm x={330} h={86} dx={-12} leaf={leaf} trunk={mix(p.ink, p.near, 0.5)} />
      <Palm x={520} h={96} dx={12} leaf={leaf} trunk={mix(p.ink, p.near, 0.5)} />
      <Palm x={1260} h={100} dx={-14} leaf={leaf} trunk={mix(p.ink, p.near, 0.5)} />
      <Palm x={1545} h={112} dx={-10} leaf={leaf} trunk={mix(p.ink, p.near, 0.5)} />

      {/* The Merlion */}
      <g className={`hero ${heroClass}`} style={{ transformOrigin: "50% 100%" }}>
        <g transform={`translate(${ML} ${GROUND})`}>
          <clipPath id="sg-body">
            <path d={BODY} />
          </clipPath>
          <rect x={-58} y={-22} width={116} height={24} fill={stone} />
          <rect x={-44} y={-40} width={88} height={20} fill={mix(stone, "#ffffff", 0.08)} />
          <path d={BODY} fill={stone} />
          <g clipPath="url(#sg-body)" fill="#fff" opacity={0.16}>
            {[-100, -82, -64, -46].map((y, r) =>
              [-44, -30, -16, -2, 12, 26, 40].map((x) => <circle key={`${r}-${x}`} cx={x + (r % 2) * 7} cy={y} r={6} />)
            )}
          </g>
          <path d="M36 -46 C84 -56 100 -106 90 -146 L80 -146 C86 -108 70 -72 36 -62 Z" fill={stone} />
          <path d="M85 -146 C60 -158 58 -178 66 -190 C76 -176 84 -164 85 -146 Z M85 -146 C110 -156 118 -176 112 -190 C100 -176 90 -164 85 -146 Z" fill={stone} />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return <circle key={i} cx={-6 + Math.cos(a) * 31} cy={-172 + Math.sin(a) * 31} r={11.5} fill={mane} />;
          })}
          <circle cx={-6} cy={-172} r={27} fill={stone} />
          <rect x={-52} y={-178} width={34} height={25} rx={11} fill={mix(stone, "#ffffff", 0.1)} />
          <polygon points="-52,-167 -30,-171 -30,-159" fill={dark} />
          <circle cx={-47} cy={-177} r={3} fill={dark} />
          <circle cx={-17} cy={-181} r={2.8} fill={dark} />
          <path d="M-24 -190 L-10 -186" stroke={dark} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M-50 -163 Q-104 -186 -126 -22" stroke={jet} strokeWidth={6} strokeLinecap="round" strokeDasharray="8 6" fill="none" opacity={0.95}>
            <animate attributeName="stroke-dashoffset" from="0" to="-26" dur="0.9s" repeatCount="indefinite" />
          </path>
          <ellipse cx={-126} cy={-20} rx={15} ry={3.2} fill="none" stroke="#fff" strokeWidth={1.6} opacity={0.6} />
        </g>
      </g>
    </PaletteContext.Provider>
  );
}

const singapore: CityScene = {
  id: "singapore",
  focusX: 960,
  groundY: GROUND,
  walkY: GROUND + 40,
  hero: {
    name: "The Merlion",
    box: { x: ML - 130, y: 584, w: 250, h: 220 },
    base: { x: ML, y: GROUND + 2 },
    top: { x: ML - 6, y: 586 },
  },
  accents: ["#e5484d", "#ffffff", "#f4b942", "#30a46c", "#3e63dd"],
  Skyline,
};

export default singapore;
