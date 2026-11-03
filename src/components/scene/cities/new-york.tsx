import { PaletteContext, Block, Row, Tree, Water } from "../parts";
import { mix } from "../palette";
import type { Palette } from "../palette";
import type { CityScene, SkylineProps } from "../types";

const GROUND = 800;
const ESB = 1080; // Empire State Building centre line
const WATER_Y = 756;

/** Statue of Liberty on her island; origin is the waterline at the island's centre. */
function Liberty({ x, p, green }: { x: number; p: Palette; green: string }) {
  return (
    <g transform={`translate(${x} ${GROUND}) scale(1.15)`}>
      <ellipse cx={0} cy={-3} rx={50} ry={9} fill={p.near} />
      <polygon points="-28,-8 28,-8 21,-24 -21,-24" fill={green} />
      <rect x={-13} y={-50} width={26} height={27} fill={green} />
      <path d="M-10 -50 L-7 -88 L7 -88 L10 -50 Z" fill={green} />
      <polygon points="4,-82 9,-85 13,-114 8,-115" fill={green} />
      <rect x={6} y={-120} width={8} height={7} fill={green} />
      <ellipse cx={10} cy={-127} rx={3.2} ry={6} fill={mix("#f6c645", p.mid, 0.2)} />
      <rect x={-13} y={-80} width={5} height={12} fill={green} />
      <circle cx={0} cy={-93} r={5.6} fill={green} />
      {[-62, -31, 0, 31, 62].map((a) => (
        <polygon key={a} points="-1.4,-97 1.4,-97 0,-109" fill={green} transform={`rotate(${a} 0 -93)`} />
      ))}
    </g>
  );
}

/** Brooklyn Bridge: two pointed-arch stone towers, a deck and the famous web of stays. */
function Brooklyn({ p, stone }: { p: Palette; stone: string }) {
  const towers = [1310, 1470];
  const cable = mix(p.ink, p.mid, 0.3);
  return (
    <g>
      <rect x={1215} y={744} width={420} height={7} fill={stone} />
      <g stroke={cable} fill="none">
        <path d="M1310 664 Q1268 706 1220 743 M1310 664 Q1390 792 1470 664 M1470 664 Q1552 706 1635 743" strokeWidth={3} />
        <g strokeWidth={1.1} opacity={0.6}>
          {[1244, 1262, 1280, 1298].map((d) => <line key={d} x1={1310} y1={668} x2={d} y2={744} />)}
          {[1330, 1360, 1390, 1420, 1450].map((d) => <line key={d} x1={d < 1390 ? 1310 : 1470} y1={668} x2={d} y2={744} />)}
          {[1492, 1514, 1536, 1558, 1580, 1602].map((d) => <line key={d} x1={1470} y1={668} x2={d} y2={744} />)}
        </g>
      </g>
      {towers.map((x) => (
        <g key={x} fill={stone}>
          <rect x={x - 17} y={676} width={9} height={126} />
          <rect x={x + 8} y={676} width={9} height={126} />
          <rect x={x - 17} y={664} width={34} height={16} />
          <rect x={x - 17} y={730} width={34} height={8} />
          <polygon points={`${x - 17},664 ${x},640 ${x + 17},664`} />
          <path d={`M${x - 8} 730 Q${x - 8} 700 ${x} 690 Q${x + 8} 700 ${x + 8} 730 Z`} />
        </g>
      ))}
    </g>
  );
}

function Skyline({ p, heroClass }: SkylineProps) {
  const stone = mix(p.near, p.ink, 0.22);
  const chrome = p.isDay ? mix(p.mid, p.skyBottom, 0.4) : mix(p.mid, p.window, 0.3);
  const green = mix(p.near, "#4fa88a", p.isDay ? 0.4 : 0.12);
  const cab = mix("#f6c026", p.near, p.isDay ? 0.1 : 0.5);

  return (
    <PaletteContext.Provider value={p}>
      {/* distant towers */}
      <Row seed={101} baseY={GROUND} minH={110} maxH={300} fill={p.far} />
      <Row seed={113} baseY={GROUND} minH={90} maxH={240} minW={56} maxW={104} fill={p.mid} gap={8} />

      {/* the harbour: Liberty on the left, Brooklyn Bridge on the right */}
      <Water x={-10} y={WATER_Y} w={620} h={GROUND - WATER_Y} p={p} />
      <Water x={1165} y={WATER_Y} w={470} h={GROUND - WATER_Y} p={p} />
      <Liberty x={400} p={p} green={green} />
      <g transform="translate(-40 0)">
        <Brooklyn p={p} stone={stone} />
      </g>

      {/* slabs */}
      <Block x={560} y={470} w={64} h={332} fill={p.mid} />
      <Block x={800} y={450} w={56} h={352} fill={p.mid} />
      <Block x={965} y={540} w={70} h={262} fill={p.mid} />

      {/* One World Trade: tapering shaft and a tall spire */}
      <g>
        <clipPath id="ny-wtc">
          <polygon points="672,802 728,802 728,546 708,336 692,336 672,546" />
        </clipPath>
        <polygon points="672,802 728,802 728,546 708,336 692,336 672,546" fill={stone} />
        <rect x={672} y={336} width={56} height={466} fill="url(#windows)" opacity={p.windowOpacity * 0.8} clipPath="url(#ny-wtc)" />
        <polygon points="700,802 728,802 728,546 708,336 700,336" fill="#fff" opacity={0.07} />
        <rect x={698.5} y={236} width={3} height={102} fill={stone} />
      </g>

      {/* Chrysler: stainless sunburst crown of stacked arches */}
      <g>
        <Block x={874} y={520} w={52} h={282} fill={stone} />
        {[0, 1, 2, 3, 4].map((k) => {
          const w = 56 - k * 9;
          const y = 522 - k * 20;
          return (
            <path
              key={k}
              d={`M${900 - w / 2} ${y} A${w / 2} 26 0 0 1 ${900 + w / 2} ${y} Z`}
              fill={k % 2 ? mix(chrome, p.ink, 0.12) : chrome}
            />
          );
        })}
        <rect x={898.5} y={346} width={3} height={70} fill={chrome} />
        {[528, 548, 568].map((y) => <rect key={y} x={874} y={y} width={52} height={3} fill={chrome} opacity={0.6} />)}
      </g>

      {/* near low-rises */}
      <Row seed={127} baseY={GROUND} minH={40} maxH={120} minW={64} maxW={116} fill={p.near} gap={14} from={590} to={1170} />
      <Row seed={131} baseY={GROUND} minH={30} maxH={80} minW={70} maxW={120} fill={p.near} gap={14} from={-60} to={140} />

      {/* ground, street and a taxi */}
      <rect x={0} y={GROUND} width={1600} height={100} fill={p.ground} />
      <rect x={0} y={GROUND + 62} width={1600} height={38} fill={mix(p.ground, p.ink, 0.3)} />
      {Array.from({ length: 24 }).map((_, i) => (
        <rect key={i} x={i * 70 + 10} y={GROUND + 82} width={32} height={3} fill="#fff" opacity={0.3} />
      ))}
      <Tree x={580} y={GROUND + 4} s={1.05} />
      <Tree x={1165} y={GROUND + 3} s={0.95} />
      <Tree x={1215} y={GROUND + 4} s={1.1} />
      <Tree x={110} y={GROUND + 4} s={1.1} />
      <g className="anim" style={{ animation: "walk 58s linear infinite", animationDelay: "-21s" }}>
        <g transform={`translate(0 ${GROUND + 76})`}>
          <rect x={0} y={-15} width={50} height={12} rx={3} fill={cab} />
          <path d="M11 -15 L16 -25 L35 -25 L40 -15 Z" fill={cab} />
          <path d="M18 -16 L21 -23 L26 -23 L26 -16 Z M28 -16 L28 -23 L33 -23 L36 -16 Z" fill={p.skyBottom} opacity={0.8} />
          <rect x={22} y={-29} width={8} height={4} rx={1} fill={cab} />
          <circle cx={12} cy={-3} r={4.5} fill={p.ink} />
          <circle cx={38} cy={-3} r={4.5} fill={p.ink} />
        </g>
      </g>

      {/* Empire State Building: stepped Art Deco setbacks, mast and antenna */}
      <g className={`hero ${heroClass}`} style={{ transformOrigin: "50% 100%" }}>
        {(
          [
            [140, 730, 802],
            [100, 640, 730],
            [74, 520, 640],
            [56, 440, 520],
            [40, 392, 440],
            [28, 366, 392],
            [16, 346, 366],
          ] as const
        ).map(([w, top, bot]) => (
          <Block key={top} x={ESB - w / 2} y={top} w={w} h={bot - top} fill={stone} />
        ))}
        {[640, 520, 440].map((y, i) => (
          <rect key={y} x={ESB - [50, 37, 28][i]} y={y} width={[100, 74, 56][i]} height={4} fill="#fff" opacity={0.1} />
        ))}
        <rect x={ESB - 30} y={520} width={5} height={282} fill="#fff" opacity={0.07} />
        {!p.isDay && <rect x={ESB - 14} y={366} width={28} height={74} fill={p.window} opacity={0.3} />}
        <rect x={ESB - 1.6} y={282} width={3.2} height={66} fill={stone} />
        <rect x={ESB - 0.8} y={252} width={1.6} height={32} fill={stone} />
        <circle cx={ESB} cy={252} r={2.2} fill={mix("#ff6b5b", p.near, p.isDay ? 0.2 : 0)} />
      </g>
    </PaletteContext.Provider>
  );
}

const newYork: CityScene = {
  id: "new-york",
  focusX: 900,
  groundY: GROUND,
  walkY: GROUND + 40,
  hero: {
    name: "The Empire State Building",
    box: { x: ESB - 70, y: 250, w: 140, h: 554 },
    base: { x: ESB, y: GROUND + 2 },
    top: { x: ESB, y: 252 },
  },
  accents: ["#f6c026", "#e5484d", "#3e63dd", "#ffffff", "#30a46c"],
  Skyline,
};

export default newYork;
