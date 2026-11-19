// Prueba de animación de la serie «Si nacieras como…» (CJ). 21 s, sin voz: 5 tomas propias con el estilo medido en
// las referencias (2D plano, etiquetas que saltan, mapa con sello, tablero con hilo rojo, portadilla de capítulo).
import React, { useEffect } from "react";
import { AbsoluteFill, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Adulto, Bebe, Etiqueta, PIEL_OSCURA, Sello, TINTA, salto, tramo } from "./dibujo";

export const PRUEBA_CJ_CUADROS = 630;
const W = 1080, H = 1920;

const FUENTES: [string, string, string][] = [["Nunito", "fuentes/Nunito.ttf", "200 1000"], ["Alegreya", "fuentes/Alegreya.ttf", "400 900"]];
const useFuentes = () => {
  const [h] = React.useState(() => delayRender("fuentes"));
  useEffect(() => {
    Promise.all(FUENTES.map(([n, u, w]) => new FontFace(n, `url(${staticFile(u)})`, { weight: w }).load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); })))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};

/** cámara: acercamiento lento hacia (cx, cy) */
const Camara: React.FC<{ f: number; dur: number; z0?: number; z1?: number; cx?: number; cy?: number; dx?: number; dy?: number; children: React.ReactNode }> = ({ f, dur, z0 = 1, z1 = 1.06, cx = W / 2, cy = H / 2, dx = 0, dy = 0, children }) => {
  const u = f / dur, z = z0 + (z1 - z0) * u;
  return <g transform={`translate(${cx + dx * u} ${cy + dy * u}) scale(${z}) translate(${-cx} ${-cy})`}>{children}</g>;
};

const Vineta: React.FC = () => (
  <>
    <defs>
      <radialGradient id="vin" cx="50%" cy="48%" r="75%"><stop offset="55%" stopColor="#000" stopOpacity={0} /><stop offset="100%" stopColor="#000" stopOpacity={0.45} /></radialGradient>
    </defs>
    <rect width={W} height={H} fill="url(#vin)" />
  </>
);

// ───────────────────────── toma 1: CJ en su calle al atardecer ─────────────────────────
const Palmera: React.FC<{ x: number; y: number; s: number; c: string }> = ({ x, y, s, c }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={c}>
    <path d="M -10 0 Q -30 -300 20 -620 L 34 -618 Q -12 -300 12 0 Z" />
    {[-150, -110, -60, -20, 30, 80, 130].map((a, i) => <path key={i} transform={`translate(26 -620) rotate(${a})`} d="M 0 0 Q 90 -40 190 30 Q 100 -10 0 12 Z" />)}
  </g>
);
const Casa: React.FC<{ x: number; y: number; w: number; h: number; c: string; techo: string; luz?: boolean }> = ({ x, y, w, h, c, techo, luz }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={0} y={-h} width={w} height={h} fill={c} stroke={TINTA} strokeWidth={4} />
    <path d={`M -14 ${-h} L ${w / 2} ${-h - 70} L ${w + 14} ${-h} Z`} fill={techo} stroke={TINTA} strokeWidth={4} strokeLinejoin="round" />
    {[0.18, 0.62].map((p, i) => <g key={i}><rect x={w * p} y={-h + 40} width={w * 0.2} height={h * 0.3} fill={luz ? "#ffd27a" : "#5d6a86"} stroke={TINTA} strokeWidth={4} /><path d={`M ${w * p + w * 0.1} ${-h + 40} v ${h * 0.3}`} stroke={TINTA} strokeWidth={3} /></g>)}
    <rect x={w * 0.42} y={-h * 0.45} width={w * 0.16} height={h * 0.45} fill="#7a4e33" stroke={TINTA} strokeWidth={4} />
    <rect x={-10} y={-h * 0.5} width={w + 20} height={14} fill={techo} stroke={TINTA} strokeWidth={3} />
    {Array.from({ length: Math.floor(w / 34) }).map((_, i) => <rect key={i} x={i * 34 + 6} y={-h * 0.5 + 14} width={8} height={h * 0.5 - 14} fill="#efe6d6" stroke={TINTA} strokeWidth={2} />)}
  </g>
);
const Toma1: React.FC = () => {
  const f = useCurrentFrame(), sube = tramo(f, 34, 48), baja = tramo(f, 100, 116);
  const pose = { brazoD: 14 + 26 * (sube - baja), codoD: 4 + 120 * (sube - baja), cabeza: 2 * Math.sin(f * 0.05) - 3 * (sube - baja), boca: (f > 40 && f < 100 ? "sonrisa" : "seria") as "sonrisa" | "seria", cejas: 0.4, mirarX: f < 30 ? -0.6 : 0 };
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <linearGradient id="t1cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4c3a6e" /><stop offset="0.45" stopColor="#b8607a" /><stop offset="0.8" stopColor="#f0995a" /><stop offset="1" stopColor="#f7c46c" /></linearGradient>
        <radialGradient id="t1sol"><stop offset="0" stopColor="#fff2c2" /><stop offset="0.35" stopColor="#ffd98a" stopOpacity={0.9} /><stop offset="1" stopColor="#ffb86a" stopOpacity={0} /></radialGradient>
      </defs>
      <Camara f={f} dur={135} z0={1.0} z1={1.07} cy={1000}>
        <rect width={W} height={1180} fill="url(#t1cielo)" />
        <circle cx={760} cy={1010} r={260} fill="url(#t1sol)" />
        <circle cx={760} cy={1010} r={70} fill="#fff1c9" />
        {[[120, 260, 220], [600, 180, 260], [880, 330, 180]].map(([x, y, w], i) => <path key={i} d={`M ${x} ${y} h ${w}`} stroke="#f6c9a6" strokeWidth={10} strokeLinecap="round" opacity={0.5} transform={`translate(${(f * 0.3 * (i + 1)) % 40} 0)`} />)}
        <path d="M 0 1060 Q 200 960 420 1030 Q 640 950 860 1020 Q 980 990 1080 1010 L 1080 1180 L 0 1180 Z" fill="#8a4f74" />
        <Palmera x={70} y={1210} s={1.15} c="#3b2740" />
        <Palmera x={980} y={1200} s={0.95} c="#3b2740" />
        <Casa x={-40} y={1260} w={420} h={260} c="#d9c3a5" techo="#8d5b48" luz />
        <Casa x={640} y={1260} w={480} h={280} c="#c7b8d0" techo="#6c4a5e" />
        <path d="M 360 1260 V 760 M 330 790 h 60" stroke="#3b2740" strokeWidth={14} strokeLinecap="round" />
        <path d="M 0 820 Q 180 860 360 790 Q 700 850 1080 780" stroke="#3b2740" strokeWidth={3} fill="none" />
        <rect y={1250} width={W} height={60} fill="#7c8a5a" stroke={TINTA} strokeWidth={4} />
        <rect y={1310} width={W} height={420} fill="#cdb9a1" />
        {Array.from({ length: 7 }).map((_, i) => <path key={i} d={`M ${i * 170 + 40} 1310 l -40 420`} stroke="#b19d86" strokeWidth={4} />)}
        <rect y={1720} width={W} height={36} fill="#9b8a77" stroke={TINTA} strokeWidth={4} />
        <rect y={1756} width={W} height={200} fill="#4a4552" />
        <Adulto f={f} x={540} y={1650} s={1.0} id="t1cj" tipo="cj" pose={pose} semilla={2} />
        <Etiqueta f={f} ini={18} x={260} y={600} texto="CJ" sub="(ese eres tú)" flecha={[430, 770]} />
      </Camara>
      <Vineta />
    </svg>
  );
};

// ───────────────────────── toma 2: mapa con ruta y sello ─────────────────────────
const Toma2: React.FC = () => {
  const f = useCurrentFrame(), ruta = tramo(f, 12, 70);
  const ciudad = (x: number, y: number, w: number, h: number, nombre: string, ini: number) => (
    <g opacity={tramo(f, ini, ini + 8)}>
      <rect x={x} y={y} width={w} height={h} fill="#e3c6c0" stroke="#8b6a5a" strokeWidth={4} />
      {Array.from({ length: 4 }).map((_, i) => <path key={i} d={`M ${x + (i + 1) * w / 5} ${y} v ${h} M ${x} ${y + (i + 1) * h / 5} h ${w}`} stroke="#c9a69e" strokeWidth={3} />)}
      <text x={x + w / 2} y={y - 18} textAnchor="middle" fontFamily="Alegreya" fontWeight={800} fontSize={46} fill="#5a3a2a" letterSpacing={2}>{nombre}</text>
    </g>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <radialGradient id="t2papel" cx="50%" cy="50%" r="70%"><stop offset="0.6" stopColor="#f1e3c2" /><stop offset="1" stopColor="#c9ab7a" /></radialGradient>
      </defs>
      <Camara f={f} dur={135} z0={1.08} z1={1.0} cy={1100} dy={-60}>
        <rect width={W} height={H} fill="url(#t2papel)" />
        <path d="M 0 0 L 300 0 Q 240 300 300 520 Q 360 700 250 900 Q 160 1100 260 1300 Q 330 1500 200 1920 L 0 1920 Z" fill="#a9cfe0" />
        <path d="M 300 0 Q 240 300 300 520 Q 360 700 250 900 Q 160 1100 260 1300 Q 330 1500 200 1920" fill="none" stroke="#7aa9c0" strokeWidth={6} />
        <path d="M 1080 1500 Q 800 1560 700 1920 L 1080 1920 Z" fill="#a9cfe0" />
        <path d="M 330 420 Q 600 520 780 380 M 420 1480 Q 650 1200 800 700 M 300 1100 Q 600 1000 900 1150" stroke="#d9b36a" strokeWidth={9} fill="none" />
        {[[480, 860], [900, 1000], [380, 960]].map(([x, y], i) => <g key={i}><circle cx={x} cy={y} r={11} fill="#fbf7ef" stroke="#5a3a2a" strokeWidth={4} /></g>)}
        {ciudad(340, 320, 230, 190, "SAN FIERRO", 4)}
        {ciudad(700, 300, 260, 230, "LAS VENTURAS", 8)}
        {ciudad(440, 1080, 300, 230, "LOS SANTOS", 0)}
        <path d="M 540 1190 Q 660 980 730 760 Q 790 580 830 420" fill="none" stroke="#c8322b" strokeWidth={12} strokeLinecap="round" strokeDasharray="34 22" pathLength={1000} strokeDashoffset={0} style={{ clipPath: `inset(${(1 - ruta) * 100}% 0 0 0)` }} />
        <g transform={`translate(540 1190) scale(${salto(f, 2)})`}><path d="M -34 10 v -40 l 34 -28 l 34 28 v 40 Z" fill="#7cae6a" stroke={TINTA} strokeWidth={5} strokeLinejoin="round" /><rect x={-10} y={-14} width={20} height={24} fill="#7a4e33" /></g>
        <g transform={`translate(856 420) scale(${salto(f, 66)})`}>{[0, 1, 2].map((k) => <g key={k} transform={`translate(${k * 26 - 26} ${-k * 14})`}><circle r={32} fill={["#2e8b57", "#c8322b", "#2b2b2b"][k]} stroke={TINTA} strokeWidth={4} /><circle r={20} fill="none" stroke="#fbf7ef" strokeWidth={5} strokeDasharray="8 8" /></g>)}</g>
        <text x={W / 2} y={170} textAnchor="middle" fontFamily="Alegreya" fontWeight={900} fontSize={70} fill="#8a2a22" letterSpacing={3}>SAN ANDREAS</text>
        <Etiqueta f={f} ini={6} x={360} y={1340} texto="GROVE ST." giro={-4} escala={0.9} />
        {[[520, 640], [600, 700], [470, 720], [880, 760], [940, 820]].map(([x, y], i) => <path key={i} d={`M ${x - 40} ${y} L ${x} ${y - 56} L ${x + 40} ${y} Z M ${x - 14} ${y - 36} L ${x} ${y - 56} L ${x + 14} ${y - 36}`} fill="#c9a77a" stroke="#8b6a5a" strokeWidth={4} strokeLinejoin="round" />)}
        <g transform="translate(900 1740)"><circle r={78} fill="none" stroke="#8b6a5a" strokeWidth={4} /><path d="M 0 -96 L 16 0 L 0 96 L -16 0 Z" fill="#8b6a5a" /><path d="M -96 0 L 0 -14 L 96 0 L 0 14 Z" fill="#c9a77a" stroke="#8b6a5a" strokeWidth={3} /><text y={-110} textAnchor="middle" fontFamily="Alegreya" fontWeight={900} fontSize={40} fill="#5a3a2a">N</text></g>
        <g transform="translate(70 1690)" fontFamily="Alegreya" fontWeight={700} fontSize={32} fill="#5a3a2a"><rect width={300} height={170} fill="#f6ead0" stroke="#8b6a5a" strokeWidth={4} /><path d="M 20 44 h 60" stroke="#d9b36a" strokeWidth={9} /><text x={100} y={54}>Carretera</text><rect x={20} y={90} width={60} height={40} fill="#e3c6c0" stroke="#8b6a5a" strokeWidth={3} /><text x={100} y={122}>Ciudad</text></g>
        <Sello f={f} ini={92} x={560} y={800} texto="TRAICIONADO" giro={-14} />
      </Camara>
      <Vineta />
    </svg>
  );
};

// ───────────────────────── toma 3: tú, de bebé, en la sala ─────────────────────────
const Toma3: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <pattern id="t3tapiz" width="90" height="90" patternUnits="userSpaceOnUse"><rect width="90" height="90" fill="#8ea36f" /><path d="M 45 20 l 12 25 l -12 25 l -12 -25 Z" fill="#a5b886" /><circle cx="0" cy="0" r="5" fill="#a5b886" /><circle cx="90" cy="90" r="5" fill="#a5b886" /></pattern>
        <linearGradient id="t3luz" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff3cf" stopOpacity={0.35} /><stop offset="1" stopColor="#fff3cf" stopOpacity={0} /></linearGradient>
      </defs>
      <Camara f={f} dur={150} z0={1.0} z1={1.09} cx={420} cy={1180}>
        <rect width={W} height={1420} fill="url(#t3tapiz)" />
        <rect y={1380} width={W} height={50} fill="#6e4a32" stroke={TINTA} strokeWidth={4} />
        <rect y={1430} width={W} height={490} fill="#9a6a45" />
        {Array.from({ length: 6 }).map((_, i) => <path key={i} d={`M 0 ${1470 + i * 80} H ${W}`} stroke="#835838" strokeWidth={4} />)}
        {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M ${(i * 211) % W} ${1430 + Math.floor(i / 2) * 80} v 80`} stroke="#835838" strokeWidth={4} />)}
        {/* ventana con cortinas y palmera afuera */}
        <rect x={560} y={420} width={380} height={440} fill="#9fd3ea" stroke={TINTA} strokeWidth={6} />
        <path d="M 600 860 Q 660 640 700 470 L 712 472 Q 676 650 618 860 Z" fill="#5c7a4a" />
        {[-150, -100, -40, 20, 70].map((a, i) => <path key={i} transform={`translate(706 470) rotate(${a})`} d="M 0 0 Q 70 -30 140 20 Q 70 -6 0 10 Z" fill="#5c7a4a" />)}
        <path d="M 750 420 V 860 M 560 640 H 940" stroke={TINTA} strokeWidth={6} />
        <path d="M 520 380 Q 560 640 540 900 L 600 900 Q 610 640 600 380 Z M 980 380 Q 940 640 960 900 L 900 900 Q 890 640 900 380 Z" fill="#e9b949" stroke={TINTA} strokeWidth={5} strokeLinejoin="round" />
        <rect x={500} y={360} width={500} height={26} rx={8} fill="#6e4a32" stroke={TINTA} strokeWidth={4} />
        {/* cuadros en la pared */}
        <rect x={120} y={480} width={200} height={240} fill="#d9c7a3" stroke="#5a3a2a" strokeWidth={14} />
        <circle cx={220} cy={570} r={44} fill="#6b3f26" /><path d="M 150 700 Q 220 600 290 700 Z" fill="#6b3f26" />
        <rect x={130} y={780} width={150} height={120} fill="#d9c7a3" stroke="#5a3a2a" strokeWidth={12} />
        <path d="M 160 870 l 30 -40 l 25 30 l 20 -20 l 30 30 Z" fill="#7cae6a" />
        {/* tapete */}
        <ellipse cx={420} cy={1580} rx={400} ry={90} fill="#b9574a" stroke={TINTA} strokeWidth={5} />
        <ellipse cx={420} cy={1580} rx={330} ry={64} fill="none" stroke="#e8c35a" strokeWidth={6} />
        {/* cuna: barrotes de atrás, bebé, barrotes de enfrente */}
        <rect x={140} y={1070} width={560} height={24} rx={10} fill="#c48a52" stroke={TINTA} strokeWidth={5} />
        <rect x={140} y={1250} width={560} height={160} fill="#fbf7ef" stroke={TINTA} strokeWidth={5} />
        <Bebe f={f} x={420} y={1290} s={0.95} sonaja cejas={1.2} mirarX={f > 80 ? 0.5 : 0} />
        {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={160 + i * 64} y={1160} width={18} height={250} rx={8} fill="#d89c62" stroke={TINTA} strokeWidth={4} />)}
        <rect x={120} y={1140} width={600} height={30} rx={12} fill="#d89c62" stroke={TINTA} strokeWidth={5} />
        <rect x={120} y={1400} width={600} height={40} rx={10} fill="#c48a52" stroke={TINTA} strokeWidth={5} />
        <rect x={110} y={1070} width={36} height={480} rx={12} fill="#c48a52" stroke={TINTA} strokeWidth={5} />
        <rect x={694} y={1070} width={36} height={480} rx={12} fill="#c48a52" stroke={TINTA} strokeWidth={5} />
        <rect width={W} height={H} fill="url(#t3luz)" />
        <Adulto f={f} x={900} y={1700} s={0.9} id="t3mama" tipo="mama" pose={{ brazoI: 12, codoI: 105, brazoD: 8, codoD: 10, boca: "sonrisa", mirarX: -0.8, cabeza: -4 + 2 * Math.sin(f * 0.04) }} semilla={5} />
        <Etiqueta f={f} ini={20} x={420} y={830} texto="TÚ" sub="0 años" />
        <Etiqueta f={f} ini={44} x={880} y={760} texto="MAMÁ" giro={4} escala={0.9} />
      </Camara>
      <Vineta />
    </svg>
  );
};

// ───────────────────────── toma 4: tablero «para que no se te olvide» ─────────────────────────
const Polaroid: React.FC<{ f: number; ini: number; x: number; y: number; giro: number; pie: string; children: React.ReactNode }> = ({ f, ini, x, y, giro, pie, children }) => {
  const k = salto(f, ini, 180);
  if (f < ini) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${0.6 + 0.4 * k})`} opacity={Math.min(1, (f - ini) / 4)}>
      <rect x={-166} y={-176} width={340} height={400} fill="#000" opacity={0.3} />
      <rect x={-170} y={-180} width={340} height={400} fill="#fbf7ef" stroke={TINTA} strokeWidth={4} />
      <rect x={-140} y={-150} width={280} height={260} fill="#8fb7c9" stroke={TINTA} strokeWidth={3} />
      <g>{children}</g>
      <text x={0} y={180} textAnchor="middle" fontFamily="Nunito" fontWeight={900} fontSize={42} fill={TINTA}>{pie}</text>
      <circle cx={0} cy={-170} r={16} fill="#c8322b" stroke={TINTA} strokeWidth={4} />
    </g>
  );
};
const Toma4: React.FC = () => {
  const f = useCurrentFrame(), hilo = tramo(f, 46, 66);
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <defs>
        <pattern id="t4corcho" width="60" height="60" patternUnits="userSpaceOnUse"><rect width="60" height="60" fill="#c99a62" /><circle cx="12" cy="18" r="3" fill="#b5864f" /><circle cx="42" cy="40" r="2.5" fill="#b5864f" /><circle cx="30" cy="8" r="2" fill="#dcae74" /><circle cx="50" cy="14" r="2" fill="#b5864f" /><circle cx="8" cy="48" r="2.5" fill="#dcae74" /></pattern>
      </defs>
      <rect width={W} height={H} fill="#3b2a22" />
      <Camara f={f} dur={120} z0={1.0} z1={1.05} cy={1000}>
        <rect x={50} y={330} width={980} height={1360} rx={18} fill="#7a4e33" stroke={TINTA} strokeWidth={6} />
        <rect x={90} y={370} width={900} height={1280} fill="url(#t4corcho)" stroke={TINTA} strokeWidth={4} />
        <g transform="rotate(-2 540 470)"><rect x={270} y={420} width={540} height={100} fill="#fbf7ef" stroke={TINTA} strokeWidth={4} /><text x={540} y={486} textAnchor="middle" fontFamily="Alegreya" fontWeight={800} fontSize={44} fill="#5a3a2a" letterSpacing={2}>PARA QUE NO SE TE OLVIDE</text></g>
        <Polaroid f={f} ini={8} x={330} y={820} giro={-6} pie="TU BICI">
          <g stroke={TINTA} strokeWidth={6} fill="none"><circle cx={-60} cy={40} r={44} /><circle cx={70} cy={40} r={44} /><path d="M -60 40 L -10 -30 L 50 -30 L 70 40 M -10 -30 L 10 40 L 50 -30 M -24 -48 h 34 M 50 -30 l -6 -26 h 22" stroke="#2e8b57" strokeWidth={9} /></g>
        </Polaroid>
        <Polaroid f={f} ini={24} x={740} y={1180} giro={5} pie="TUS AMIGOS">
          <g fill="#3a2a22"><circle cx={-50} cy={-40} r={34} /><path d="M -100 110 Q -50 -10 0 110 Z" /><circle cx={50} cy={-30} r={30} /><path d="M 6 110 Q 50 0 96 110 Z" /></g>
          <text x={0} y={20} textAnchor="middle" fontFamily="Nunito" fontWeight={900} fontSize={110} fill="#fbf7ef" opacity={0.9}>?</text>
        </Polaroid>
        <path d="M 330 640 Q 560 860 740 1000" fill="none" stroke="#c8322b" strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - hilo} />
        {f >= 70 && <g transform={`translate(330 1360) rotate(-4) scale(${salto(f, 70)})`}><rect x={-150} y={-110} width={300} height={220} fill="#f7dc6f" stroke={TINTA} strokeWidth={4} /><text x={0} y={-14} textAnchor="middle" fontFamily="Nunito" fontWeight={900} fontSize={46} fill={TINTA}>IMPORTA</text><text x={0} y={44} textAnchor="middle" fontFamily="Nunito" fontWeight={900} fontSize={46} fill="#c8322b">DESPUÉS</text></g>}
      </Camara>
      <Vineta />
    </svg>
  );
};

// ───────────────────────── toma 5: portadilla de capítulo ─────────────────────────
const Toma5: React.FC = () => {
  const f = useCurrentFrame(), a = tramo(f, 4, 20), b = tramo(f, 14, 32), sal = 1 - tramo(f, 78, 90);
  return (
    <AbsoluteFill style={{ background: "#0b0908", alignItems: "center", justifyContent: "center", opacity: sal }}>
      <div style={{ opacity: a, transform: `translateY(${(1 - a) * 20}px)`, textAlign: "center" }}>
        <svg width={90} height={90} viewBox="-50 -50 100 100"><circle r={40} fill="none" stroke="#c9a25a" strokeWidth={5} /><path d="M 0 -26 L 8 -8 L 27 -8 L 12 4 L 18 24 L 0 12 L -18 24 L -12 4 L -27 -8 L -8 -8 Z" fill="#c9a25a" /></svg>
        <div style={{ fontFamily: "Alegreya", fontWeight: 700, fontSize: 40, letterSpacing: 14, color: "#c9a25a", marginTop: 24 }}>CAPÍTULO I</div>
      </div>
      <div style={{ opacity: b, transform: `translateY(${(1 - b) * 24}px)`, fontFamily: "Alegreya", fontWeight: 900, fontSize: 120, color: "#f3ead8", marginTop: 30 }}>Grove Street</div>
    </AbsoluteFill>
  );
};

// ───────────────────────── subtítulos (prueba, sin voz) ─────────────────────────
const SUBS: [number, number, string, string?][] = [
  [6, 60, "Si nacieras como", "CJ…"], [60, 132, "volverías a casa por", "un funeral."],
  [140, 205, "Y tus amigos de siempre", "te venderían."], [212, 262, "Todo", "por dinero."],
  [282, 340, "¿Pero ahora?", ""], [340, 412, "Eres un", "bebé."],
  [430, 486, "Acuérdate de", "esa bici."], [486, 536, "Importa", "después."],
];
const Subtitulos: React.FC = () => {
  const f = useCurrentFrame(), s = SUBS.find(([a, b]) => f >= a && f < b);
  if (!s) return null;
  const k = salto(f, s[0], 220), borde = { WebkitTextStroke: "14px #120d0b", paintOrder: "stroke fill" } as React.CSSProperties;
  return (
    <div style={{ position: "absolute", top: 1500, width: "100%", textAlign: "center", fontFamily: "Nunito", fontWeight: 900, fontSize: 76, lineHeight: "92px", transform: `scale(${0.85 + 0.15 * k})`, padding: "0 70px", boxSizing: "border-box" }}>
      <span style={{ color: "#fff", ...borde }}>{s[2]} </span><span style={{ color: "#ffc93c", ...borde }}>{s[3]}</span>
    </div>
  );
};

export const PruebaCJ: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame(), destello = interpolate(f, [133, 135, 140], [0, 0.6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence durationInFrames={135}><Toma1 /></Sequence>
      <Sequence from={135} durationInFrames={135}><Toma2 /></Sequence>
      <Sequence from={270} durationInFrames={150}><Toma3 /></Sequence>
      <Sequence from={420} durationInFrames={120}><Toma4 /></Sequence>
      <Sequence from={540} durationInFrames={90}><Toma5 /></Sequence>
      <Subtitulos />
      <AbsoluteFill style={{ background: "#fff", opacity: destello }} />
    </AbsoluteFill>
  );
};
