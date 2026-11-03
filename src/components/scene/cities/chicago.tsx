import { PaletteContext, Block, Row, Tree } from "../parts";
import { mix } from "../palette";
import type { CityScene, SkylineProps } from "../types";

const GROUND = 800;
const BEAN = { x: 1090, y: GROUND };

function Skyline({ p, heroClass }: SkylineProps) {
  const dark = mix(p.mid, p.ink, 0.45); // Willis/Hancock read as dark glass towers
  const silver = mix(p.skyBottom, "#ffffff", 0.45);
  return (
    <PaletteContext.Provider value={p}>
      {/* distant towers */}
      <Row seed={11} baseY={GROUND} minH={110} maxH={290} fill={p.far} />
      <Row seed={23} baseY={GROUND} minH={80} maxH={220} minW={60} maxW={110} fill={p.mid} gap={10} />

      {/* Aon / Prudential style slabs */}
      <Block x={760} y={400} w={74} h={402} fill={p.mid} />
      <Block x={940} y={470} w={66} h={332} fill={p.mid} />
      <Block x={480} y={500} w={70} h={302} fill={p.mid} />
      <Block x={565} y={440} w={58} h={362} fill={p.mid} />
      <Block x={1345} y={500} w={80} h={302} fill={p.mid} />

      {/* Trump Tower: stepped setbacks and a spire */}
      <g>
        <Block x={640} y={470} w={66} h={332} fill={p.near} />
        <Block x={648} y={425} w={50} h={48} fill={p.near} />
        <Block x={656} y={392} w={34} h={36} fill={p.near} />
        <rect x={671} y={340} width={3} height={54} fill={p.near} />
      </g>

      {/* Willis Tower: bundled tubes of different heights, twin antennas */}
      <g>
        {[
          { x: 320, h: 250 },
          { x: 350, h: 380 },
          { x: 380, h: 490 },
          { x: 410, h: 400 },
          { x: 440, h: 300 },
        ].map((t) => (
          <Block key={t.x} x={t.x} y={GROUND - t.h} w={30} h={t.h + 2} fill={dark} />
        ))}
        {[GROUND - 250, GROUND - 380, GROUND - 490].map((y) => (
          <rect key={y} x={320} y={y + 90} width={150} height={4} fill={mix(dark, "#fff", 0.1)} />
        ))}
        <rect x={386} y={GROUND - 560} width={5} height={72} fill={dark} />
        <rect x={403} y={GROUND - 560} width={5} height={72} fill={dark} />
      </g>

      {/* John Hancock: tapered with X bracing and twin antennas */}
      <g>
        <clipPath id="hancock-clip">
          <polygon points="1222,802 1318,802 1296,356 1244,356" />
        </clipPath>
        <polygon points="1222,802 1318,802 1296,356 1244,356" fill={dark} />
        <rect x={1222} y={356} width={96} height={446} fill="url(#windows)" opacity={p.windowOpacity * 0.8} clipPath="url(#hancock-clip)" />
        <g stroke={mix(dark, "#fff", 0.22)} strokeWidth={4} fill="none" opacity={0.7}>
          <path d="M1228 800 L1292 580 M1312 800 L1250 580" />
          <path d="M1250 580 L1292 360 M1292 580 L1250 360" />
        </g>
        <rect x={1256} y={296} width={4} height={62} fill={dark} />
        <rect x={1280} y={296} width={4} height={62} fill={dark} />
      </g>

      {/* near low-rises */}
      <Row seed={37} baseY={GROUND} minH={50} maxH={130} minW={70} maxW={130} fill={p.near} gap={16} from={-60} to={880} />
      <Row seed={41} baseY={GROUND} minH={50} maxH={120} minW={70} maxW={120} fill={p.near} gap={16} from={1180} to={1660} />

      {/* ground: Millennium Park plaza */}
      <rect x={0} y={GROUND} width={1600} height={100} fill={p.ground} />
      <rect x={930} y={GROUND} width={320} height={100} fill={mix(p.ground, p.skyBottom, 0.18)} />
      <rect x={0} y={GROUND + 56} width={1600} height={2} fill={p.ink} opacity={0.18} />
      <Tree x={870} y={GROUND + 4} s={1.1} />
      <Tree x={915} y={GROUND + 2} s={0.9} />
      <Tree x={1275} y={GROUND + 4} s={1.15} />
      <Tree x={1330} y={GROUND + 2} s={0.95} />
      <Tree x={90} y={GROUND + 4} s={1.1} />
      <Tree x={600} y={GROUND + 3} s={1} />

      {/* Cloud Gate ("The Bean") */}
      <g className={`hero ${heroClass}`} style={{ transformOrigin: "50% 100%" }}>
        <defs>
          <linearGradient id="bean-chrome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={silver} />
            <stop offset="0.55" stopColor={mix(p.skyTop, "#ffffff", 0.35)} />
            <stop offset="1" stopColor={mix(p.near, p.ink, 0.3)} />
          </linearGradient>
          <clipPath id="bean-clip">
            <path d={`M${BEAN.x - 80} ${BEAN.y} C ${BEAN.x - 84} ${BEAN.y - 100} ${BEAN.x + 84} ${BEAN.y - 100} ${BEAN.x + 80} ${BEAN.y} L ${BEAN.x + 46} ${BEAN.y} Q ${BEAN.x} ${BEAN.y - 36} ${BEAN.x - 46} ${BEAN.y} Z`} />
          </clipPath>
        </defs>
        <ellipse cx={BEAN.x} cy={BEAN.y + 4} rx={96} ry={7} fill={p.ink} opacity={0.25} />
        <path
          d={`M${BEAN.x - 80} ${BEAN.y} C ${BEAN.x - 84} ${BEAN.y - 100} ${BEAN.x + 84} ${BEAN.y - 100} ${BEAN.x + 80} ${BEAN.y} L ${BEAN.x + 46} ${BEAN.y} Q ${BEAN.x} ${BEAN.y - 36} ${BEAN.x - 46} ${BEAN.y} Z`}
          fill="url(#bean-chrome)"
        />
        {/* reflected skyline and highlights */}
        <g clipPath="url(#bean-clip)" opacity={0.55}>
          <rect x={BEAN.x - 62} y={BEAN.y - 44} width={10} height={44} fill={dark} />
          <rect x={BEAN.x - 46} y={BEAN.y - 58} width={9} height={58} fill={dark} />
          <rect x={BEAN.x - 28} y={BEAN.y - 40} width={12} height={40} fill={dark} />
          <rect x={BEAN.x + 10} y={BEAN.y - 52} width={9} height={52} fill={dark} />
          <rect x={BEAN.x + 34} y={BEAN.y - 36} width={11} height={36} fill={dark} />
        </g>
        <path
          d={`M${BEAN.x - 58} ${BEAN.y - 52} Q ${BEAN.x - 30} ${BEAN.y - 84} ${BEAN.x + 8} ${BEAN.y - 80}`}
          stroke="#fff"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
      </g>
    </PaletteContext.Provider>
  );
}

const chicago: CityScene = {
  id: "chicago",
  focusX: 1000,
  groundY: GROUND,
  walkY: GROUND + 40,
  hero: {
    name: "The Bean",
    box: { x: 1000, y: 700, w: 180, h: 110 },
    base: { x: BEAN.x, y: GROUND + 2 },
    top: { x: BEAN.x, y: GROUND - 96 },
  },
  accents: ["#f4b942", "#e5484d", "#3e63dd", "#30a46c", "#ffffff"],
  Skyline,
};

export default chicago;
