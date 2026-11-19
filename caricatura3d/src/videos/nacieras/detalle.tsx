// Dibujo 2D detallado (nivel ilustración): busto de adulto con sombras y luz, y sala de noche con lámpara.
// Todo con SVG: capas de color base, sombra (multiplicar) y luz (pantalla), contorno café oscuro delgado,
// y el fondo desenfocado cuando el personaje está en primer plano.
import React from "react";
import { parpadea } from "./dibujo";

const T = "#1c1411"; // tinta
const LW = 3.2;

// ───────────────────────── sala de noche ─────────────────────────
export const SalaNoche: React.FC<{ f: number; id: string; desenfoque?: number }> = ({ f, id, desenfoque = 0 }) => {
  const p = (s: string) => `${id}-${s}`;
  const marco = (x: number, y: number, w: number, h: number, retrato: React.ReactNode) => (
    <g>
      <rect x={x + 6} y={y + 8} width={w} height={h} fill="#000" opacity={0.25} />
      <rect x={x} y={y} width={w} height={h} fill="#4a3324" stroke={T} strokeWidth={LW} />
      <rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} fill="#cdb894" stroke="#2c1f17" strokeWidth={2} />
      <g clipPath={`url(#${p("cl" + x)})`}>{retrato}</g>
      <defs><clipPath id={p("cl" + x)}><rect x={x + 12} y={y + 12} width={w - 24} height={h - 24} /></clipPath></defs>
      <rect x={x + 12} y={y + 12} width={w - 24} height={(h - 24) * 0.45} fill="#fff" opacity={0.08} />
    </g>
  );
  const persona = (cx: number, cy: number, r: number, c = "#6e5a46") => (
    <g fill={c}><circle cx={cx} cy={cy} r={r} /><path d={`M ${cx - r * 1.7} ${cy + r * 3.4} Q ${cx} ${cy + r * 0.6} ${cx + r * 1.7} ${cy + r * 3.4} Z`} /></g>
  );
  return (
    <g filter={desenfoque ? `url(#${p("blur")})` : undefined}>
      <defs>
        <filter id={p("blur")} x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={desenfoque} /></filter>
        <pattern id={p("tapiz")} width="70" height="84" patternUnits="userSpaceOnUse">
          <rect width="70" height="84" fill="#6f7d55" />
          <path d="M 35 14 q 8 14 0 28 q -8 -14 0 -28 Z" fill="#7e8c62" />
          <circle cx="35" cy="56" r="3" fill="#86956a" />
          <path d="M 0 0 v 84 M 70 0 v 84" stroke="#66734d" strokeWidth="2" />
        </pattern>
        <linearGradient id={p("pared")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity={0.55} /><stop offset="0.5" stopColor="#000" stopOpacity={0.15} /><stop offset="1" stopColor="#000" stopOpacity={0.35} /></linearGradient>
        <radialGradient id={p("lampara")} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffd88c" stopOpacity={0.75} /><stop offset="0.4" stopColor="#ffb85c" stopOpacity={0.28} /><stop offset="1" stopColor="#ff9a3c" stopOpacity={0} /></radialGradient>
        <linearGradient id={p("pantalla")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff1c4" /><stop offset="1" stopColor="#f2c26a" /></linearGradient>
        <linearGradient id={p("cortina")} x1="0" y1="0" x2="1" y2="0">{[0, 0.18, 0.36, 0.54, 0.72, 0.9].map((o, i) => <stop key={i} offset={o} stopColor={i % 2 ? "#a77a2c" : "#c9993f"} />)}</linearGradient>
        <linearGradient id={p("sillon")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cdbb98" /><stop offset="1" stopColor="#9c8a68" /></linearGradient>
        <linearGradient id={p("piso")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a3020" /><stop offset="1" stopColor="#6b4630" /></linearGradient>
      </defs>
      {/* pared con tapiz y moldura */}
      <rect width={1080} height={1330} fill={`url(#${p("tapiz")})`} />
      <rect width={1080} height={1330} fill={`url(#${p("pared")})`} />
      <rect y={0} width={1080} height={46} fill="#3e2c20" stroke={T} strokeWidth={LW} />
      <rect y={46} width={1080} height={14} fill="#5a4230" />
      <ellipse cx={600} cy={52} rx={90} ry={16} fill="#e8d6a8" stroke={T} strokeWidth={LW} />
      <rect y={1250} width={1080} height={40} fill="#3e2c20" stroke={T} strokeWidth={LW} />
      {/* escalera a la izquierda */}
      <path d="M 0 360 L 230 1250 L 0 1250 Z" fill="#5b4433" />
      {Array.from({ length: 9 }).map((_, i) => { const y = 1250 - i * 100, x = 230 - i * 26; return <path key={i} d={`M 0 ${y} H ${x} V ${y - 100}`} fill="none" stroke="#3a2a1e" strokeWidth={4} />; })}
      <path d="M 20 330 L 262 1210" stroke="#3e2c20" strokeWidth={22} strokeLinecap="round" />
      {Array.from({ length: 9 }).map((_, i) => { const x = 40 + i * 26, y = 400 + i * 96; return <rect key={i} x={x} y={y} width={9} height={110} fill="#ddd2bd" stroke={T} strokeWidth={2} />; })}
      <rect x={250} y={1060} width={30} height={200} fill="#4a3324" stroke={T} strokeWidth={LW} />
      <circle cx={265} cy={1052} r={20} fill="#5a4230" stroke={T} strokeWidth={LW} />
      {/* retratos familiares */}
      {marco(330, 250, 210, 260, <g>{persona(435, 360, 46)}</g>)}
      {marco(570, 300, 250, 190, <g>{persona(630, 380, 26)}{persona(695, 372, 30)}{persona(760, 384, 24)}</g>)}
      {marco(850, 240, 190, 250, <g>{persona(905, 350, 28)}{persona(985, 360, 26, "#5e4a38")}</g>)}
      {/* ventana de noche con luna y cortinas */}
      <rect x={640} y={560} width={300} height={380} fill="#1d2a48" stroke={T} strokeWidth={6} />
      <circle cx={860} cy={640} r={26} fill="#f4ecd0" />
      <circle cx={860} cy={640} r={60} fill="#f4ecd0" opacity={0.12} />
      {[[690, 600], [760, 700], [700, 820], [890, 860], [810, 590]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={2.5} fill="#e8eaf6" opacity={0.8} />)}
      <path d="M 790 560 V 940 M 640 750 H 940" stroke="#3a2a1e" strokeWidth={8} />
      <path d="M 600 530 Q 640 740 610 960 L 690 960 Q 690 740 680 530 Z" fill={`url(#${p("cortina")})`} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      <path d="M 980 530 Q 940 740 970 960 L 890 960 Q 890 740 900 530 Z" fill={`url(#${p("cortina")})`} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      <rect x={580} y={518} width={420} height={22} rx={8} fill="#4a3324" stroke={T} strokeWidth={LW} />
      {/* piso */}
      <rect y={1290} width={1080} height={640} fill={`url(#${p("piso")})`} />
      {Array.from({ length: 8 }).map((_, i) => <path key={i} d={`M 0 ${1320 + i * 80} H 1080`} stroke="#3c2618" strokeWidth={3} opacity={0.7} />)}
      <path d="M 120 1420 L 960 1420 L 1060 1700 L 20 1700 Z" fill="#3e5878" stroke={T} strokeWidth={LW} />
      <path d="M 170 1450 L 910 1450 L 990 1670 L 90 1670 Z" fill="none" stroke="#6f8bab" strokeWidth={6} />
      {/* sillón */}
      <ellipse cx={560} cy={1400} rx={430} ry={30} fill="#000" opacity={0.3} />
      <path d="M 210 1010 Q 200 960 260 955 L 860 955 Q 920 960 910 1010 L 915 1200 L 205 1200 Z" fill={`url(#${p("sillon")})`} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      {[0, 1, 2].map((k) => <path key={k} d={`M ${235 + k * 220} 985 Q ${345 + k * 220} 965 ${455 + k * 220} 985 L ${455 + k * 220} 1150 L ${235 + k * 220} 1150 Z`} fill="#c2b08c" stroke={T} strokeWidth={2.5} />)}
      <path d="M 200 1140 L 920 1140 L 930 1300 L 190 1300 Z" fill="#b19f7c" stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      {[0, 1, 2].map((k) => <path key={k} d={`M ${215 + k * 230} 1150 h 225 v 70 h -225 Z`} fill="#c9b792" stroke={T} strokeWidth={2.5} />)}
      <path d="M 150 1080 Q 140 1040 190 1040 Q 240 1040 240 1090 L 240 1310 L 150 1310 Z" fill="#bba985" stroke={T} strokeWidth={LW} />
      <path d="M 970 1080 Q 980 1040 930 1040 Q 880 1040 880 1090 L 880 1310 L 970 1310 Z" fill="#bba985" stroke={T} strokeWidth={LW} />
      <path d="M 600 1050 Q 720 1010 800 1060 L 790 1140 Q 700 1120 610 1140 Z" fill="#9a3a2c" stroke={T} strokeWidth={LW} />
      {/* lámpara de pie con luz */}
      <circle cx={1000} cy={760} r={330} fill={`url(#${p("lampara")})`} style={{ mixBlendMode: "screen" }} />
      <rect x={994} y={800} width={12} height={480} fill="#3a2a1e" />
      <ellipse cx={1000} cy={1282} rx={50} ry={12} fill="#3a2a1e" />
      <path d="M 930 800 L 952 700 L 1048 700 L 1070 800 Z" fill={`url(#${p("pantalla")})`} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      {/* tele vieja */}
      <rect x={-40} y={1150} width={190} height={250} fill="#3a2a1e" stroke={T} strokeWidth={LW} />
      <rect x={-40} y={1010} width={170} height={150} rx={14} fill="#2a2522" stroke={T} strokeWidth={LW} />
      <rect x={-20} y={1030} width={110} height={100} rx={12} fill="#141e24" />
      <rect x={-12} y={1036} width={50} height={30} rx={8} fill="#fff" opacity={0.08} />
      {/* oscurecido general + luz cálida de la lámpara sobre el cuarto */}
      <rect width={1080} height={1920} fill="#1a1230" opacity={0.28} style={{ mixBlendMode: "multiply" }} />
      <ellipse cx={900} cy={900} rx={700} ry={800} fill={`url(#${p("lampara")})`} opacity={0.35} style={{ mixBlendMode: "screen" }} />
    </g>
  );
};

// ───────────────────────── busto de adulto (CJ, diseño propio) ─────────────────────────
export type Gesto = { mirarX?: number; mirarY?: number; cabeza?: number; cejas?: number; boca?: "seria" | "abierta" | "media" };
const CAB = "M -112 -30 C -118 -150 -58 -186 2 -186 C 70 -186 122 -150 116 -30 C 114 44 98 102 70 140 C 46 170 22 182 2 182 C -22 182 -50 170 -76 140 C -102 104 -112 46 -112 -30 Z";

export const BustoCJ: React.FC<{ f: number; x: number; y: number; s?: number; id: string; g?: Gesto; semilla?: number }> = ({ f, x, y, s = 1, id, g = {}, semilla = 1 }) => {
  const p = (k: string) => `${id}-${k}`;
  const piel = "#8d5a3b", sombra = "#5e3a26", luz = "#c58a5e", resp = Math.sin(f * 0.1) * 4;
  const cerr = parpadea(f, semilla), mx = (g.mirarX ?? 0) * 7, my = (g.mirarY ?? 0) * 4, ce = g.cejas ?? 0.3;
  const ojo = (cx: number, lado: 1 | -1) => (
    <g>
      <path d={`M ${cx - 30} 4 Q ${cx - 4} -12 ${cx + 28} 2 Q ${cx} 14 ${cx - 30} 4 Z`} fill="#efe6d8" />
      {!cerr && <g clipPath={`url(#${p("ojo" + lado)})`}><circle cx={cx + mx} cy={2 + my} r={13} fill="#3b2216" /><circle cx={cx + mx} cy={2 + my} r={6} fill="#120a07" /><circle cx={cx + mx + 4} cy={-3 + my} r={3.2} fill="#fff" /></g>}
      <defs><clipPath id={p("ojo" + lado)}><path d={`M ${cx - 30} 4 Q ${cx - 4} -12 ${cx + 28} 2 Q ${cx} 14 ${cx - 30} 4 Z`} /></clipPath></defs>
      {cerr ? <path d={`M ${cx - 30} 4 Q ${cx} 14 ${cx + 28} 2`} fill="none" stroke={T} strokeWidth={4.5} strokeLinecap="round" />
        : <path d={`M ${cx - 33} 5 Q ${cx - 4} -15 ${cx + 31} 1`} fill="none" stroke={T} strokeWidth={5} strokeLinecap="round" />}
      <path d={`M ${cx - 24} 14 Q ${cx} 22 ${cx + 22} 10`} fill="none" stroke={sombra} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      <path d={`M ${cx - 22} -24 Q ${cx} -32 ${cx + 22} -22`} fill="none" stroke={sombra} strokeWidth={3} opacity={0.6} />
    </g>
  );
  const boca = g.boca ?? "seria";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <defs>
        <clipPath id={p("cab")}><path d={CAB} /></clipPath>
        <linearGradient id={p("camiseta")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#bdb6a8" /><stop offset="0.45" stopColor="#ece6da" /><stop offset="1" stopColor="#d8d0c0" /></linearGradient>
        <linearGradient id={p("piel")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={sombra} /><stop offset="0.35" stopColor={piel} /><stop offset="0.8" stopColor={piel} /><stop offset="1" stopColor={luz} /></linearGradient>
      </defs>
      {/* hombros y brazos */}
      <g transform={`translate(0 ${resp})`}>
        <path d="M -360 700 L -350 430 Q -340 310 -250 280 Q -160 250 -90 240 L 90 240 Q 160 250 250 280 Q 340 310 350 430 L 360 700 Z" fill={`url(#${p("piel")})`} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
        <path d="M -350 440 Q -330 340 -262 310 Q -296 400 -286 520" fill="none" stroke={sombra} strokeWidth={10} opacity={0.45} strokeLinecap="round" />
        <path d="M 290 320 Q 342 360 348 460" fill="none" stroke={luz} strokeWidth={8} opacity={0.7} strokeLinecap="round" />
        <path d="M -262 470 Q -254 560 -262 700 M 262 470 Q 256 560 262 700" fill="none" stroke={T} strokeWidth={LW} opacity={0.9} />
        <path d="M -250 300 Q -200 330 -210 400 M 250 300 Q 200 330 210 400" fill="none" stroke={sombra} strokeWidth={4} opacity={0.6} />
        {/* camiseta sin mangas */}
        <path d="M -206 700 L -202 420 Q -206 306 -158 262 L -104 254 Q -56 372 0 376 Q 56 372 104 254 L 158 262 Q 206 306 202 420 L 206 700 Z" fill={`url(#${p("camiseta")})`} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
        <path d="M -104 254 Q -56 372 0 376 Q 56 372 104 254" fill="none" stroke="#8f8778" strokeWidth={9} />
        {Array.from({ length: 26 }).map((_, i) => <path key={i} d={`M ${-190 + i * 15} 400 V 700`} stroke="#a59d8e" strokeWidth={2} opacity={0.35} />)}
        <path d="M -150 470 Q -80 500 -20 470 M 30 520 Q 90 540 150 500 M -120 600 Q -60 620 0 600 M -200 560 Q -190 620 -196 690" fill="none" stroke="#a9a194" strokeWidth={4} strokeLinecap="round" />
        <path d="M -206 400 Q -180 520 -206 700" fill="none" stroke="#9e9788" strokeWidth={16} opacity={0.5} />
      </g>
      {/* cuello */}
      <path d="M -72 120 L -80 262 Q 0 290 80 262 L 72 120 Z" fill={piel} stroke={T} strokeWidth={LW} strokeLinejoin="round" />
      <path d="M -70 140 Q 0 210 70 140 L 70 120 L -70 120 Z" fill={sombra} opacity={0.75} />
      <path d="M -48 200 Q -30 250 -10 274 M 48 200 Q 30 250 10 274" fill="none" stroke={sombra} strokeWidth={4} opacity={0.7} />
      {/* cabeza */}
      <g transform={`translate(0 30) scale(1.14) rotate(${(g.cabeza ?? 0) + 1.2 * Math.sin(f * 0.045)})`}>
        <path d="M -114 -10 C -140 -20 -146 40 -116 64 Q -108 70 -104 58 Z" fill={piel} stroke={T} strokeWidth={LW} />
        <path d="M 118 -10 C 144 -20 150 40 120 64 Q 112 70 108 58 Z" fill={piel} stroke={T} strokeWidth={LW} />
        <path d="M -122 6 Q -134 30 -118 48 M 124 6 Q 136 30 120 48" fill="none" stroke={sombra} strokeWidth={4} />
        <path d={CAB} fill={piel} />
        <g clipPath={`url(#${p("cab")})`}>
          {/* sombra del lado izquierdo, luz cálida a la derecha */}
          <path d="M -130 -200 L -60 -200 Q -96 -20 -40 190 L -130 190 Z" fill={sombra} opacity={0.55} />
          <path d="M 96 -120 Q 130 0 84 150 L 140 150 L 140 -120 Z" fill={luz} opacity={0.55} />
          <path d="M -80 60 Q -60 110 -10 120 Q -50 160 -76 140 Z" fill={sombra} opacity={0.45} />
          {/* barba de candado y sombra de rasurado */}
          <path d="M -70 70 Q -60 150 2 172 Q 64 150 74 70 Q 50 140 2 146 Q -46 140 -70 70 Z" fill="#3a2418" opacity={0.35} />
          {/* pelo al rape */}
          <path d="M -130 -40 C -128 -170 -62 -200 2 -200 C 72 -200 132 -170 128 -40 C 116 -96 80 -122 2 -124 C -76 -122 -114 -96 -130 -40 Z" fill="#17100c" />
          <path d="M -100 -100 Q -50 -122 2 -124 Q 60 -122 104 -100" fill="none" stroke="#2c1e16" strokeWidth={6} opacity={0.8} />
        </g>
        <path d={CAB} fill="none" stroke={T} strokeWidth={LW + 2.4} strokeLinejoin="round" />
        {/* cejas */}
        <path d={`M -86 ${-46 + ce * 4} Q -54 ${-64 - ce * 2} -14 ${-48 + ce * 8} L -16 ${-38 + ce * 8} Q -52 ${-52 - ce} -84 ${-38 + ce * 4} Z`} fill="#140d0a" />
        <path d={`M 88 ${-46 + ce * 4} Q 56 ${-64 - ce * 2} 16 ${-48 + ce * 8} L 18 ${-38 + ce * 8} Q 54 ${-52 - ce} 86 ${-38 + ce * 4} Z`} fill="#140d0a" />
        <g transform="translate(0 -6)">{ojo(-50, -1)}{ojo(52, 1)}</g>
        {/* nariz */}
        <path d="M -10 -14 Q -18 40 -30 62 Q -16 76 0 70 Q 16 76 30 62 Q 18 40 12 -14" fill={sombra} opacity={0.35} />
        <path d="M -34 58 Q -46 76 -26 82 Q -12 86 0 80 Q 12 86 26 82 Q 46 76 34 58" fill="none" stroke={T} strokeWidth={3.5} strokeLinecap="round" />
        <path d="M -16 76 q 6 -6 12 0 M 4 76 q 6 -6 12 0" fill="none" stroke="#2a1810" strokeWidth={3} />
        <path d="M 8 -6 Q 14 30 18 52" fill="none" stroke={luz} strokeWidth={5} opacity={0.6} strokeLinecap="round" />
        {/* bigote delgado y boca */}
        <path d="M -40 100 Q -20 90 0 94 Q 20 90 40 100 Q 20 98 0 100 Q -20 98 -40 100 Z" fill="#140d0a" />
        {boca === "abierta" ? <path d="M -30 112 Q 0 104 30 112 Q 18 140 0 142 Q -18 140 -30 112 Z" fill="#3a1410" stroke={T} strokeWidth={3} />
          : <g>
            <path d="M -34 112 Q -14 104 0 108 Q 14 104 34 112 Q 0 118 -34 112 Z" fill="#5a3022" stroke={T} strokeWidth={2.5} strokeLinejoin="round" />
            <path d={boca === "media" ? "M -30 114 Q 0 128 30 114 Q 0 136 -30 114 Z" : "M -30 113 Q 0 122 30 113 Q 0 134 -30 113 Z"} fill="#6e3b2a" stroke={T} strokeWidth={2.5} strokeLinejoin="round" />
            <path d="M -8 124 Q 0 126 10 123" stroke={luz} strokeWidth={3} opacity={0.6} fill="none" strokeLinecap="round" />
          </g>}
        <path d="M -6 82 Q 0 92 6 82" fill="none" stroke={sombra} strokeWidth={3} opacity={0.7} />
        {/* piocha */}
        <path d="M -16 150 Q 0 176 16 150 L 10 142 Q 0 156 -10 142 Z" fill="#140d0a" />
      </g>
    </g>
  );
};
