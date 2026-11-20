// Calle al atardecer (vertical 1080×1920) en el estilo de la serie: cielo con degradado, nubes planas, cerros y ciudad
// lejanos con poco contraste, palmeras y poste en silueta morada, casa de dos pisos con porche, pasto, banqueta con borde
// rojo, asfalto y un lowrider verde. Capas separadas para dar profundidad (lejos / medio / cerca).
import React from "react";

const BG = "#3a2620"; // contorno de fondos (más delgado que el de personajes)
const LW = 3;

const Palmera: React.FC<{ x: number; y: number; h: number; f: number; i: number; c?: string }> = ({ x, y, h, f, i, c = "#5d3648" }) => {
  const g = 1.3 * Math.sin(1.7 * (f / 30) + i * 1.3);
  return (
    <g transform={`rotate(${g} ${x} ${y})`} fill={c}>
      <path d={`M ${x - 7} ${y} Q ${x + 12} ${y - h * 0.55} ${x + 4} ${y - h} L ${x + 15} ${y - h} Q ${x + 25} ${y - h * 0.55} ${x + 8} ${y} Z`} />
      {Array.from({ length: 11 }).map((_, k) => {
        const a = -Math.PI - 0.15 + k * (Math.PI + 0.3) / 10, L = 95 + ((k * 7) % 3) * 18;
        const fx = x + 10, fy = y - h, ex = fx + Math.cos(a) * L, ey = fy + Math.sin(a) * L * 0.5 + 34 + Math.abs(Math.cos(a)) * 28;
        return <path key={k} d={`M ${fx} ${fy} Q ${fx + Math.cos(a) * L * 0.55} ${fy + Math.sin(a) * L * 0.55 - 22} ${ex} ${ey} L ${ex - 3} ${ey + 7} Q ${fx + Math.cos(a) * L * 0.45} ${fy + Math.sin(a) * L * 0.35} ${fx} ${fy + 7} Z`} />;
      })}
      <path d={`M ${x} ${y - h + 4} q 10 18 22 0 Z`} />
    </g>
  );
};

/** avión de pasajeros en silueta: nariz a la derecha, alas y estabilizadores inclinados HACIA ATRÁS (hacia la cola) */
const Avion: React.FC<{ x: number; y: number; s: number; c: string }> = ({ x, y, s, c }) => (
  <g transform={`translate(${x} ${y}) scale(${s}) rotate(-6)`} fill={c}>
    <path d="M -60 -4 Q -64 0 -60 4 L 52 5 Q 66 3 70 0 Q 66 -3 52 -5 Z" />
    <path d="M 14 2 L -14 26 L -24 26 L -4 2 Z" />
    <path d="M 14 -2 L -10 -18 L -18 -18 L -2 -2 Z" />
    <path d="M -50 -3 L -62 -22 L -56 -22 L -40 -3 Z" />
    <path d="M -50 3 L -64 12 L -58 12 L -42 3 Z" />
  </g>
);

const Casa: React.FC = () => (
  <g>
    {/* cuerpo de dos pisos con tablillas */}
    <defs>
      <pattern id="tablillas" width="10" height="16" patternUnits="userSpaceOnUse"><rect width="10" height="16" fill="#c9a679" /><path d="M 0 15 H 10" stroke="#a9875e" strokeWidth="2" /></pattern>
    </defs>
    <rect x={150} y={880} width={460} height={330} fill="url(#tablillas)" stroke={BG} strokeWidth={LW} />
    <rect x={150} y={880} width={460} height={330} fill="#000" opacity={0.08} />
    {/* techo a cuatro aguas con buhardilla */}
    <path d="M 120 884 L 230 790 L 530 790 L 640 884 Z" fill="#5a3a2e" stroke={BG} strokeWidth={LW} strokeLinejoin="round" />
    <path d="M 120 884 L 640 884 L 632 896 L 128 896 Z" fill="#3e261e" />
    <path d="M 340 840 L 380 800 L 420 840 Z" fill="#c9a679" stroke={BG} strokeWidth={LW} strokeLinejoin="round" />
    <path d="M 334 842 L 380 794 L 426 842" fill="none" stroke="#5a3a2e" strokeWidth={8} strokeLinejoin="round" />
    {[0, 1, 2].map((k) => <path key={k} d={`M 362 ${820 + k * 7} H 398`} stroke={BG} strokeWidth={2} />)}
    {/* ventanas del segundo piso */}
    {[[190, 920, false], [340, 920, true], [490, 920, false]].map(([x, y, luz], i) => (
      <g key={i}>
        <rect x={(x as number) - 6} y={(y as number) - 6} width={92} height={82} fill="#e8dcc4" stroke={BG} strokeWidth={LW} />
        <rect x={x as number} y={y as number} width={80} height={70} fill={luz ? "#ffd27a" : "#4a3440"} stroke={BG} strokeWidth={2} />
        <path d={`M ${(x as number) + 40} ${y} v 70 M ${x} ${(y as number) + 35} h 80`} stroke="#e8dcc4" strokeWidth={4} />
      </g>
    ))}
    {/* porche con techo, columnas y barandal */}
    <rect x={150} y={1040} width={460} height={14} fill="#5a3a2e" stroke={BG} strokeWidth={2} />
    {[170, 300, 460, 590].map((x, i) => <rect key={i} x={x - 6} y={1054} width={12} height={140} fill="#efe6d4" stroke={BG} strokeWidth={2} />)}
    <rect x={198} y={1080} width={86} height={70} fill="#ffcf74" stroke={BG} strokeWidth={2} />
    <rect x={476} y={1080} width={86} height={70} fill="#4a3440" stroke={BG} strokeWidth={2} />
    {/* puerta con gablete */}
    <path d="M 340 1062 L 380 1034 L 420 1062 Z" fill="#efe6d4" stroke={BG} strokeWidth={2} strokeLinejoin="round" />
    <rect x={354} y={1068} width={52} height={92} fill="#f2ead8" stroke={BG} strokeWidth={2} />
    <rect x={364} y={1078} width={32} height={24} fill="#7ea0b8" stroke={BG} strokeWidth={1.5} />
    {/* barandal */}
    <rect x={150} y={1160} width={460} height={8} fill="#efe6d4" stroke={BG} strokeWidth={1.5} />
    {Array.from({ length: 30 }).map((_, i) => (i < 12 || i > 17) && <rect key={i} x={156 + i * 15} y={1168} width={6} height={30} fill="#efe6d4" />)}
    {/* escalones */}
    {[0, 1, 2].map((k) => <rect key={k} x={344 - k * 6} y={1170 + k * 14} width={72 + k * 12} height={14} fill="#d8cdb8" stroke={BG} strokeWidth={1.5} />)}
    {/* cochera a la izquierda */}
    <rect x={-20} y={1040} width={176} height={170} fill="url(#tablillas)" stroke={BG} strokeWidth={LW} />
    <path d="M -30 1044 L 166 1044 L 160 1030 L -24 1030 Z" fill="#5a3a2e" stroke={BG} strokeWidth={2} />
    <rect x={0} y={1070} width={136} height={140} fill="#e6e2da" stroke={BG} strokeWidth={2} />
    {Array.from({ length: 8 }).map((_, i) => <path key={i} d={`M 0 ${1086 + i * 16} H 136`} stroke="#bdb7aa" strokeWidth={2} />)}
    {/* barda de madera */}
    {Array.from({ length: 46 }).map((_, i) => <rect key={i} x={-10 + i * 16} y={1196} width={10} height={36} fill="#5a3a2e" />)}
    <rect x={-10} y={1206} width={740} height={5} fill="#5a3a2e" />
    {/* arbustos */}
    {[[210, 1206], [520, 1210], [620, 1212]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={34} ry={20} fill="#4f5a30" stroke={BG} strokeWidth={2} />)}
  </g>
);

const Lowrider: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={270} cy={150} rx={300} ry={14} fill="#000" opacity={0.35} />
    {/* carrocería larga y baja (convertible) */}
    <path d="M 0 96 Q 4 70 40 64 L 150 58 Q 190 30 250 30 L 330 30 Q 360 34 380 58 L 520 66 Q 556 72 560 98 L 556 128 Q 540 140 500 140 L 60 140 Q 10 140 4 124 Z" fill="#2f6b45" stroke="#120b08" strokeWidth={5} strokeLinejoin="round" />
    <path d="M 10 100 L 552 104" stroke="#e6f0e6" strokeWidth={4} opacity={0.8} />
    <path d="M 40 70 L 520 74" stroke="#5fa077" strokeWidth={6} opacity={0.8} />
    {/* asientos y parabrisas */}
    <path d="M 196 58 Q 200 30 226 30 Q 252 30 254 58 Z M 270 58 Q 274 30 300 30 Q 326 30 328 58 Z" fill="#efe2c4" stroke="#120b08" strokeWidth={3} />
    <path d="M 360 58 L 392 18 L 400 22 L 376 60 Z" fill="#cfe4ee" stroke="#120b08" strokeWidth={3} />
    {/* defensas cromadas */}
    <rect x={-6} y={104} width={30} height={14} rx={6} fill="#e2e2e2" stroke="#120b08" strokeWidth={2.5} />
    <rect x={538} y={104} width={30} height={14} rx={6} fill="#e2e2e2" stroke="#120b08" strokeWidth={2.5} />
    {/* llantas de cara blanca con rines de rayos */}
    {[110, 450].map((cx, i) => (
      <g key={i}>
        <circle cx={cx} cy={132} r={40} fill="#151515" stroke="#120b08" strokeWidth={3} />
        <circle cx={cx} cy={132} r={30} fill="#f2f2ee" />
        <circle cx={cx} cy={132} r={22} fill="#c9c9c9" stroke="#8a8a8a" strokeWidth={2} />
        {Array.from({ length: 12 }).map((_, k) => <path key={k} d={`M ${cx} 132 l ${22 * Math.cos(k * Math.PI / 6)} ${22 * Math.sin(k * Math.PI / 6)}`} stroke="#8a8a8a" strokeWidth={1.5} />)}
        <circle cx={cx} cy={132} r={6} fill="#e8c35a" />
      </g>
    ))}
  </g>
);

export const CalleAtardecer: React.FC<{ f: number; k: number }> = ({ f, k }) => (
  <g>
    <defs>
      <linearGradient id="calle-cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a1c2c" /><stop offset="0.22" stopColor="#5a3a5e" /><stop offset="0.42" stopColor="#94566a" /><stop offset="0.58" stopColor="#d57f70" /><stop offset="0.68" stopColor="#f09a6e" /></linearGradient>
      <radialGradient id="calle-sol" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffe6b8" stopOpacity={0.95} /><stop offset="0.4" stopColor="#ffc890" stopOpacity={0.5} /><stop offset="1" stopColor="#ffc890" stopOpacity={0} /></radialGradient>
      <filter id="calle-lejos" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={1.5} /></filter>
    </defs>
    {/* lejos: cielo, sol, nubes, cerros, ciudad, palmeras, avión, poste y cables (se mueven +12 px) */}
    <g transform={`translate(${12 * k} 0)`}>
      <rect x={-60} y={-60} width={1200} height={1400} fill="url(#calle-cielo)" />
      <circle cx={300} cy={1060} r={420} fill="url(#calle-sol)" />
      {[[40, 240, 360], [520, 170, 420], [700, 360, 300], [-40, 470, 280]].map(([x, y, w], i) => (
        <path key={i} d={`M ${x} ${y} q ${w * 0.1} -18 ${w * 0.3} -10 q ${w * 0.2} -14 ${w * 0.4} -2 q ${w * 0.2} 0 ${w * 0.3} 12 Z`} fill="#b06a7c" opacity={0.55} transform={`translate(${(f * 0.25 * (i + 1)) % 60} 0)`} />
      ))}
      <g filter="url(#calle-lejos)">
        <path d="M -60 1010 Q 140 930 330 980 Q 520 910 720 970 Q 900 930 1140 980 L 1140 1100 L -60 1100 Z" fill="#9c5a6c" opacity={0.85} />
        {[[640, 900, 60, 200], [710, 860, 52, 240], [770, 920, 70, 180], [850, 880, 54, 220], [910, 930, 84, 170], [1000, 900, 60, 200]].map(([x, y, w, h], i) => (
          <g key={i} opacity={0.6}><rect x={x} y={y} width={w} height={h} fill="#c7837e" />{Array.from({ length: Math.floor(h / 22) }).map((_, j) => <rect key={j} x={x + 7} y={y + 10 + j * 22} width={w - 14} height={5} fill="#e3a596" />)}</g>
        ))}
      </g>
      <Avion x={470 + 95 * (f / 30)} y={380 - 14 * (f / 30)} s={1.4} c="#4e2c48" />
      <Palmera x={70} y={1210} h={760} f={f} i={0} />
      <Palmera x={660} y={1200} h={620} f={f} i={1} c="#6a3e50" />
      <Palmera x={1010} y={1210} h={820} f={f} i={2} />
      <path d="M 860 1210 L 870 300 M 820 330 h 100 M 830 370 h 80" stroke="#4a2a3e" strokeWidth={14} strokeLinecap="round" />
      <path d="M -40 430 Q 420 540 870 330 M -40 470 Q 420 590 870 370 M 870 330 Q 990 380 1140 360 M 870 370 Q 990 420 1140 410" fill="none" stroke="#2e1824" strokeWidth={3.5} />
    </g>
    {/* medio: casa, pasto, banqueta, borde rojo y asfalto (se mueven −4 px) */}
    <g transform={`translate(${-4 * k} 0)`}>
      <Casa />
      <rect x={-60} y={1210} width={1200} height={110} fill="#5e6a38" />
      <rect x={-60} y={1210} width={1200} height={10} fill="#4c5730" />
      <rect x={-60} y={1320} width={1200} height={60} fill="#c9a690" />
      {Array.from({ length: 9 }).map((_, i) => <path key={i} d={`M ${i * 140} 1320 v 60`} stroke="#a98a76" strokeWidth={3} />)}
      <rect x={-60} y={1380} width={1200} height={16} fill="#b23a28" />
      <rect x={-60} y={1396} width={1200} height={600} fill="#352626" />
      <Lowrider x={-150 + 40 * k} y={1290} s={0.95} />
    </g>
  </g>
);
