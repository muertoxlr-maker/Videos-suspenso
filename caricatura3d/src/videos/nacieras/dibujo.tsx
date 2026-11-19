// Serie «Si nacieras como…»: dibujo 2D plano (SVG) — personajes de recortes, etiquetas, mapas y tableros.
// Estilo (medido en las referencias privadas): colores planos con una sombra suave, contorno café oscuro delgado,
// adultos de proporción normal, niños y bebés cabezones; animación de recortes (parpadeo, respiración, brazos
// que giran en el hombro y el codo), etiquetas que «saltan» y cámara que se acerca despacio.
import React from "react";
import { interpolate, spring } from "remotion";

export const FPS = 30;
export const TINTA = "#2b2220";
export const GROSOR = 4.5;

/** salto con rebote (0→1) a partir del cuadro `ini` */
export const salto = (f: number, ini: number, rigidez = 140) => spring({ frame: f - ini, fps: FPS, config: { damping: 11, stiffness: rigidez, mass: 0.7 } });
/** 0→1 suave entre a y b */
export const tramo = (f: number, a: number, b: number) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: (x) => x * x * (3 - 2 * x) });
/** parpadeo natural: ojos cerrados 4 cuadros cada ~3.4 s (con desfase por personaje) */
export const parpadea = (f: number, semilla: number) => { const p = (f + semilla * 37) % 103; return p < 4; };

export type Pose = {
  brazoI?: number; codoI?: number; brazoD?: number; codoD?: number; // grados; 0 = colgando
  cabeza?: number; mirarX?: number; mirarY?: number; boca?: "cerrada" | "o" | "sonrisa" | "seria"; cejas?: number; // cejas >0 enojado
  respira?: number; // fase
};

type Piel = { piel: string; sombra: string };
export const PIEL_OSCURA: Piel = { piel: "#8a5636", sombra: "#6b3f26" };
export const PIEL_MEDIA: Piel = { piel: "#a8693f", sombra: "#87512f" };

const Brazo: React.FC<{ x: number; y: number; a: number; c: number; lado: 1 | -1; piel: Piel; manga?: string; largo?: number }> = ({ x, y, a, c, lado, piel, manga, largo = 1 }) => {
  const sup = 170 * largo, inf = 150 * largo;
  return (
    <g transform={`translate(${x} ${y}) rotate(${-a * lado})`}>
      {/* brazo: hombro redondo que se adelgaza hasta el codo */}
      <path d={`M -32 0 Q -38 ${sup * 0.45} -25 ${sup} L 25 ${sup} Q 38 ${sup * 0.45} 32 0 A 32 32 0 0 0 -32 0 Z`} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
      <path d={`M ${lado * 14} 10 Q ${lado * 26} ${sup * 0.45} ${lado * 16} ${sup - 6}`} fill="none" stroke={piel.sombra} strokeWidth={14} strokeLinecap="round" opacity={0.5} />
      {manga && <path d={`M -36 -10 Q 0 -40 36 -10 L 40 54 Q 0 66 -40 54 Z`} fill={manga} stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />}
      <g transform={`translate(0 ${sup}) rotate(${-c * lado})`}>
        <path d={`M -25 0 Q -29 ${inf * 0.35} -19 ${inf} L 19 ${inf} Q 29 ${inf * 0.35} 25 0 A 25 25 0 0 0 -25 0 Z`} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
        <path d={`M ${lado * 10} 8 Q ${lado * 18} ${inf * 0.4} ${lado * 12} ${inf - 6}`} fill="none" stroke={piel.sombra} strokeWidth={11} strokeLinecap="round" opacity={0.45} />
        {/* mano: palma con pulgar y rayitas de dedos */}
        <g transform={`translate(0 ${inf - 4})`}>
          <ellipse cx={-lado * 20} cy={16} rx={10} ry={18} transform={`rotate(${lado * 25} ${-lado * 20} 16)`} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR - 0.5} />
          <path d="M -24 0 Q -30 40 -16 58 Q 0 66 16 58 Q 30 40 24 0 Z" fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR - 0.5} strokeLinejoin="round" />
          <path d="M -8 40 v 14 M 4 42 v 14" stroke={piel.sombra} strokeWidth={3} strokeLinecap="round" />
        </g>
      </g>
    </g>
  );
};

/** ojos + cejas + boca de adulto (cara de 3/4 frontal) */
const CaraAdulto: React.FC<{ f: number; semilla: number; pose: Pose; piel: Piel; mujer?: boolean }> = ({ f, semilla, pose, piel, mujer }) => {
  const cerrado = parpadea(f, semilla), mx = (pose.mirarX ?? 0) * 6, my = (pose.mirarY ?? 0) * 4, ce = pose.cejas ?? 0;
  const ojo = (cx: number) => cerrado ? (
    <path d={`M ${cx - 17} -2 Q ${cx} 5 ${cx + 17} -2`} fill="none" stroke={TINTA} strokeWidth={4} strokeLinecap="round" />
  ) : (
    <g>
      <path d={`M ${cx - 19} 0 Q ${cx} -14 ${cx + 19} 0 Q ${cx} 11 ${cx - 19} 0 Z`} fill="#fbf7ef" stroke={TINTA} strokeWidth={3.5} />
      <circle cx={cx + mx} cy={-1 + my} r={8.5} fill="#3a2418" />
      <circle cx={cx + mx + 2.5} cy={-4 + my} r={2.6} fill="#fff" />
      {mujer && <path d={`M ${cx - 20} -1 l -7 -6 M ${cx + 20} -1 l 7 -6`} stroke={TINTA} strokeWidth={3} strokeLinecap="round" />}
    </g>
  );
  const boca = pose.boca ?? "seria";
  return (
    <g>
      {ojo(-30)}{ojo(30)}
      <path d={`M -50 ${-26 + ce * 3} Q -32 ${-36 - ce * 2} -14 ${-27 + ce * 6}`} fill="none" stroke="#1d1411" strokeWidth={mujer ? 5 : 8} strokeLinecap="round" />
      <path d={`M 50 ${-26 + ce * 3} Q 32 ${-36 - ce * 2} 14 ${-27 + ce * 6}`} fill="none" stroke="#1d1411" strokeWidth={mujer ? 5 : 8} strokeLinecap="round" />
      <path d="M -4 4 Q -8 26 -14 36 Q -4 44 0 40 Q 4 44 14 36 Q 8 26 4 4" fill={piel.sombra} opacity={0.55} /><path d="M -16 34 Q -10 44 0 40 Q 10 44 16 34" fill="none" stroke={TINTA} strokeWidth={3.5} strokeLinecap="round" />
      {boca === "o" ? <ellipse cx={0} cy={62} rx={11} ry={13} fill="#3a1714" stroke={TINTA} strokeWidth={3.5} />
        : boca === "sonrisa" ? <path d="M -24 56 Q 0 76 24 56 Q 0 66 -24 56 Z" fill="#5a2620" stroke={TINTA} strokeWidth={3.5} strokeLinejoin="round" />
        : <g><path d="M -26 62 Q -10 54 0 58 Q 10 54 26 62 Q 0 74 -26 62 Z" fill="#5a2f26" stroke={TINTA} strokeWidth={3.5} strokeLinejoin="round" /><path d="M -24 62 Q 0 64 24 62" stroke={TINTA} strokeWidth={3} fill="none" /></g>}
    </g>
  );
};

const CABEZA = "M -74 -20 Q -76 -98 0 -100 Q 76 -98 74 -20 Q 72 42 44 80 Q 18 104 0 104 Q -18 104 -44 80 Q -72 42 -74 -20 Z";

/** CJ (diseño propio inspirado en el personaje): pelo al rape, bigote y piocha delgados, camiseta sin mangas, jeans */
export const Adulto: React.FC<{ f: number; x: number; y: number; s?: number; id: string; pose?: Pose; semilla?: number; tipo: "cj" | "mama"; piel?: Piel }> = ({ f, x, y, s = 1, id, pose = {}, semilla = 1, tipo, piel = PIEL_OSCURA }) => {
  const r = 1 + 0.008 * Math.sin((f + (pose.respira ?? 0) * 30) * 0.12), mujer = tipo === "mama";
  const camisa = mujer ? "#d9773a" : "#f1eee6", camisaS = mujer ? "#b65d27" : "#d9d4c6";
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {/* sombra en el piso */}
      <ellipse cx={0} cy={2} rx={150} ry={20} fill="#000" opacity={0.18} />
      {/* piernas / vestido */}
      {mujer ? (
        <g>
          <path d="M -40 -30 h 28 v 30 h -36 Z M 12 -30 h 28 l 8 30 h -36 Z" fill="#3a2a22" stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
        </g>
      ) : (
        <g>
          <path d="M -100 -440 L -6 -440 L -14 -38 L -90 -38 Z" fill="#41628f" stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
          <path d="M 100 -440 L 6 -440 L 14 -38 L 90 -38 Z" fill="#41628f" stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
          <path d="M -60 -420 L -54 -60 M 62 -300 L 58 -60" stroke="#33507a" strokeWidth={10} opacity={0.6} strokeLinecap="round" />
          <path d="M -80 -220 q 20 8 40 0 M 30 -220 q 20 8 40 0 M -92 -60 h 80 M 12 -60 h 80" fill="none" stroke="#2c4467" strokeWidth={4} strokeLinecap="round" />
          <path d="M -6 -440 L 0 -380 L 6 -440" fill="none" stroke="#2c4467" strokeWidth={4} />
          <path d="M -100 -40 Q -110 -2 -88 0 L -10 0 Q 0 -2 -10 -40 Z M 100 -40 Q 110 -2 88 0 L 10 0 Q 0 -2 10 -40 Z" fill="#f4f2ec" stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
          <path d="M -100 -12 h 92 M 100 -12 h -92" stroke="#c9c4b8" strokeWidth={5} />
          <rect x={-104} y={-458} width={208} height={24} rx={4} fill="#2a2523" stroke={TINTA} strokeWidth={GROSOR} />
          <rect x={-14} y={-456} width={28} height={20} rx={3} fill="#b8a46a" stroke={TINTA} strokeWidth={3} />
        </g>
      )}
      <g transform={`translate(0 -440) scale(1 ${r}) translate(0 440)`}>
        {/* torso */}
        {mujer ? (
          <path d="M -98 -700 Q -110 -730 -58 -738 L 58 -738 Q 110 -730 98 -700 L 158 -28 Q 0 -10 -158 -28 Z" fill={camisa} stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
        ) : (
          <g>
            <path d="M -126 -690 Q -132 -726 -60 -738 L 60 -738 Q 132 -726 126 -690 L 104 -446 L -104 -446 Z" fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
            <path d="M -78 -728 L -56 -730 Q 0 -640 56 -730 L 78 -728 L 102 -590 L 104 -446 L -104 -446 L -102 -590 Z" fill={camisa} stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
            <path d="M -60 -560 Q -20 -540 -6 -560 M 60 -560 Q 20 -540 6 -560 M -40 -500 Q 0 -490 40 -500" fill="none" stroke="#cfc9bb" strokeWidth={4} strokeLinecap="round" />
          </g>
        )}
        <path d={mujer ? "M 60 -700 L 120 -60 L 150 -40 L 96 -700 Z" : "M 60 -600 Q 90 -520 98 -450 L 104 -446 L 102 -590 Z"} fill={camisaS} opacity={0.8} />
        {mujer && <path d="M -60 -736 Q 0 -690 60 -736" fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} />}
        {/* brazos */}
        <Brazo x={-122} y={-700} a={pose.brazoI ?? 6} c={pose.codoI ?? 4} lado={-1} piel={piel} manga={mujer ? camisa : undefined} />
        <Brazo x={122} y={-700} a={pose.brazoD ?? 6} c={pose.codoD ?? 4} lado={1} piel={piel} manga={mujer ? camisa : undefined} />
        {/* cuello y cabeza */}
        <rect x={-30} y={-786} width={60} height={64} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} />
        <rect x={-30} y={-760} width={60} height={22} fill={piel.sombra} opacity={0.5} />
        <g transform={`translate(0 -850) rotate(${pose.cabeza ?? 0})`}>
          <defs><clipPath id={`${id}-cab`}><path d={CABEZA} /></clipPath></defs>
          {mujer && <><circle cx={0} cy={-104} r={52} fill="#1d1512" stroke={TINTA} strokeWidth={GROSOR} /><circle cx={-74} cy={30} r={10} fill="#e8c35a" stroke={TINTA} strokeWidth={3} /><circle cx={74} cy={30} r={10} fill="#e8c35a" stroke={TINTA} strokeWidth={3} /></>}
          <ellipse cx={-74} cy={6} rx={14} ry={22} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} />
          <ellipse cx={74} cy={6} rx={14} ry={22} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} />
          <path d={CABEZA} fill={piel.piel} />
          <g clipPath={`url(#${id}-cab)`}>
            <ellipse cx={58} cy={10} rx={40} ry={110} fill={piel.sombra} opacity={0.4} />
            {mujer ? <path d="M -90 -20 Q -70 -110 0 -96 Q 70 -110 90 -20 Q 40 -70 0 -64 Q -40 -70 -90 -20 Z" fill="#1d1512" />
              : <path d="M -90 -34 Q -78 -100 0 -100 Q 78 -100 90 -34 Q 60 -62 0 -66 Q -60 -62 -90 -34 Z" fill="#1d1512" />}
            {!mujer && <path d="M -90 -34 Q -60 -60 0 -64 Q 60 -60 90 -34" fill="none" stroke="#3a2a22" strokeWidth={3} opacity={0.6} />}
          </g>
          <path d={CABEZA} fill="none" stroke={TINTA} strokeWidth={GROSOR} strokeLinejoin="round" />
          <g transform="translate(0 6)"><CaraAdulto f={f} semilla={semilla} pose={pose} piel={piel} mujer={mujer} /></g>
          {!mujer && <g fill="#1d1411"><path d="M -28 58 Q 0 48 28 58 L 26 63 Q 0 54 -26 63 Z" /><path d="M -10 86 Q 0 100 10 86 L 7 82 Q 0 90 -7 82 Z" /></g>}
        </g>
      </g>
    </g>
  );
};

/** bebé sentado (cabezón, cejas serias): origen en la base del cuerpo */
export const Bebe: React.FC<{ f: number; x: number; y: number; s?: number; piel?: Piel; cejas?: number; sonaja?: boolean; semilla?: number; mirarX?: number }> = ({ f, x, y, s = 1, piel = PIEL_OSCURA, cejas = 1, sonaja, semilla = 3, mirarX = 0 }) => {
  const cerrado = parpadea(f, semilla), agita = sonaja ? 16 * Math.sin(f * 0.38) : 0, mx = mirarX * 6;
  const ojo = (cx: number) => cerrado ? <path d={`M ${cx - 18} 0 Q ${cx} 9 ${cx + 18} 0`} fill="none" stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
    : <g><circle cx={cx} cy={0} r={21} fill="#fbf7ef" stroke={TINTA} strokeWidth={4} /><circle cx={cx + mx} cy={2} r={11} fill="#2a1a12" /><circle cx={cx + mx + 4} cy={-3} r={3.5} fill="#fff" /></g>;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx={0} cy={-78} rx={74} ry={84} fill="#a9cde8" stroke={TINTA} strokeWidth={GROSOR} />
      <path d="M 30 -140 Q 70 -100 60 -30 Q 40 -10 20 -10 Z" fill="#8bb4d4" opacity={0.7} />
      <g transform={`translate(-58 -120) rotate(${30})`}><rect x={-20} y={0} width={40} height={78} rx={20} fill="#a9cde8" stroke={TINTA} strokeWidth={GROSOR} /><circle cx={0} cy={82} r={21} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} /></g>
      <g transform={`translate(58 -120) rotate(${-120 + agita})`}>
        <rect x={-20} y={0} width={40} height={74} rx={20} fill="#a9cde8" stroke={TINTA} strokeWidth={GROSOR} />
        {sonaja && <g transform="translate(0 92)"><rect x={-6} y={0} width={12} height={46} rx={6} fill="#f2c94c" stroke={TINTA} strokeWidth={3.5} /><circle cx={0} cy={56} r={22} fill="#e05a47" stroke={TINTA} strokeWidth={4} /><circle cx={-7} cy={50} r={5} fill="#fff" opacity={0.6} /></g>}
        <circle cx={0} cy={80} r={21} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} />
      </g>
      <g transform={`translate(0 -240) rotate(${3 * Math.sin(f * 0.07)})`}>
        <circle cx={-98} cy={10} r={20} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} />
        <circle cx={98} cy={10} r={20} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} />
        <circle cx={0} cy={0} r={100} fill={piel.piel} stroke={TINTA} strokeWidth={GROSOR} />
        <path d="M 60 -70 A 100 100 0 0 1 60 76 Q 86 0 60 -70 Z" fill={piel.sombra} opacity={0.4} />
        <path d="M -22 -96 q 10 -26 26 -4 q 8 -24 24 0" fill="none" stroke="#1d1512" strokeWidth={7} strokeLinecap="round" />
        <g transform="translate(0 6)">{ojo(-38)}{ojo(38)}</g>
        <path d={`M -62 ${-30 + cejas * 2} L -18 ${-24 + cejas * 7}`} stroke="#1d1411" strokeWidth={8} strokeLinecap="round" />
        <path d={`M 62 ${-30 + cejas * 2} L 18 ${-24 + cejas * 7}`} stroke="#1d1411" strokeWidth={8} strokeLinecap="round" />
        <ellipse cx={-62} cy={38} rx={16} ry={9} fill="#e0705a" opacity={0.5} />
        <ellipse cx={62} cy={38} rx={16} ry={9} fill="#e0705a" opacity={0.5} />
        <path d="M -6 24 Q 0 32 6 24" fill="none" stroke={piel.sombra} strokeWidth={4} strokeLinecap="round" />
        <path d="M -14 54 Q 0 48 14 54" fill="none" stroke={TINTA} strokeWidth={5} strokeLinecap="round" />
      </g>
    </g>
  );
};

/** etiqueta blanca redondeada con nombre (y subtítulo chico) que salta; flecha opcional dibujándose */
export const Etiqueta: React.FC<{ f: number; ini: number; x: number; y: number; texto: string; sub?: string; flecha?: [number, number]; giro?: number; escala?: number }> = ({ f, ini, x, y, texto, sub, flecha, giro = -3, escala = 1 }) => {
  const k = salto(f, ini), w = Math.max(texto.length * 31 + 56, sub ? sub.length * 18 + 50 : 0), h = sub ? 104 : 76;
  if (f < ini) return null;
  const fl = flecha ? tramo(f, ini + 4, ini + 16) : 0;
  return (
    <g>
      {flecha && <path d={`M ${x} ${y + h / 2 - 6} Q ${(x + flecha[0]) / 2 + 40} ${(y + flecha[1]) / 2 + 60} ${flecha[0]} ${flecha[1]}`} fill="none" stroke="#fbf7ef" strokeWidth={7} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - fl} style={{ filter: "drop-shadow(0 2px 2px rgba(0,0,0,.4))" }} />}
      <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${k * escala})`}>
        <rect x={-w / 2 + 5} y={-h / 2 + 7} width={w} height={h} rx={h / 2.4} fill="#000" opacity={0.25} />
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2.4} fill="#fbf7ef" stroke={TINTA} strokeWidth={5} />
        <text x={0} y={sub ? 4 : 17} textAnchor="middle" fontFamily="Nunito" fontWeight={900} fontSize={48} fill={TINTA}>{texto}</text>
        {sub && <text x={0} y={40} textAnchor="middle" fontFamily="Nunito" fontWeight={800} fontSize={32} fill="#6b5a50">{sub}</text>}
      </g>
    </g>
  );
};

/** sello de goma rojo que cae con golpe */
export const Sello: React.FC<{ f: number; ini: number; x: number; y: number; texto: string; giro?: number }> = ({ f, ini, x, y, texto, giro = -12 }) => {
  if (f < ini) return null;
  const k = salto(f, ini, 260), s = interpolate(k, [0, 1], [2.2, 1]), o = Math.min(1, (f - ini) / 3), w = texto.length * 52 + 70;
  return (
    <g transform={`translate(${x} ${y}) rotate(${giro}) scale(${s})`} opacity={o}>
      <rect x={-w / 2} y={-62} width={w} height={124} rx={14} fill="none" stroke="#c8322b" strokeWidth={11} />
      <rect x={-w / 2 + 14} y={-48} width={w - 28} height={96} rx={8} fill="none" stroke="#c8322b" strokeWidth={4} />
      <text x={0} y={26} textAnchor="middle" fontFamily="Nunito" fontWeight={900} fontSize={76} letterSpacing={4} fill="#c8322b">{texto}</text>
    </g>
  );
};
