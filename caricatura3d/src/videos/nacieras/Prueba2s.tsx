// Prueba de práctica (no se publica): recrear los primeros 2.13 s del video de referencia de CJ, 1920×1080,
// para medir si el estilo y los movimientos quedan iguales. Movimientos medidos cuadro por cuadro en el original:
//  - toma A (0–34): la cámara se recorre (fondo casi quieto, casa −16 px, CJ −70 px); CJ gira la cabeza de 3/4 a de
//    frente entre los cuadros 12 y 28; el lowrider tiene la trompa arriba (0–8), baja (9–13), cae con humo (14–16),
//    plano (16–24) y vuelve a subir (25–34); el avión cruza hacia la derecha.
//  - corte con destello blanco en el cuadro 35; toma B (35–63): casi quieta (CJ sube 10 px y se asienta), el letrero
//    «CJ» salta (36) y «(that's you)» aparece (44); el lowrider sigue arriba y cae (41–46) con humo, luego plano.
import React, { useEffect } from "react";
import { AbsoluteFill, continueRender, delayRender, interpolate, spring, staticFile, useCurrentFrame } from "remotion";

export const P2S_CUADROS = 64;
const K = "#120b08", BG = "#2e1f22";
const cl = (x: number) => Math.max(0, Math.min(1, x));
const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const tr = (f: number, a: number, b: number) => eio(cl((f - a) / (b - a)));

const useFuente = () => {
  const [h] = React.useState(() => delayRender("fuente"));
  useEffect(() => {
    const ff = new FontFace("Alfa", `url(${staticFile("fuentes/AlfaSlabOne-Regular.ttf")})`);
    const fi = new FontFace("AlegreyaI", `url(${staticFile("fuentes/Alegreya-Italic.ttf")})`, { style: "italic", weight: "400 900" });
    Promise.all([ff.load(), fi.load()]).then((l) => { l.forEach((x) => (document.fonts as unknown as { add: (x: FontFace) => void }).add(x)); continueRender(h); }).catch(() => continueRender(h));
  }, [h]);
};

// ───────── fondo ─────────
const Palmera: React.FC<{ x: number; y: number; top: number; f: number; i: number }> = ({ x, y, top, f, i }) => {
  const g = 0.8 * Math.sin(1.7 * (f / 30) + i * 1.3), h = y - top;
  return (
    <g transform={`rotate(${g} ${x} ${y})`} fill="#6b3a55" opacity={0.85}>
      <path d={`M ${x - 6} ${y} Q ${x + 10} ${y - h * 0.5} ${x + 2} ${top} L ${x + 12} ${top} Q ${x + 20} ${y - h * 0.5} ${x + 7} ${y} Z`} />
      {Array.from({ length: 10 }).map((_, k) => {
        const a = -Math.PI - 0.1 + k * (Math.PI + 0.2) / 9, L = 70 + ((k * 5) % 3) * 12;
        const fx = x + 7, fy = top, ex = fx + Math.cos(a) * L, ey = fy + Math.sin(a) * L * 0.45 + 30 + Math.abs(Math.cos(a)) * 22;
        return <path key={k} d={`M ${fx} ${fy} Q ${fx + Math.cos(a) * L * 0.55} ${fy + Math.sin(a) * L * 0.5 - 18} ${ex} ${ey} L ${ex - 3} ${ey + 6} Q ${fx + Math.cos(a) * L * 0.45} ${fy + Math.sin(a) * L * 0.3} ${fx} ${fy + 6} Z`} />;
      })}
    </g>
  );
};

const Avion: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y}) rotate(-8)`} fill="#3a2040">
    <path d="M -58 -5 Q -62 0 -58 5 L 50 6 Q 64 4 68 0 Q 64 -4 50 -6 Z" />
    <path d="M 12 3 L -16 28 L -27 28 L -6 3 Z" />
    <path d="M 12 -3 L -10 -20 L -19 -20 L -3 -3 Z" />
    <path d="M -48 -4 L -60 -24 L -53 -24 L -38 -4 Z" />
    <path d="M -48 4 L -62 13 L -55 13 L -40 4 Z" />
  </g>
);

const Lejos: React.FC<{ f: number }> = ({ f }) => (
  <g>
    <defs>
      <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3b2350" /><stop offset="0.2" stopColor="#6a3a62" /><stop offset="0.38" stopColor="#b25a6c" /><stop offset="0.5" stopColor="#e08070" /><stop offset="0.6" stopColor="#f2a070" /></linearGradient>
      <radialGradient id="resplandor" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffcf96" stopOpacity={0.8} /><stop offset="1" stopColor="#ffb07a" stopOpacity={0} /></radialGradient>
      <filter id="nube" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation={3} /></filter>
    </defs>
    <rect x={-100} y={-100} width={2200} height={1300} fill="url(#cielo)" />
    <ellipse cx={420} cy={600} rx={700} ry={260} fill="url(#resplandor)" />
    {/* nubes largas y planas */}
    <g fill="#8a4a6c" opacity={0.8} filter="url(#nube)">
      <ellipse cx={330} cy={78} rx={380} ry={10} />
      <ellipse cx={1180} cy={205} rx={240} ry={8} />
      <ellipse cx={1720} cy={262} rx={320} ry={9} />
      <ellipse cx={1800} cy={372} rx={240} ry={7} />
      <ellipse cx={180} cy={250} rx={220} ry={6} />
    </g>
    {/* cerros y ciudad lejana */}
    <path d="M -100 560 Q 150 470 400 520 Q 560 548 700 560 L 700 700 L -100 700 Z" fill="#b8687a" opacity={0.75} />
    <path d="M 900 600 Q 1300 520 1700 560 Q 1900 540 2100 570 L 2100 700 L 900 700 Z" fill="#c2707c" opacity={0.6} />
    {[[1060, 560, 80, 100], [1150, 590, 60, 70], [1500, 545, 70, 115], [1580, 580, 90, 80], [1690, 600, 60, 60]].map(([x, y, w, h], i) => (
      <g key={i} opacity={0.4}><rect x={x} y={y} width={w} height={h} fill="#d48a84" />{Array.from({ length: Math.floor(h / 18) }).map((_, j) => <rect key={j} x={x + 6} y={y + 8 + j * 18} width={w - 12} height={4} fill="#e8a898" />)}</g>
    ))}
    <Palmera x={262} y={700} top={110} f={f} i={0} />
    <Palmera x={972} y={700} top={140} f={f} i={1} />
    <Palmera x={1722} y={700} top={130} f={f} i={2} />
    <Palmera x={1870} y={700} top={290} f={f} i={3} />
    {/* pájaros */}
    {[[352, 382], [1532, 355], [1760, 385]].map(([x, y], i) => <path key={i} d={`M ${x - 8} ${y} q 4 -5 8 0 q 4 -5 8 0`} fill="none" stroke="#5a2a3c" strokeWidth={2} />)}
    <Avion x={540 + 2.1 * f} y={172 - 0.25 * f} />
    {/* poste y cables */}
    <path d="M 30 770 L 30 140" stroke="#3a2030" strokeWidth={9} />
    <path d="M 0 160 H 60 M 4 215 H 56" stroke="#3a2030" strokeWidth={7} />
    <rect x={18} y={290} width={22} height={36} fill="#3a2030" />
    <path d="M 30 150 Q 700 300 1500 200 Q 1750 170 2000 120 M 30 160 Q 700 330 1500 235 Q 1750 205 2000 160 M 30 215 Q 700 380 1500 280 Q 1750 250 2000 210" fill="none" stroke="#2a1622" strokeWidth={2.5} />
  </g>
);

const Casa: React.FC = () => (
  <g stroke={BG} strokeWidth={2.5} strokeLinejoin="round">
    <defs>
      <pattern id="tabla" width="12" height="13" patternUnits="userSpaceOnUse"><rect width="12" height="13" fill="#c49a76" /><path d="M 0 12.5 H 12" stroke="#a37a5a" strokeWidth="1.6" /></pattern>
      <pattern id="cortina" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#d9d3c6" /><path d="M 0 9.5 H 10" stroke="#a9a397" strokeWidth="1.5" /></pattern>
    </defs>
    {/* cochera */}
    <rect x={325} y={575} width={215} height={122} fill="url(#tabla)" />
    <path d="M 318 578 L 548 578 L 540 566 L 326 566 Z" fill="#4a3030" />
    <rect x={345} y={592} width={176} height={105} fill="url(#cortina)" />
    {/* casa */}
    <rect x={535} y={468} width={425} height={225} fill="url(#tabla)" />
    <rect x={915} y={468} width={45} height={225} fill="#9a7458" />
    <path d="M 520 472 L 610 378 L 890 378 L 980 472 Z" fill="#4a3030" />
    <path d="M 690 440 L 718 400 L 746 440 Z" fill="#c49a76" />
    <path d="M 682 444 L 718 392 L 754 444" fill="none" stroke="#4a3030" strokeWidth={8} />
    {[[605, 500, false], [700, 500, true], [820, 500, false]].map(([x, y, l], i) => (
      <g key={i}><rect x={(x as number) - 5} y={(y as number) - 5} width={70} height={66} fill="#e3d6be" /><rect x={x as number} y={y as number} width={60} height={56} fill={l ? "#f6c25e" : "#3e2c3e"} /><path d={`M ${(x as number) + 30} ${y} v 56 M ${x} ${(y as number) + 28} h 60`} stroke="#e3d6be" strokeWidth={3} /></g>
    ))}
    <rect x={540} y={575} width={420} height={10} fill="#4a3030" />
    {[555, 600, 660, 700, 940].map((x, i) => <rect key={i} x={x - 4} y={585} width={8} height={105} fill="#efe6d4" />)}
    <path d="M 595 595 L 625 572 L 655 595 Z" fill="#efe6d4" />
    <rect x={608} y={598} width={36} height={68} fill="#f1ebdd" /><rect x={615} y={606} width={22} height={18} fill="#7ea0b8" />
    <rect x={700} y={600} width={150} height={50} fill="#3e2c3e" /><rect x={705} y={603} width={140} height={20} fill="#f0c060" opacity={0.8} />
    <rect x={850} y={600} width={60} height={50} fill="#e3d6be" />
    <rect x={540} y={652} width={420} height={6} fill="#efe6d4" />
    {Array.from({ length: 27 }).map((_, i) => (i < 4 || i > 8) && <rect key={i} x={545 + i * 15.5} y={658} width={5} height={32} fill="#efe6d4" stroke="none" />)}
    {[0, 1, 2].map((k) => <rect key={k} x={606 - k * 5} y={666 + k * 10} width={40 + k * 10} height={10} fill="#d8cdb8" />)}
    {/* bardas de madera */}
    {Array.from({ length: 22 }).map((_, i) => <rect key={i} x={312 + i * 13} y={700} width={8} height={40} fill="#5a3a34" stroke="none" />)}
    {Array.from({ length: 19 }).map((_, i) => <rect key={i} x={690 + i * 13} y={700} width={8} height={40} fill="#5a3a34" stroke="none" />)}
    <path d="M 310 712 H 600 M 688 712 H 935" stroke="#5a3a34" strokeWidth={5} />
    <path d="M 798 744 q 8 -14 16 0 Z" fill="#3a2a22" stroke="none" />
  </g>
);

const Piso: React.FC = () => (
  <g>
    <rect x={-100} y={690} width={2200} height={110} fill="#5d6838" />
    <rect x={-100} y={690} width={2200} height={8} fill="#4a5430" />
    <rect x={-100} y={800} width={2200} height={45} fill="#c8a690" />
    {Array.from({ length: 16 }).map((_, i) => <path key={i} d={`M ${i * 140 - 60} 800 v 45`} stroke="#a88a78" strokeWidth={2.5} />)}
    <rect x={-100} y={845} width={2200} height={10} fill="#b23a28" />
    <rect x={-100} y={855} width={2200} height={300} fill="#3a2830" />
  </g>
);

// ───────── lowrider ─────────
const Lowrider: React.FC<{ ang: number; colgar: number }> = ({ ang, colgar }) => {
  // pivote: llanta trasera (x 262, y 905); la trompa sube girando alrededor de ella
  const rueda = (cx: number, cy: number) => (
    <g>
      <circle cx={cx} cy={cy} r={55} fill="#141012" stroke={K} strokeWidth={4} />
      <circle cx={cx} cy={cy} r={42} fill="#f1efe8" />
      <circle cx={cx} cy={cy} r={31} fill="#c9c6c0" stroke="#7a7470" strokeWidth={2} />
      {Array.from({ length: 16 }).map((_, k) => <path key={k} d={`M ${cx} ${cy} l ${31 * Math.cos(k * Math.PI / 8)} ${31 * Math.sin(k * Math.PI / 8)}`} stroke="#8a8480" strokeWidth={1.5} />)}
      <circle cx={cx} cy={cy} r={8} fill="#7a7470" />
    </g>
  );
  return (
    <g>
      <ellipse cx={490} cy={958} rx={470} ry={14} fill="#000" opacity={0.3} />
      {rueda(262, 905)}
      <g transform={`rotate(${-ang} 262 905)`}>
        {/* llanta delantera colgando (suspensión hidráulica) */}
        <g transform={`translate(0 ${colgar})`}>{rueda(742, 905)}</g>
        <g stroke={K} strokeWidth={4.5} strokeLinejoin="round">
          {/* carrocería larga y baja */}
          <path d="M 40 870 Q 36 830 80 820 L 330 800 Q 360 798 380 800 L 620 806 L 900 826 Q 936 836 932 872 L 924 902 Q 900 914 860 914 L 812 914 Q 800 862 742 860 Q 684 862 672 914 L 330 914 Q 318 862 262 860 Q 206 862 194 914 L 90 914 Q 46 912 40 870 Z" fill="#3e7a52" />
          <path d="M 60 846 L 920 852" stroke="#e8f0e4" strokeWidth={4} fill="none" />
          <path d="M 70 872 L 918 876" stroke="#2c5a3c" strokeWidth={3} fill="none" opacity={0.7} />
          <path d="M 96 826 L 900 838" stroke="#6aa07a" strokeWidth={6} fill="none" opacity={0.8} />
          {/* asientos */}
          <path d="M 336 802 Q 332 752 380 748 Q 428 752 424 802 Z M 476 804 Q 472 754 520 750 Q 568 754 564 804 Z" fill="#efe0c2" />
          <path d="M 348 790 h 64 M 352 776 h 56 M 488 792 h 64 M 492 778 h 56" stroke="#c9b48e" strokeWidth={2} fill="none" />
          {/* parabrisas */}
          <path d="M 604 806 L 640 742 L 666 748 L 636 808 Z" fill="#cfe6ee" opacity={0.85} />
          {/* faro y calavera */}
          <circle cx={912} cy={857} r={10} fill="#f8f2d8" />
          <path d="M 30 864 Q 20 884 40 900 L 76 898 L 74 862 Z" fill="#e8e8e8" />
          <circle cx={46} cy={846} r={7} fill="#d84838" />
        </g>
      </g>
    </g>
  );
};

/** humito al caer: 3 bolitas que crecen y se desvanecen */
const Humo: React.FC<{ f: number; t0: number; x: number; y: number }> = ({ f, t0, x, y }) => {
  const k = (f - t0) / 12;
  if (k < 0 || k > 1) return null;
  return <g fill="#e8dcd4" opacity={0.75 * (1 - k)}>{[0, 1, 2].map((i) => <circle key={i} cx={x - 30 + i * 30 + (i - 1) * 25 * k} cy={y - 10 * k} r={14 + 22 * k} />)}</g>;
};

// ───────── CJ con giro de cabeza (giro 0 = 3/4, 1 = de frente) ─────────
const S0 = "#8b502b", S1 = "#7a4426", S2 = "#5d2f18", SH = "#a86f4c", RIM = "#f4a868", PELO = "#0f0805";
const CJ: React.FC<{ f: number; giro: number; parpado: number }> = ({ f, giro, parpado }) => {
  const q = 1 - giro;                 // cuánto falta para estar de frente
  const dx = 46 * q;                  // los rasgos se corren hacia su izquierda (derecha del cuadro)
  const L = (a: number, b: number) => a + (b - a) * giro; // valor en 3/4 → valor de frente
  // contorno de la cabeza (local: origen centro de la cara)
  const H = `M ${L(10, 0)} -255 C ${L(90, 70)} -256 ${L(140, 128)} -222 ${L(150, 140)} -170 C ${L(154, 150)} -110 ${L(156, 152)} -20 ${L(150, 146)} 60 C ${L(140, 140)} 120 ${L(122, 120)} 160 ${L(100, 100)} 190 C ${L(78, 66)} 222 ${L(50, 34)} 248 ${L(16, 4)} 252 C ${L(-24, -36)} 250 ${L(-70, -80)} 222 ${L(-112, -122)} 168 C ${L(-140, -150)} 120 ${L(-152, -160)} 60 ${L(-156, -164)} 0 C ${L(-160, -168)} -80 ${L(-160, -166)} -140 ${L(-150, -180)} -180 C ${L(-128, -152)} -238 ${L(-70, -80)} -258 ${L(10, 0)} -255 Z`;
  const ojo = (cx: number, cy: number, w: number, k: string) => {
    const d = `M ${cx - w} ${cy + 2} Q ${cx - w * 0.15} ${cy - 13} ${cx + w} ${cy - 1} Q ${cx} ${cy + 9} ${cx - w} ${cy + 2} Z`;
    return (
      <g>
        <path d={d} fill="#e8dccb" />
        <clipPath id={`o${k}`}><path d={d} /></clipPath>
        <g clipPath={`url(#o${k})`}>
          <circle cx={cx + 6 * q} cy={cy} r={9.5} fill="#4a2a17" /><circle cx={cx + 6 * q} cy={cy} r={4.5} fill="#0d0705" /><circle cx={cx + 6 * q + 3} cy={cy - 3} r={2.2} fill="#fff" />
          <rect x={cx - w - 4} y={cy - 16} width={2 * w + 8} height={10 + 18 * parpado} fill={S1} />
        </g>
        <path d={`M ${cx - w - 2} ${cy + 3 - 0} Q ${cx - w * 0.15} ${cy - 15 + 16 * parpado} ${cx + w + 2} ${cy - 1}`} fill="none" stroke={K} strokeWidth={6} strokeLinecap="round" />
        <path d={`M ${cx - w * 0.8} ${cy - 16} Q ${cx} ${cy - 23} ${cx + w * 0.8} ${cy - 15}`} fill="none" stroke={S2} strokeWidth={3} strokeLinecap="round" />
      </g>
    );
  };
  return (
    <g>
      <defs><clipPath id="cabcj"><path d={H} /></clipPath></defs>
      {/* oreja izquierda (siempre visible, más grande en 3/4) */}
      <g transform={`translate(${L(-150, -160)} 20) scale(${L(1.15, 1)} 1)`}>
        <path d="M 6 -66 C -60 -76 -62 92 8 92 Z" fill={S1} stroke={K} strokeWidth={9} strokeLinejoin="round" />
        <path d="M -8 -36 C -36 -22 -34 52 -6 66" fill="none" stroke={S2} strokeWidth={10} strokeLinecap="round" />
      </g>
      {/* oreja derecha (aparece al girar) */}
      <g transform={`translate(${L(138, 150)} 18) scale(${L(0.35, 1)} 1)`} opacity={cl(giro * 1.6)}>
        <path d="M -6 -70 C 62 -80 62 94 -8 92 Z" fill={S0} stroke={K} strokeWidth={9} strokeLinejoin="round" />
        <path d="M 8 -38 C 36 -24 34 54 6 66" fill="none" stroke={S2} strokeWidth={9} strokeLinecap="round" />
        <path d="M 30 -50 C 50 -20 50 50 30 76" fill="none" stroke={RIM} strokeWidth={5} strokeLinecap="round" />
      </g>
      <path d={H} fill={S0} />
      <g clipPath="url(#cabcj)">
        <path d={`M -200 -300 L ${-120 + dx * 0.4} -300 C ${-134 + dx * 0.4} -120 ${-136 + dx * 0.4} 20 ${-118 + dx * 0.4} 120 C -100 190 -66 230 -20 280 L -200 280 Z`} fill={S1} />
        <ellipse cx={-30 + dx * 0.6} cy={-150} rx={62} ry={28} fill={SH} opacity={0.8} />
        <path d={`M ${8 + dx} -30 Q ${14 + dx} 20 ${18 + dx} 64 Q ${12 + dx} 70 ${6 + dx} 64 Q ${3 + dx} 20 ${3 + dx} -30 Z`} fill={SH} />
        <path d={`M ${-90 + dx * 0.5} 10 Q ${-70 + dx * 0.5} 60 ${-82 + dx * 0.5} 120 Q ${-110 + dx * 0.5} 110 ${-120 + dx * 0.5} 60 Z`} fill={S1} opacity={0.7} />
        <path d={`M ${-46 + dx} 176 Q ${14 + dx} 188 ${74 + dx} 176 Q ${50 + dx} 204 ${14 + dx} 208 Q ${-24 + dx} 204 ${-46 + dx} 176 Z`} fill={S1} />
        <path d="M 120 -200 C 140 -140 146 -40 144 40 C 142 100 132 150 116 180" fill="none" stroke={RIM} strokeWidth={6} strokeLinecap="round" opacity={giro} />
        {/* pelo: casquete con línea de frente recta, más alto del lado lejano */}
        <path d={`M -175 -70 C -182 -150 -168 -240 -80 -268 C -30 -282 50 -282 110 -258 C 140 -244 156 -214 160 -170 L ${L(140, 128)} -172 L ${-100 + dx * 0.6} -176 Q ${-126 + dx * 0.3} -138 -136 -80 Q -156 -74 -175 -70 Z`} fill={PELO} />
      </g>
      <path d={H} fill="none" stroke={K} strokeWidth={10} strokeLinejoin="round" />
      <g transform={`translate(${dx} 0)`}>
        {/* cejas */}
        <path d="M -122 -42 Q -94 -66 -44 -66 Q -18 -66 -4 -56 L -6 -42 Q -24 -50 -48 -51 Q -90 -50 -120 -34 Z" fill={PELO} />
        <g transform={`translate(36 0) scale(${L(0.78, 1)} 1) translate(-36 0)`}>
          <path d="M 30 -44 Q 34 -58 64 -66 Q 110 -74 146 -62 L 144 -50 Q 110 -58 70 -52 Q 46 -50 30 -44 Z" fill={PELO} />
        </g>
        {ojo(-70, -14, 36, "i")}
        <g transform={`translate(86 -14) scale(${L(0.72, 0.9)} 1) translate(-86 14)`}>{ojo(86, -14, 34, "d")}</g>
        {/* nariz: sombra lateral, brillo y alas; en 3/4 la punta se sale hacia la derecha */}
        <path d={`M ${4 + 14 * q} -20 Q ${-4 + 16 * q} 30 ${-22 + 22 * q} 70 Q -6 66 4 76 Z`} fill={S1} />
        <path d={`M ${-14 + 8 * q} 62 Q ${-36 + 8 * q} 64 ${-34 + 8 * q} 78 Q ${-32 + 8 * q} 92 ${-14 + 8 * q} 92`} fill="none" stroke="#2a140a" strokeWidth={5} strokeLinecap="round" />
        <path d={`M ${46 + 10 * q} 62 Q ${64 + 18 * q} 64 ${62 + 18 * q} 78 Q ${60 + 18 * q} 92 ${46 + 10 * q} 92`} fill="none" stroke="#2a140a" strokeWidth={5} strokeLinecap="round" />
        <path d="M -12 92 Q 16 98 44 92" fill="none" stroke={S2} strokeWidth={3} strokeLinecap="round" />
        {/* bigote fino arriba del labio */}
        <path d="M -52 114 Q 14 106 82 114" fill="none" stroke="#2a160e" strokeWidth={3} strokeLinecap="round" />
        {/* labios: arriba café oscuro, abajo rosado, comisuras abajo */}
        <path d="M -62 142 Q -42 118 14 120 Q 68 118 92 142 Q 14 136 -62 142 Z" fill="#4e2618" />
        <path d="M -54 146 Q 14 146 84 146 Q 62 176 14 178 Q -34 176 -54 146 Z" fill="#a8706a" />
        <path d="M -18 158 Q 14 162 46 157" fill="none" stroke="#d6a698" strokeWidth={5} strokeLinecap="round" />
        <path d="M -66 144 Q 14 138 96 144" fill="none" stroke="#1c0d08" strokeWidth={5} strokeLinecap="round" />
        <path d="M -66 144 q -6 6 -6 14 M 96 144 q 6 6 6 14" fill="none" stroke={S2} strokeWidth={3} strokeLinecap="round" />
        {/* perilla */}
        <path d="M -4 186 Q 14 180 32 186 Q 28 214 14 228 Q 0 214 -4 186 Z" fill="#2a160e" opacity={0.75} />
      </g>
    </g>
  );
};

const BustoCJ: React.FC<{ f: number; giro: number; parpado: number }> = ({ f, giro, parpado }) => {
  const r = Math.sin(2 * Math.PI * 0.58 * (f / 30));
  const CAM = "M -280 600 C -282 480 -270 340 -240 280 C -224 252 -200 236 -178 230 C -140 340 -80 380 -10 380 C 60 380 112 340 150 230 C 178 238 206 254 222 284 C 252 344 262 480 260 600 Z";
  return (
    <g transform={`translate(0 600) scale(${1 + 0.003 * r} ${1 + 0.007 * r}) translate(0 -600)`}>
      <g transform="translate(0 -170)">
      {/* hombros */}
      <path d="M -560 620 C -560 420 -470 280 -330 250 C -250 232 -190 214 -160 196 L 140 196 C 180 218 240 236 320 256 C 450 290 520 420 520 620 Z" fill={S0} stroke={K} strokeWidth={10} strokeLinejoin="round" />
      <path d="M -540 600 C -520 420 -450 300 -330 262 C -380 330 -400 460 -390 600 Z" fill={S1} />
      <path d="M 300 262 C 420 290 500 400 514 560" fill="none" stroke={RIM} strokeWidth={12} strokeLinecap="round" />
      {/* cuello */}
      <path d="M -150 -40 C -146 60 -152 150 -170 230 L 140 230 C 124 150 120 60 124 -40 Z" fill={S0} stroke={K} strokeWidth={10} strokeLinejoin="round" />
      <path d="M -150 -40 L 124 -40 L 124 60 Q 0 110 -150 50 Z" fill={S2} />
      <path d="M -60 90 Q -40 160 -20 220 M 40 90 Q 26 160 6 220" fill="none" stroke="#4a2414" strokeWidth={3} strokeLinecap="round" />
      {/* camiseta de tirantes */}
      <path d={CAM} fill="#f2ede2" stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -280 600 C -282 480 -270 340 -240 280 C -250 380 -246 480 -230 600 Z" fill="#d6cebe" />
      <path d="M -178 230 C -140 340 -80 380 -10 380 C 60 380 112 340 150 230" fill="none" stroke="#cfc6b4" strokeWidth={14} />
      <path d="M -178 230 C -140 340 -80 380 -10 380 C 60 380 112 340 150 230" fill="none" stroke={K} strokeWidth={8} strokeLinecap="round" />
      </g>
      {/* cabeza */}
      <g transform={`translate(${-6 + 12 * giro} -280) rotate(${2 * (1 - giro)})`}>
        <CJ f={f} giro={giro} parpado={parpado} />
      </g>
    </g>
  );
};

// ───────── letrero «CJ (that's you)» ─────────
const Letrero: React.FC<{ f: number }> = ({ f }) => {
  if (f < 36) return null;
  const k = spring({ frame: f - 36, fps: 30, config: { damping: 9, stiffness: 180, mass: 0.6 } });
  const rot = interpolate(k, [0, 1], [-12, 0]);
  const sub = cl((f - 44) / 6);
  return (
    <g transform={`translate(560 130)`}>
      <g transform={`scale(${k}) rotate(${rot})`}>
        <text x={0} y={40} textAnchor="middle" fontFamily="Alfa" fontSize={150} fill="#7ed07a" stroke="#1a2a14" strokeWidth={14} paintOrder="stroke" letterSpacing={-4}>CJ</text>
        <text x={0} y={40} textAnchor="middle" fontFamily="Alfa" fontSize={150} fill="none" stroke="#c8f0b4" strokeWidth={3} letterSpacing={-4} opacity={0.6}>CJ</text>
      </g>
      <text x={0} y={100} textAnchor="middle" fontFamily="AlegreyaI" fontStyle="italic" fontWeight={800} fontSize={34} fill="#f6efe2" stroke="#2a1a14" strokeWidth={6} paintOrder="stroke" opacity={sub}>(that's you)</text>
    </g>
  );
};

// ───────── composición ─────────
export const Prueba2s: React.FC = () => {
  useFuente();
  const f = useCurrentFrame();
  const B = f >= 35; // toma B
  // cámara: toma A se recorre a la izquierda (parallax); toma B se asienta
  const a = tr(f, 0, 34);
  const casaX = B ? 4 * (1 - tr(f, 35, 41)) : -16 * a;
  const cjX = B ? -70 + 10 * (1 - tr(f, 35, 41)) : -70 * a;
  const cjY = B ? -10 * tr(f, 35, 44) : 0;
  // giro de cabeza (12→28) y parpadeo en el giro
  const giro = B ? 1 : tr(f, 12, 28);
  const parp = Math.max(0, 1 - Math.abs(f - 20) / 2.5);
  // lowrider: ángulo de la trompa y cuánto cuelga la llanta delantera
  const hop = (t0: number, subir: number, bajar: number, caer: number) => {
    if (f < t0) return 0;
    const up = tr(f, t0, t0 + subir);
    const down = tr(f, bajar, caer);
    return up * (1 - down);
  };
  const angA = f < 35 ? Math.max(14 * (1 - tr(f, 8, 14)), 14 * tr(f, 25, 29)) : 14 * (1 - tr(f, 41, 46));
  const rebote = (t0: number) => (f >= t0 && f < t0 + 10 ? -2.5 * Math.sin(((f - t0) / 10) * Math.PI) : 0);
  const ang = Math.max(0, angA + rebote(14) + rebote(46));
  void hop;
  const flash = interpolate(f, [34, 35, 39], [0, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const motas = Array.from({ length: 10 }).map((_, i) => {
    const x = (i * 211 + f * (1.2 + (i % 3) * 0.4)) % 1920, y = (i * 137 + f * (0.6 + (i % 2) * 0.5)) % 1080;
    return <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill="#fff4e0" opacity={0.35 + 0.1 * (i % 3)} />;
  });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={1920} height={1080} viewBox="0 0 1920 1080">
        <defs>
          <radialGradient id="vg" cx=".5" cy=".5" r=".78"><stop offset=".55" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.45} /></radialGradient>
          <filter id="motas"><feGaussianBlur stdDeviation={1.5} /></filter>
        </defs>
        <Lejos f={f} />
        <g transform={`translate(${casaX} 0)`}>
          <Casa />
          <Piso />
        </g>
        <g transform={`translate(${casaX * 1.3} 0)`}>
          <Lowrider ang={ang} colgar={ang * 1.6} />
          <Humo f={f} t0={14} x={760} y={940} />
          <Humo f={f} t0={46} x={760} y={940} />
        </g>
        <g transform={`translate(${1330 + cjX} ${770 + cjY})`}>
          <BustoCJ f={f} giro={giro} parpado={parp} />
        </g>
        <Letrero f={f} />
        <g filter="url(#motas)">{motas}</g>
        <rect width={1920} height={1080} fill="url(#vg)" />
        <rect width={1920} height={1080} fill="#fff" opacity={flash} />
      </svg>
    </AbsoluteFill>
  );
};
