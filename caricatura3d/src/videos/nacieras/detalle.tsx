// Dibujo 2D detallado (nivel ilustración) para la serie «Si nacieras como…».
// Cada cosa lleva: color base, sombra, sombra profunda (donde se juntan las piezas), brillo y luz de la lámpara;
// contorno café oscuro (más grueso en la silueta), sombras de contacto en el piso y en la pared,
// texturas (tapiz, vetas de madera, tela acanalada, pelo) y el fondo desenfocado detrás del personaje.
import React from "react";
import { parpadea } from "./dibujo";

const T = "#1a120e"; // tinta
const LW = 3.2;

// ───────────────────────── sala de noche ─────────────────────────
export const SalaNoche: React.FC<{ f: number; id: string; desenfoque?: number }> = ({ f, id, desenfoque = 0 }) => {
  const p = (s: string) => `${id}-${s}`;
  const u = (s: string) => `url(#${p(s)})`;
  const marco = (k: string, x: number, y: number, w: number, h: number, foto: React.ReactNode) => (
    <g>
      <path d={`M ${x + w / 2} ${y - 40} L ${x + 20} ${y + 6} M ${x + w / 2} ${y - 40} L ${x + w - 20} ${y + 6}`} stroke="#2a1d15" strokeWidth={2} />
      <circle cx={x + w / 2} cy={y - 42} r={5} fill="#b8a070" stroke={T} strokeWidth={2} />
      <rect x={x + 10} y={y + 14} width={w} height={h} fill="#000" opacity={0.35} filter={u("sombra")} />
      <rect x={x} y={y} width={w} height={h} fill="#4a3022" stroke={T} strokeWidth={LW} />
      <rect x={x + 6} y={y + 6} width={w - 12} height={h - 12} fill="none" stroke="#a5824e" strokeWidth={3} />
      <rect x={x + 14} y={y + 14} width={w - 28} height={h - 28} fill="#2e1e15" />
      <rect x={x + 22} y={y + 22} width={w - 44} height={h - 44} fill="#e2d4b4" stroke="#6a5038" strokeWidth={2} />
      <defs><clipPath id={p("f" + k)}><rect x={x + 36} y={y + 36} width={w - 72} height={h - 72} /></clipPath></defs>
      <rect x={x + 36} y={y + 36} width={w - 72} height={h - 72} fill={u("sepia")} stroke="#5a4030" strokeWidth={2} />
      <g clipPath={`url(#${p("f" + k)})`}>{foto}<path d={`M ${x} ${y + h * 0.7} L ${x + w * 0.7} ${y} L ${x + w} ${y} L ${x + w} ${y + h * 0.1} L ${x + w * 0.1} ${y + h} Z`} fill="#fff" opacity={0.1} /></g>
    </g>
  );
  const gente = (cx: number, cy: number, r: number, ropa = "#5a4636", pelo = "#2c2018") => (
    <g>
      <path d={`M ${cx - r * 2} ${cy + r * 4.5} Q ${cx - r * 1.9} ${cy + r * 1.3} ${cx} ${cy + r * 1.2} Q ${cx + r * 1.9} ${cy + r * 1.3} ${cx + r * 2} ${cy + r * 4.5} Z`} fill={ropa} />
      <path d={`M ${cx - r * 0.4} ${cy + r * 1.2} L ${cx} ${cy + r * 2} L ${cx + r * 0.4} ${cy + r * 1.2} Z`} fill="#d8ccb2" />
      <circle cx={cx} cy={cy} r={r} fill="#8b6a4e" />
      <path d={`M ${cx - r * 1.05} ${cy - r * 0.1} Q ${cx - r} ${cy - r * 1.25} ${cx} ${cy - r * 1.2} Q ${cx + r} ${cy - r * 1.25} ${cx + r * 1.05} ${cy - r * 0.1} Q ${cx} ${cy - r * 0.7} ${cx - r * 1.05} ${cy - r * 0.1} Z`} fill={pelo} />
      <circle cx={cx + r * 0.3} cy={cy + r * 0.1} r={r * 0.7} fill="#5e4632" opacity={0.35} />
    </g>
  );
  const balaustre = (x: number, y: number) => (
    <g><rect x={x} y={y} width={12} height={120} fill="#e2d8c4" stroke={T} strokeWidth={2} /><rect x={x + 7} y={y} width={5} height={120} fill="#b5aa94" /><rect x={x - 3} y={y + 40} width={18} height={10} rx={4} fill="#e2d8c4" stroke={T} strokeWidth={2} /></g>
  );
  return (
    <g filter={desenfoque ? u("blur") : undefined}>
      <defs>
        <filter id={p("blur")} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={desenfoque} /></filter>
        <filter id={p("sombra")} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={9} /></filter>
        <filter id={p("brillo")} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation={26} /></filter>
        <pattern id={p("tapiz")} width="96" height="120" patternUnits="userSpaceOnUse">
          <rect width="96" height="120" fill="#5f6c47" />
          <path d="M 0 0 v 120 M 48 0 v 120" stroke="#58653f" strokeWidth="6" />
          <path d="M 48 18 q 16 18 0 40 q -16 -22 0 -40 Z M 48 58 q 12 10 0 26 q -12 -16 0 -26 Z" fill="#6f7d53" />
          <path d="M 36 40 q -14 4 -18 18 q 12 -2 18 -18 Z M 60 40 q 14 4 18 18 q -12 -2 -18 -18 Z" fill="#6a784e" />
          <circle cx="0" cy="96" r="5" fill="#73825a" /><circle cx="96" cy="96" r="5" fill="#73825a" /><circle cx="48" cy="104" r="2.5" fill="#7c8a60" />
        </pattern>
        <pattern id={p("madera")} width="240" height="80" patternUnits="userSpaceOnUse">
          <rect width="240" height="80" fill="#5c3b26" />
          <path d="M 0 0 H 240" stroke="#2c1a10" strokeWidth="4" /><path d="M 120 0 V 80" stroke="#2c1a10" strokeWidth="3" />
          <path d="M 10 30 Q 60 22 110 32 M 130 52 Q 180 44 232 54 M 20 60 Q 60 56 100 62" fill="none" stroke="#4c3020" strokeWidth="2.5" />
          <path d="M 4 6 H 116 M 124 6 H 236" stroke="#7a5236" strokeWidth="2" opacity="0.6" />
        </pattern>
        <pattern id={p("alfombra")} width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="#3a5274" /><path d="M 30 8 L 52 30 L 30 52 L 8 30 Z" fill="none" stroke="#4d6890" strokeWidth="4" /><circle cx="30" cy="30" r="5" fill="#8a6a3a" />
        </pattern>
        <linearGradient id={p("pared")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity={0.62} /><stop offset="0.45" stopColor="#000" stopOpacity={0.15} /><stop offset="1" stopColor="#000" stopOpacity={0.45} /></linearGradient>
        <radialGradient id={p("luzlamp")} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffdb94" stopOpacity={0.85} /><stop offset="0.35" stopColor="#ffb85c" stopOpacity={0.32} /><stop offset="1" stopColor="#ff9a3c" stopOpacity={0} /></radialGradient>
        <linearGradient id={p("cono")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd48a" stopOpacity={0.5} /><stop offset="1" stopColor="#ffd48a" stopOpacity={0} /></linearGradient>
        <linearGradient id={p("pantalla")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e9b55c" /><stop offset="0.5" stopColor="#fff1c4" /><stop offset="1" stopColor="#e2a64c" /></linearGradient>
        <linearGradient id={p("cortina")} x1="0" y1="0" x2="1" y2="0">{Array.from({ length: 9 }).map((_, i) => <stop key={i} offset={i / 8} stopColor={["#c99a3e", "#8e6524", "#d8aa4a", "#9a6e28", "#cf9f42", "#87601f", "#d4a646", "#94692a", "#c49640"][i]} />)}</linearGradient>
        <linearGradient id={p("cortinaS")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity={0.35} /><stop offset="0.3" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.3} /></linearGradient>
        <linearGradient id={p("sillon")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d8c6a0" /><stop offset="1" stopColor="#9f8c69" /></linearGradient>
        <linearGradient id={p("cojin")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#d2c09a" /><stop offset="0.75" stopColor="#bba985" /><stop offset="1" stopColor="#8f7d5c" /></linearGradient>
        <linearGradient id={p("cielo")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#101a36" /><stop offset="1" stopColor="#2d3e66" /></linearGradient>
        <linearGradient id={p("sepia")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#c9b590" /><stop offset="1" stopColor="#a68f68" /></linearGradient>
        <linearGradient id={p("tele")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2c3a44" /><stop offset="1" stopColor="#0c1216" /></linearGradient>
        <linearGradient id={p("luna")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7d93c4" stopOpacity={0.3} /><stop offset="1" stopColor="#7d93c4" stopOpacity={0} /></linearGradient>
      </defs>

      {/* ── pared ── */}
      <rect width={1080} height={1300} fill={u("tapiz")} />
      <ellipse cx={300} cy={700} rx={160} ry={120} fill="#3f4a2c" opacity={0.18} filter={u("brillo")} />
      <ellipse cx={180} cy={1150} rx={200} ry={90} fill="#3f4a2c" opacity={0.25} filter={u("brillo")} />
      <rect width={1080} height={1300} fill={u("pared")} />
      {/* techo y moldura */}
      <rect width={1080} height={70} fill="#2a1e17" />
      <rect y={70} width={1080} height={18} fill="#6b5240" stroke={T} strokeWidth={2} />
      <rect y={88} width={1080} height={10} fill="#4a3628" />
      <rect y={98} width={1080} height={18} fill="#000" opacity={0.25} filter={u("sombra")} />
      <ellipse cx={600} cy={74} rx={110} ry={18} fill="#f1e2b8" stroke={T} strokeWidth={LW} />
      <ellipse cx={600} cy={74} rx={80} ry={10} fill="#fff6dc" />
      <ellipse cx={600} cy={120} rx={260} ry={80} fill="#ffe2a8" opacity={0.18} filter={u("brillo")} />
      {/* escalera con alfombra y barandal */}
      <path d="M 0 330 L 250 1300 L 0 1300 Z" fill="#4a3426" />
      {Array.from({ length: 10 }).map((_, i) => { const y = 1300 - i * 97, x = 250 - i * 25; return <g key={i}><rect x={0} y={y - 97} width={x} height={18} fill="#6e4f39" stroke={T} strokeWidth={2} /><rect x={0} y={y - 79} width={x - 8} height={79} fill="#3e2b1f" /><rect x={x * 0.35} y={y - 97} width={x * 0.35} height={97} fill="#7e2c26" opacity={0.85} /><rect x={x * 0.35} y={y - 79} width={x * 0.35} height={14} fill="#000" opacity={0.25} /></g>; })}
      {Array.from({ length: 10 }).map((_, i) => balaustre(30 + i * 25, 400 + i * 93))}
      <path d="M 14 300 L 280 1245" stroke="#2c1d14" strokeWidth={28} strokeLinecap="round" />
      <path d="M 14 300 L 280 1245" stroke="#5a3d2a" strokeWidth={20} strokeLinecap="round" />
      <path d="M 10 296 L 276 1240" stroke="#8a6448" strokeWidth={5} strokeLinecap="round" />
      <rect x={258} y={1090} width={42} height={210} fill="#5a3d2a" stroke={T} strokeWidth={LW} />
      <rect x={282} y={1090} width={18} height={210} fill="#3e2a1d" />
      <rect x={250} y={1078} width={58} height={22} rx={4} fill="#6e4f39" stroke={T} strokeWidth={LW} />
      <circle cx={279} cy={1062} r={18} fill="#6e4f39" stroke={T} strokeWidth={LW} /><circle cx={273} cy={1056} r={6} fill="#9a7458" />
      {/* apagador y contacto */}
      <rect x={318} y={780} width={36} height={58} rx={4} fill="#d8ccb0" stroke={T} strokeWidth={2} /><rect x={332} y={796} width={8} height={24} rx={2} fill="#a89c80" />
      <rect x={760} y={1220} width={30} height={44} rx={3} fill="#d8ccb0" stroke={T} strokeWidth={2} /><circle cx={775} cy={1236} r={3} fill="#5a5040" /><circle cx={775} cy={1250} r={3} fill="#5a5040" />
      {/* retratos familiares */}
      {marco("a", 330, 230, 230, 290, <g>{gente(445, 350, 40, "#3e3028")}{gente(445, 480, 0.1)}</g>)}
      {marco("b", 590, 270, 280, 220, <g>{gente(650, 360, 22, "#6a5444")}{gente(728, 350, 26, "#4a3a30")}{gente(805, 364, 20, "#7a6050")}</g>)}
      {marco("c", 890, 210, 170, 250, <g>{gente(945, 320, 24, "#504034")}{gente(1012, 340, 21, "#6a5444", "#1e1610")}</g>)}
      {/* ventana de noche */}
      <rect x={620} y={560} width={340} height={420} fill="#000" opacity={0.4} filter={u("sombra")} />
      <rect x={610} y={548} width={340} height={420} fill="#4a3426" stroke={T} strokeWidth={LW} />
      <rect x={632} y={570} width={296} height={376} fill={u("cielo")} stroke={T} strokeWidth={LW} />
      <circle cx={850} cy={640} r={70} fill="#f4ecd0" opacity={0.12} />
      <circle cx={850} cy={640} r={26} fill="#f4ecd0" /><circle cx={842} cy={634} r={6} fill="#ddd2b0" /><circle cx={858} cy={648} r={4} fill="#ddd2b0" />
      {[[670, 600], [740, 700], [680, 820], [900, 760], [790, 600], [710, 650], [880, 700]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.2} fill="#e8eaf6" opacity={0.8} />)}
      <path d="M 632 900 L 690 870 L 700 830 L 760 860 L 820 840 L 830 870 L 928 860 L 928 946 L 632 946 Z" fill="#0b1124" />
      {[[660, 880], [700, 850], [800, 860], [880, 870]].map(([x, y], i) => <rect key={i} x={x} y={y} width={10} height={12} fill="#f2c46a" opacity={0.8} />)}
      <path d="M 900 946 Q 905 860 896 800 M 896 800 q -40 -6 -60 18 M 896 800 q 40 -10 58 14 M 896 800 q -20 -30 -46 -30 M 896 800 q 24 -30 44 -24" fill="none" stroke="#0b1124" strokeWidth={6} strokeLinecap="round" />
      <path d="M 780 570 V 946 M 632 760 H 928" stroke="#4a3426" strokeWidth={12} />
      <path d="M 780 570 V 946 M 632 760 H 928" stroke="#6e5040" strokeWidth={4} />
      <path d="M 640 580 L 770 580 L 640 700 Z" fill="#fff" opacity={0.06} />
      <rect x={596} y={968} width={368} height={26} rx={4} fill="#5a3d2a" stroke={T} strokeWidth={LW} />
      <rect x={600} y={994} width={360} height={14} fill="#000" opacity={0.3} filter={u("sombra")} />
      {/* luz de luna en la pared/piso */}
      <path d="M 632 994 L 928 994 L 1080 1500 L 520 1500 Z" fill={u("luna")} />
      {/* cortinas */}
      {[[560, 1], [1000, -1]].map(([x, d], i) => (
        <g key={i}>
          <path d={`M ${x} 520 Q ${x + d * 50} 760 ${x + d * 12} 1010 L ${x + d * 120} 1010 Q ${x + d * 100} 760 ${x + d * 110} 520 Z`} fill={u("cortina")} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
          <path d={`M ${x} 520 Q ${x + d * 50} 760 ${x + d * 12} 1010 L ${x + d * 120} 1010 Q ${x + d * 100} 760 ${x + d * 110} 520 Z`} fill={u("cortinaS")} />
          <path d={`M ${x + d * 40} 530 Q ${x + d * 60} 760 ${x + d * 44} 1000 M ${x + d * 78} 530 Q ${x + d * 86} 760 ${x + d * 80} 1000`} fill="none" stroke="#6e4c18" strokeWidth={3} opacity={0.7} />
          <path d={`M ${x + d * 6} 1010 q ${d * 20} 10 ${d * 40} 0 q ${d * 20} 10 ${d * 40} 0 q ${d * 20} 10 ${d * 34} 0`} fill="none" stroke={T} strokeWidth={2.5} />
          <path d={`M ${x + d * 4} 780 q ${d * 60} 20 ${d * 116} 0`} fill="none" stroke="#7e2c26" strokeWidth={10} strokeLinecap="round" />
        </g>
      ))}
      <rect x={540} y={506} width={480} height={18} rx={9} fill="#3e2a1d" stroke={T} strokeWidth={LW} />
      <circle cx={540} cy={515} r={16} fill="#b8944e" stroke={T} strokeWidth={LW} /><circle cx={1020} cy={515} r={16} fill="#b8944e" stroke={T} strokeWidth={LW} />
      {/* rodapié */}
      <rect y={1268} width={1080} height={40} fill="#3a281c" stroke={T} strokeWidth={LW} />
      <rect y={1270} width={1080} height={6} fill="#6a4c36" />
      {/* piso de madera */}
      <rect y={1308} width={1080} height={620} fill={u("madera")} />
      <rect y={1308} width={1080} height={620} fill="#000" opacity={0.25} />
      <ellipse cx={980} cy={1420} rx={260} ry={60} fill="#ffcf86" opacity={0.18} filter={u("brillo")} />
      {/* tapete */}
      <path d="M 110 1440 L 970 1440 L 1070 1740 L 10 1740 Z" fill={u("alfombra")} stroke={T} strokeWidth={LW} />
      <path d="M 150 1466 L 930 1466 L 1018 1714 L 62 1714 Z" fill="none" stroke="#c8a258" strokeWidth={8} />
      <path d="M 176 1486 L 904 1486 L 984 1694 L 96 1694 Z" fill="none" stroke="#7a2a24" strokeWidth={5} />
      {Array.from({ length: 50 }).map((_, i) => <path key={i} d={`M ${14 + i * 21.2} 1742 v 16`} stroke="#d8ccb0" strokeWidth={3} />)}
      <path d="M 110 1440 L 970 1440 L 1070 1740 L 10 1740 Z" fill="#000" opacity={0.2} />
      {/* mesita con planta (izquierda del sillón) */}
      <ellipse cx={170} cy={1330} rx={90} ry={14} fill="#000" opacity={0.45} filter={u("sombra")} />
      <rect x={100} y={1170} width={140} height={20} fill="#5a3d2a" stroke={T} strokeWidth={LW} />
      <path d="M 112 1190 L 104 1330 M 228 1190 L 236 1330" stroke="#3e2a1d" strokeWidth={12} strokeLinecap="round" />
      <path d="M 140 1170 L 132 1110 L 208 1110 L 200 1170 Z" fill="#a8502e" stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      <rect x={128} y={1104} width={84} height={14} rx={4} fill="#b8603a" stroke={T} strokeWidth={2.5} />
      {[[-60, 60], [-30, 90], [0, 100], [30, 88], [55, 64], [-45, 40], [45, 40]].map(([dx, h], i) => <path key={i} d={`M 170 1106 Q ${170 + dx * 0.4} ${1106 - h * 0.6} ${170 + dx} ${1106 - h} Q ${170 + dx * 0.8} ${1106 - h * 0.4} 172 1106 Z`} fill={i % 2 ? "#4f7a3e" : "#3e6332"} stroke={T} strokeWidth={2} />)}
      {/* sillón */}
      <ellipse cx={560} cy={1300} rx={420} ry={40} fill="#000" opacity={0.5} filter={u("sombra")} />
      <path d="M 260 980 L 870 980 L 900 1180 L 230 1180 Z" fill="#000" opacity={0.35} filter={u("sombra")} transform="translate(14 -24)" />
      <path d="M 250 1020 Q 240 968 300 962 L 820 962 Q 880 968 870 1020 L 876 1200 L 244 1200 Z" fill={u("sillon")} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      {[0, 1, 2].map((k) => { const x0 = 270 + k * 194; return <g key={k}><path d={`M ${x0} 994 Q ${x0 + 92} 976 ${x0 + 184} 994 L ${x0 + 184} 1150 L ${x0} 1150 Z`} fill={u("cojin")} stroke={T} strokeWidth={2.5} />{[0.25, 0.5, 0.75].map((q, j) => <g key={j}><circle cx={x0 + 184 * q} cy={1060} r={4} fill="#7e6c4e" /><path d={`M ${x0 + 184 * q - 14} 1052 l 14 8 l 14 -8`} fill="none" stroke="#9a8866" strokeWidth={2} /></g>)}<path d={`M ${x0 + 10} 1000 Q ${x0 + 92} 986 ${x0 + 174} 1000`} fill="none" stroke="#efe0bc" strokeWidth={3} opacity={0.7} /></g>; })}
      <path d="M 220 1150 L 900 1150 L 912 1290 L 208 1290 Z" fill="#a8956f" stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      {[0, 1, 2].map((k) => { const x0 = 238 + k * 216; return <g key={k}><path d={`M ${x0} 1158 h 212 v 64 q -106 10 -212 0 Z`} fill={u("cojin")} stroke={T} strokeWidth={2.5} /><path d={`M ${x0 + 8} 1164 h 196`} stroke="#efe0bc" strokeWidth={3} opacity={0.6} /></g>; })}
      {Array.from({ length: 14 }).map((_, i) => <path key={i} d={`M ${226 + i * 49} 1236 v 52`} stroke="#8a7856" strokeWidth={2.5} />)}
      {[[180, 1], [940, -1]].map(([x, d], i) => <g key={i}>
        <path d={`M ${x} 1080 Q ${x - d * 14} 1030 ${x + d * 40} 1030 Q ${x + d * 96} 1030 ${x + d * 96} 1086 L ${x + d * 96} 1300 L ${x} 1300 Z`} fill="#bba985" stroke={T} strokeWidth={LW} strokeLinejoin="round" />
        <path d={`M ${x + d * 10} 1060 Q ${x + d * 40} 1040 ${x + d * 70} 1060 Q ${x + d * 48} 1074 ${x + d * 30} 1066`} fill="none" stroke="#8a7856" strokeWidth={3} />
        <path d={`M ${x + d * 70} 1090 L ${x + d * 70} 1296`} stroke="#9c8a66" strokeWidth={10} opacity={0.6} />
        <rect x={x + (d > 0 ? 10 : -30)} y={1296} width={20} height={20} fill="#3e2a1d" stroke={T} strokeWidth={2} />
      </g>)}
      <path d="M 620 1040 Q 730 1000 820 1050 L 812 1146 Q 712 1124 628 1146 Z" fill="#9a3a2c" stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      <path d="M 640 1060 Q 720 1080 800 1066 M 716 1020 Q 712 1080 720 1134" fill="none" stroke="#6e2218" strokeWidth={4} />
      <path d="M 630 1050 Q 700 1024 760 1036" fill="none" stroke="#c86a58" strokeWidth={4} />
      {/* tele vieja con videocasetera */}
      <ellipse cx={60} cy={1420} rx={140} ry={20} fill="#000" opacity={0.5} filter={u("sombra")} />
      <rect x={-60} y={1210} width={230} height={210} fill="#4a3022" stroke={T} strokeWidth={LW} />
      <path d="M -50 1240 H 160 M -50 1300 H 160 M -50 1360 H 160" stroke="#3a2418" strokeWidth={3} />
      <rect x={-40} y={1220} width={180} height={34} rx={3} fill="#1e1e22" stroke={T} strokeWidth={2} /><rect x={80} y={1230} width={46} height={12} fill="#3cd06a" opacity={0.7} />
      <rect x={-60} y={1040} width={210} height={176} rx={16} fill="#3a3530" stroke={T} strokeWidth={LW} />
      <rect x={-40} y={1060} width={134} height={128} rx={18} fill={u("tele")} stroke={T} strokeWidth={LW} />
      <path d="M -30 1072 Q 20 1062 70 1074 L 60 1110 Q 10 1100 -26 1110 Z" fill="#fff" opacity={0.08} />
      <circle cx={122} cy={1086} r={10} fill="#bfb5a0" stroke={T} strokeWidth={2} /><circle cx={122} cy={1120} r={10} fill="#bfb5a0" stroke={T} strokeWidth={2} />
      {[0, 1, 2, 3].map((i) => <path key={i} d={`M 108 ${1146 + i * 9} h 28`} stroke="#1e1a17" strokeWidth={3} />)}
      <path d="M 40 1040 L 0 950 M 60 1040 L 110 960" stroke="#9a9488" strokeWidth={4} strokeLinecap="round" /><circle cx={0} cy={950} r={5} fill="#9a9488" /><circle cx={110} cy={960} r={5} fill="#9a9488" />
      {/* lámpara de pie */}
      <path d="M 900 800 L 1080 800 L 1080 1300 L 760 1300 Z" fill={u("cono")} opacity={0.6} style={{ mixBlendMode: "screen" }} />
      <circle cx={985} cy={740} r={340} fill={u("luzlamp")} style={{ mixBlendMode: "screen" }} />
      <ellipse cx={985} cy={1306} rx={60} ry={12} fill="#000" opacity={0.5} filter={u("sombra")} />
      <rect x={979} y={800} width={12} height={490} fill="#2e2018" stroke={T} strokeWidth={1.5} /><rect x={985} y={800} width={4} height={490} fill="#6a4c36" />
      <ellipse cx={985} cy={1296} rx={52} ry={12} fill="#3e2a1d" stroke={T} strokeWidth={2.5} />
      <path d="M 912 802 L 936 688 L 1034 688 L 1058 802 Z" fill={u("pantalla")} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      {[0.2, 0.4, 0.6, 0.8].map((q, i) => <path key={i} d={`M ${936 + 98 * q} 690 L ${912 + 146 * q} 800`} stroke="#d39a48" strokeWidth={2} opacity={0.7} />)}
      <circle cx={985} cy={740} r={90} fill="#fff1c4" opacity={0.35} filter={u("brillo")} />
      <path d="M 985 1296 Q 1020 1320 1080 1318" fill="none" stroke="#1e1612" strokeWidth={3} />
      {/* luz y sombra general */}
      <rect width={1080} height={1920} fill="#1a1230" opacity={0.3} style={{ mixBlendMode: "multiply" }} />
      <ellipse cx={900} cy={880} rx={760} ry={860} fill={u("luzlamp")} opacity={0.28} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};

// ───────────────────────── busto de adulto (CJ, diseño propio) ─────────────────────────
export type Gesto = { mirarX?: number; mirarY?: number; cabeza?: number; cejas?: number; boca?: "seria" | "abierta" | "media" };
const CAB = "M -112 -30 C -118 -150 -58 -186 2 -186 C 70 -186 122 -150 116 -30 C 114 44 100 104 74 142 C 50 172 24 184 2 184 C -22 184 -52 172 -78 142 C -102 106 -112 46 -112 -30 Z";
// tonos de piel
const PIEL = "#8a573a", SOM = "#653d27", PROF = "#45281a", LUZ = "#b67c52", BORDE = "#e7a46a";

export const BustoCJ: React.FC<{ f: number; x: number; y: number; s?: number; id: string; g?: Gesto; semilla?: number }> = ({ f, x, y, s = 1, id, g = {}, semilla = 1 }) => {
  const p = (k: string) => `${id}-${k}`;
  const u = (k: string) => `url(#${p(k)})`;
  const resp = Math.sin(f * 0.1) * 4;
  const cerr = parpadea(f, semilla), mx = (g.mirarX ?? 0) * 7, my = (g.mirarY ?? 0) * 4, ce = g.cejas ?? 0.3;
  const ojoD = (cx: number) => `M ${cx - 30} 4 Q ${cx - 4} -13 ${cx + 28} 2 Q ${cx} 14 ${cx - 30} 4 Z`;
  const ojo = (cx: number, lado: 1 | -1) => (
    <g>
      <path d={`M ${cx - 38} -6 Q ${cx} -30 ${cx + 36} -8 L ${cx + 32} 8 Q ${cx} 22 ${cx - 34} 8 Z`} fill={SOM} opacity={0.55} />
      <path d={ojoD(cx)} fill="#ece2d2" />
      <defs><clipPath id={p("ojo" + lado)}><path d={ojoD(cx)} /></clipPath></defs>
      {!cerr && <g clipPath={u("ojo" + lado)}>
        <circle cx={cx + mx} cy={2 + my} r={13.5} fill={u("iris")} /><circle cx={cx + mx} cy={2 + my} r={6.5} fill="#0c0604" />
        <circle cx={cx + mx + 5} cy={-3 + my} r={3.4} fill="#fff" /><circle cx={cx + mx - 5} cy={7 + my} r={1.6} fill="#fff" opacity={0.6} />
        <path d={`M ${cx - 32} -6 Q ${cx} -14 ${cx + 30} -6 L ${cx + 30} 2 Q ${cx} -6 ${cx - 32} 4 Z`} fill="#000" opacity={0.3} />
      </g>}
      {cerr ? <path d={`M ${cx - 32} 4 Q ${cx} 15 ${cx + 30} 2`} fill="none" stroke={T} strokeWidth={6} strokeLinecap="round" />
        : <path d={`M ${cx - 34} 6 Q ${cx - 4} -16 ${cx + 32} 1 L ${cx + 36} -2`} fill="none" stroke={T} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />}
      <path d={`M ${cx - 26} 14 Q ${cx} 22 ${cx + 24} 10`} fill="none" stroke={PROF} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      <path d={`M ${cx - 28} -20 Q ${cx} -32 ${cx + 26} -18`} fill="none" stroke={PROF} strokeWidth={3.5} opacity={0.8} />
    </g>
  );
  const boca = g.boca ?? "seria";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <clipPath id={p("cab")}><path d={CAB} /></clipPath>
        <clipPath id={p("tor")}><path d="M -360 720 L -350 430 Q -340 310 -250 280 Q -160 250 -90 240 L 90 240 Q 160 250 250 280 Q 340 310 350 430 L 360 720 Z" /></clipPath>
        <clipPath id={p("cam")}><path d="M -206 720 L -202 420 Q -206 306 -158 262 L -104 254 Q -56 372 0 376 Q 56 372 104 254 L 158 262 Q 206 306 202 420 L 206 720 Z" /></clipPath>
        <linearGradient id={p("camiseta")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#a8a092" /><stop offset="0.3" stopColor="#d9d2c4" /><stop offset="0.6" stopColor="#efe9dd" /><stop offset="1" stopColor="#ded6c6" /></linearGradient>
        <linearGradient id={p("piel")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={PROF} /><stop offset="0.25" stopColor={SOM} /><stop offset="0.5" stopColor={PIEL} /><stop offset="0.85" stopColor={PIEL} /><stop offset="1" stopColor={LUZ} /></linearGradient>
        <radialGradient id={p("iris")}><stop offset="0" stopColor="#5a3420" /><stop offset="0.7" stopColor="#3a2014" /><stop offset="1" stopColor="#1c0e08" /></radialGradient>
        <pattern id={p("pelo")} width="14" height="12" patternUnits="userSpaceOnUse"><rect width="14" height="12" fill="#17100c" /><path d="M 2 9 l 3 -5 M 9 11 l 3 -5" stroke="#2e2119" strokeWidth="2" strokeLinecap="round" /></pattern>
        <pattern id={p("barba")} width="9" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.1" fill="#1a0f0a" /><circle cx="6.5" cy="6" r="1.1" fill="#1a0f0a" /></pattern>
        <pattern id={p("rib")} width="13" height="40" patternUnits="userSpaceOnUse"><rect width="13" height="40" fill="#fff" opacity="0" /><path d="M 3 0 V 40" stroke="#8a8274" strokeWidth="2" opacity="0.35" /></pattern>
      </defs>
      {/* ── hombros, brazos y pecho ── */}
      <g transform={`translate(0 ${resp})`}>
        <path d="M -360 720 L -350 430 Q -340 310 -250 280 Q -160 250 -90 240 L 90 240 Q 160 250 250 280 Q 340 310 350 430 L 360 720 Z" fill={u("piel")} />
        <g clipPath={u("tor")}>
          {/* deltoides y brazos */}
          <path d="M -360 420 Q -350 300 -250 284 Q -200 300 -214 420 Q -230 500 -260 560 Q -320 520 -360 500 Z" fill={SOM} opacity={0.55} />
          <path d="M -346 440 Q -330 330 -262 306" fill="none" stroke={PIEL} strokeWidth={14} opacity={0.6} strokeLinecap="round" />
          <path d="M 250 284 Q 350 300 360 420 L 360 500 Q 320 520 262 560 Q 232 500 216 420 Q 206 310 250 284 Z" fill={LUZ} opacity={0.35} />
          <path d="M 300 300 Q 352 340 356 460" fill="none" stroke={BORDE} strokeWidth={9} opacity={0.75} strokeLinecap="round" />
          <path d="M -270 560 Q -250 640 -262 720 M 270 560 Q 252 640 262 720" fill="none" stroke={T} strokeWidth={LW} />
          <path d="M -300 600 Q -280 660 -290 720" fill="none" stroke={PROF} strokeWidth={18} opacity={0.4} />
          <path d="M -236 330 Q -210 360 -214 430 M 236 330 Q 210 360 214 430" fill="none" stroke={PROF} strokeWidth={4} opacity={0.7} />
          {/* sombra en las axilas */}
          <path d="M -214 420 Q -230 520 -270 560 L -206 600 Z M 214 420 Q 230 520 270 560 L 206 600 Z" fill={PROF} opacity={0.75} />
          {/* trapecios y clavículas */}
          <path d="M -90 240 Q -160 250 -230 284 Q -150 280 -110 300 Z M 90 240 Q 160 250 230 284 Q 150 280 110 300 Z" fill={SOM} opacity={0.5} />
          <path d="M -100 296 Q -60 312 -20 300 M 100 296 Q 60 312 20 300" fill="none" stroke={PROF} strokeWidth={4} opacity={0.75} strokeLinecap="round" />
          <path d="M -96 288 Q -60 300 -24 292" fill="none" stroke={LUZ} strokeWidth={3} opacity={0.6} />
        </g>
        <path d="M -360 720 L -350 430 Q -340 310 -250 280 Q -160 250 -90 240 L 90 240 Q 160 250 250 280 Q 340 310 350 430 L 360 720" fill="none" stroke={T} strokeWidth={LW + 2} strokeLinejoin="round" />
        {/* camiseta sin mangas acanalada */}
        <path d="M -206 720 L -202 420 Q -206 306 -158 262 L -104 254 Q -56 372 0 376 Q 56 372 104 254 L 158 262 Q 206 306 202 420 L 206 720 Z" fill={u("camiseta")} />
        <g clipPath={u("cam")}>
          <rect x={-210} y={240} width={420} height={480} fill={u("rib")} />
          <path d="M -206 380 Q -170 520 -200 720 L -260 720 L -260 380 Z" fill="#7d7568" opacity={0.45} />
          <path d="M -160 450 Q -90 488 -10 460 Q -60 520 -150 500 Z" fill="#9a9284" opacity={0.45} />
          <path d="M 20 470 Q 100 500 170 450 Q 120 530 30 520 Z" fill="#9a9284" opacity={0.35} />
          <path d="M -150 450 Q -80 480 -14 456 M 26 466 Q 100 490 164 448" fill="none" stroke="#7e7668" strokeWidth={3.5} strokeLinecap="round" />
          <path d="M -120 600 Q -60 624 0 604 M 20 640 Q 80 660 150 630 M -180 560 Q -176 630 -186 700 M 130 560 Q 150 600 140 680" fill="none" stroke="#8e8678" strokeWidth={3} strokeLinecap="round" opacity={0.85} />
          <path d="M 120 300 Q 180 360 190 460" fill="none" stroke="#fffdf6" strokeWidth={10} opacity={0.6} strokeLinecap="round" />
        </g>
        <path d="M -206 720 L -202 420 Q -206 306 -158 262 L -104 254 Q -56 372 0 376 Q 56 372 104 254 L 158 262 Q 206 306 202 420 L 206 720" fill="none" stroke={T} strokeWidth={LW} strokeLinejoin="round" />
        <path d="M -104 254 Q -56 372 0 376 Q 56 372 104 254" fill="none" stroke="#7e7668" strokeWidth={12} />
        <path d="M -104 254 Q -56 372 0 376 Q 56 372 104 254" fill="none" stroke="#c9c1b2" strokeWidth={5} />
        <path d="M -158 262 Q -206 306 -202 420" fill="none" stroke="#7e7668" strokeWidth={10} />
        <path d="M 158 262 Q 206 306 202 420" fill="none" stroke="#a49c8e" strokeWidth={10} />
      </g>
      {/* ── cuello ── */}
      <path d="M -74 110 L -82 262 Q 0 296 82 262 L 74 110 Z" fill={PIEL} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      <path d="M -82 262 L -74 110 L -30 110 Q -50 200 -40 280 Z" fill={SOM} opacity={0.65} />
      <path d="M -74 140 Q 0 230 74 140 L 74 110 L -74 110 Z" fill={PROF} opacity={0.8} />
      <path d="M -50 200 Q -34 248 -12 276 M 50 200 Q 34 248 12 276" fill="none" stroke={PROF} strokeWidth={4} opacity={0.75} />
      <path d="M -6 208 Q 0 226 6 208" fill="none" stroke={SOM} strokeWidth={4} />
      <path d="M 56 170 Q 66 220 62 260" fill="none" stroke={BORDE} strokeWidth={5} opacity={0.6} strokeLinecap="round" />
      {/* ── cabeza ── */}
      <g transform={`translate(0 30) scale(1.14) rotate(${(g.cabeza ?? 0) + 1.2 * Math.sin(f * 0.045)})`}>
        {/* orejas */}
        {[-1, 1].map((d) => <g key={d}>
          <path d={`M ${d * 112} -16 C ${d * 142} -28 ${d * 150} 40 ${d * 118} 66 Q ${d * 108} 72 ${d * 104} 58 Z`} fill={d < 0 ? SOM : PIEL} stroke={T} strokeWidth={LW} />
          <path d={`M ${d * 120} 0 Q ${d * 136} 24 ${d * 120} 48 M ${d * 116} 14 Q ${d * 126} 24 ${d * 116} 36`} fill="none" stroke={PROF} strokeWidth={4} strokeLinecap="round" />
        </g>)}
        <path d={CAB} fill={PIEL} />
        <g clipPath={u("cab")}>
          {/* sombras de la cara (luz de la lámpara a la derecha) */}
          <path d="M -130 -200 L -56 -200 Q -88 -100 -76 -10 Q -64 90 -40 196 L -130 196 Z" fill={SOM} opacity={0.6} />
          <path d="M -130 -200 L -90 -200 Q -110 0 -80 196 L -130 196 Z" fill={PROF} opacity={0.5} />
          <path d="M -100 -60 Q -76 -84 -40 -78 Q -70 -50 -96 -30 Z" fill={PROF} opacity={0.35} />
          <path d="M -86 40 Q -66 96 -14 112 Q -50 150 -80 140 Z" fill={PROF} opacity={0.45} />
          <path d="M 40 30 Q 80 50 92 90 Q 70 70 44 64 Z" fill={SOM} opacity={0.45} />
          <path d="M 100 -110 Q 134 0 86 156 L 150 156 L 150 -110 Z" fill={LUZ} opacity={0.65} />
          <path d="M 106 -60 Q 124 20 96 120" fill="none" stroke={BORDE} strokeWidth={7} opacity={0.8} strokeLinecap="round" />
          <path d="M 30 -110 Q 60 -112 80 -96" fill="none" stroke={LUZ} strokeWidth={10} opacity={0.6} strokeLinecap="round" />
          <path d="M 50 10 Q 70 20 74 40" fill="none" stroke={LUZ} strokeWidth={9} opacity={0.6} strokeLinecap="round" />
          <path d="M -6 150 Q 2 160 12 150" fill="none" stroke={LUZ} strokeWidth={6} opacity={0.5} strokeLinecap="round" />
          {/* sombra de rasurado */}
          <path d="M -96 50 Q -80 160 2 186 Q 84 160 98 50 Q 70 150 2 156 Q -66 150 -96 50 Z" fill={u("barba")} opacity={0.75} />
          <path d="M -96 50 Q -80 160 2 186 Q 84 160 98 50 Q 70 150 2 156 Q -66 150 -96 50 Z" fill="#2a1810" opacity={0.25} />
          {/* pelo al rape con textura y patillas */}
          <path d="M -130 -40 C -128 -170 -62 -200 2 -200 C 72 -200 132 -170 128 -40 C 118 -94 84 -120 2 -122 C -78 -120 -116 -94 -130 -40 Z" fill={u("pelo")} />
          <path d="M -130 -40 Q -118 -10 -112 30 L -100 30 Q -104 -20 -110 -60 Z M 128 -40 Q 118 -10 112 30 L 100 30 Q 106 -20 110 -60 Z" fill={u("pelo")} />
          <path d="M -102 -98 Q -50 -122 2 -122 Q 58 -122 106 -98" fill="none" stroke="#3a2a20" strokeWidth={7} opacity={0.55} />
          <path d="M 40 -170 Q 80 -160 104 -130" fill="none" stroke="#5a4636" strokeWidth={8} opacity={0.5} strokeLinecap="round" />
        </g>
        <path d={CAB} fill="none" stroke={T} strokeWidth={LW + 2.6} strokeLinejoin="round" />
        {/* cejas con pelitos */}
        {[-1, 1].map((d) => <g key={d}>
          <path d={`M ${d * 88} ${-46 + ce * 4} Q ${d * 56} ${-66 - ce * 2} ${d * 14} ${-49 + ce * 8} L ${d * 16} ${-38 + ce * 8} Q ${d * 54} ${-52 - ce} ${d * 86} ${-37 + ce * 4} Z`} fill="#120b08" />
          {[0, 1, 2, 3, 4].map((i) => <path key={i} d={`M ${d * (24 + i * 13)} ${-44 + ce * 6 - i} l ${d * 8} ${-9}`} stroke="#3a2a20" strokeWidth={2} />)}
        </g>)}
        <g transform="translate(0 -6)">{ojo(-50, -1)}{ojo(52, 1)}</g>
        {/* nariz */}
        <path d="M -12 -18 Q -20 36 -34 58 Q -16 74 0 70 Z" fill={SOM} opacity={0.6} />
        <path d="M 8 -10 Q 14 26 20 50" fill="none" stroke={LUZ} strokeWidth={6} opacity={0.75} strokeLinecap="round" />
        <circle cx={10} cy={62} r={8} fill={LUZ} opacity={0.6} />
        <path d="M -36 56 Q -48 76 -28 84 Q -12 88 0 81 Q 12 88 28 84 Q 48 76 36 56" fill="none" stroke={T} strokeWidth={4} strokeLinecap="round" />
        <path d="M -20 78 q 7 -7 14 0 M 6 78 q 7 -7 14 0" fill="none" stroke="#1a0c06" strokeWidth={4} />
        <path d="M -40 70 Q -54 100 -50 124 M 44 70 Q 56 98 52 122" fill="none" stroke={SOM} strokeWidth={4} opacity={0.8} strokeLinecap="round" />
        {/* bigote, boca y piocha */}
        <path d="M -42 100 Q -20 88 0 93 Q 20 88 42 100 Q 22 97 0 100 Q -22 97 -42 100 Z" fill="#110a07" />
        {[-30, -18, -6, 6, 18, 30].map((x0, i) => <path key={i} d={`M ${x0} 95 l ${x0 > 0 ? 3 : -3} 6`} stroke="#3a2a20" strokeWidth={1.6} />)}
        <path d="M -8 82 Q 0 92 8 82" fill="none" stroke={PROF} strokeWidth={3} opacity={0.8} />
        {boca === "abierta" ? <path d="M -30 112 Q 0 104 30 112 Q 18 140 0 142 Q -18 140 -30 112 Z" fill="#3a1410" stroke={T} strokeWidth={3} />
          : <g>
            <path d="M -36 112 Q -14 103 0 107 Q 14 103 36 112 Q 0 118 -36 112 Z" fill="#4e281c" stroke={T} strokeWidth={2.5} strokeLinejoin="round" />
            <path d={boca === "media" ? "M -32 114 Q 0 128 32 114 Q 0 138 -32 114 Z" : "M -32 113 Q 0 122 32 113 Q 0 136 -32 113 Z"} fill="#6a3826" stroke={T} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M -36 112 Q 0 118 36 112" fill="none" stroke={T} strokeWidth={3.5} strokeLinecap="round" />
            <path d="M -10 124 Q 2 127 14 123" stroke="#a0644a" strokeWidth={3.5} opacity={0.8} fill="none" strokeLinecap="round" />
            <path d="M -40 108 q -6 4 -4 10 M 40 108 q 6 4 4 10" fill="none" stroke={PROF} strokeWidth={3} strokeLinecap="round" />
          </g>}
        <path d="M -16 146 Q 0 174 16 146 L 10 138 Q 0 152 -10 138 Z" fill="#110a07" />
        <path d="M -24 140 Q 0 150 24 140" fill="none" stroke={PROF} strokeWidth={3} opacity={0.7} />
      </g>
    </g>
  );
};
