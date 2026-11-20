// CJ (fan art, dibujo propio) según la skill borninlore-animacion: cel shading plano de borde duro (sin degradados
// en el personaje), piel en 4 tonos, contorno casi negro #120b08 grueso ENCIMA de las sombras, líneas internas
// delgadas y teñidas (nunca negras), cero esquinas, rim light naranja del lado del sol, bigote delgado arriba del
// labio, perilla con textura, camiseta de tirantes con escote en U.
import React from "react";
import { parpadea } from "./dibujo";

const K = "#120b08";
const S0 = "#8b502b", S1 = "#7a4426", S2 = "#5d2f18", S3 = "#3e1c0b", SH = "#a86f4c", SH2 = "#985f3a", RIM = "#f4a868", PELO = "#0f0805";
const LINEA = "#4a2414"; // líneas internas teñidas

// cabeza calcada por coordenadas sobre la meta (cuadrícula): origen en el centro de la cara
const CABEZA = "M -20 -258 C 60 -260 132 -225 140 -155 C 148 -90 148 -10 140 60 C 134 130 120 175 100 200 C 70 240 30 258 -5 258 C -45 256 -80 232 -98 205 C -125 180 -150 150 -158 110 C -168 60 -168 0 -166 -40 C -168 -100 -178 -150 -170 -185 C -150 -235 -90 -258 -20 -258 Z";
const CUELLO = "M -150 120 C -146 220 -150 320 -160 420 L 136 420 C 126 320 124 230 128 160 Z";

export type GestoCJ = { mirarX?: number; mirarY?: number; cabeza?: number; boca?: "seria" | "abierta" };

export const CabezaCJ2: React.FC<{ f: number; id: string; g?: GestoCJ; semilla?: number }> = ({ f, id, g = {}, semilla = 2 }) => {
  const p = (k: string) => `${id}-${k}`, u = (k: string) => `url(#${p(k)})`;
  const cerr = parpadea(f, semilla), mx = (g.mirarX ?? 0) * 6, my = (g.mirarY ?? 0) * 3;
  const ojo = (cx: number, cy: number, w: number, k: string) => {
    const d = `M ${cx - w} ${cy + 1} Q ${cx - w * 0.15} ${cy - 13} ${cx + w} ${cy - 1} Q ${cx + w * 0.1} ${cy + 9} ${cx - w} ${cy + 1} Z`;
    return (
      <g>
        <path d={d} fill="#efe6d6" />
        <clipPath id={p("o" + k)}><path d={d} /></clipPath>
        {!cerr && <g clipPath={u("o" + k)}>
          <circle cx={cx + mx} cy={cy - 1 + my} r={9} fill="#4a2a17" /><circle cx={cx + mx} cy={cy - 1 + my} r={4.5} fill="#120906" />
          <circle cx={cx + mx + 3} cy={cy - 4 + my} r={2.4} fill="#fff" />
          <path d={`M ${cx - w - 4} ${cy - 16} H ${cx + w + 4} V ${cy - 6} Q ${cx} ${cy - 9} ${cx - w - 4} ${cy - 4} Z`} fill={S2} />
        </g>}
        {cerr
          ? <path d={`M ${cx - w} ${cy + 1} Q ${cx} ${cy + 7} ${cx + w} ${cy - 1}`} fill="none" stroke={K} strokeWidth={6} strokeLinecap="round" />
          : <path d={`M ${cx - w - 2} ${cy + 2} Q ${cx - w * 0.15} ${cy - 15} ${cx + w + 2} ${cy - 1}`} fill="none" stroke={K} strokeWidth={6} strokeLinecap="round" />}
        <path d={`M ${cx - w * 0.8} ${cy - 16} Q ${cx} ${cy - 24} ${cx + w * 0.8} ${cy - 15}`} fill="none" stroke={S2} strokeWidth={3} strokeLinecap="round" />
        <path d={`M ${cx - w * 0.7} ${cy + 9} Q ${cx} ${cy + 13} ${cx + w * 0.7} ${cy + 6}`} fill="none" stroke={LINEA} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <clipPath id={p("cab")}><path d={CABEZA} /></clipPath>
        <pattern id={p("perilla")} width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill={S2} /><circle cx="2" cy="2" r="1.4" fill={PELO} /><circle cx="5.5" cy="5.5" r="1.4" fill={PELO} /></pattern>
      </defs>
      {/* orejas */}
      <path d="M -160 -32 C -232 -44 -234 124 -158 124 Z" fill={S1} stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -172 0 C -200 10 -198 80 -168 92" fill="none" stroke={S2} strokeWidth={10} strokeLinecap="round" />
      <path d="M 140 -44 C 206 -56 210 120 136 124 Z" fill={S0} stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M 152 -10 C 180 0 180 80 150 94" fill="none" stroke={S2} strokeWidth={10} strokeLinecap="round" />
      {/* cara */}
      <path d={CABEZA} fill={S0} />
      <g clipPath={u("cab")}>
        <path d="M -190 -300 L -140 -300 C -150 -120 -146 20 -120 130 C -100 190 -60 240 -20 280 L -190 280 Z" fill={S1} />
        <path d="M -126 -26 Q -80 -40 -20 -26 L -20 6 Q -80 18 -126 4 Z M 18 -28 Q 80 -42 134 -26 L 134 4 Q 80 18 18 4 Z" fill={S1} />
        <path d="M -140 40 Q -110 60 -96 110 Q -120 100 -140 80 Z M 96 30 Q 120 50 128 100 Q 104 90 92 70 Z" fill={S1} />
        <path d="M -52 186 Q 10 196 74 184 Q 50 210 10 214 Q -30 210 -52 186 Z" fill={S1} />
        <path d="M -150 140 C -110 210 -50 252 -5 254 C 40 252 84 222 108 186 L 120 280 L -150 280 Z" fill={S1} opacity={0.6} />
        {/* brillos */}
        <ellipse cx={-55} cy={-140} rx={52} ry={20} fill={SH} />
        <path d="M 0 -6 Q 6 30 9 72 Q 3 80 -2 72 Q -4 30 -6 -6 Z" fill={SH} />
        {/* rim light a la derecha */}
        <path d="M 126 -190 C 140 -120 142 -20 136 60 C 132 120 120 160 104 186" fill="none" stroke={RIM} strokeWidth={7} strokeLinecap="round" />
        {/* pelo: gorrita redonda, baja por el lado izquierdo hasta la sien */}
        <path d="M -168 -66 C -184 -150 -150 -252 -20 -264 C 80 -268 138 -226 144 -150 L 124 -176 Q 0 -192 -112 -184 Q -146 -150 -152 -66 Z" fill={PELO} />
        <path d="M -112 -184 Q 0 -192 124 -176" fill="none" stroke="#3a2416" strokeWidth={4} strokeDasharray="3 5" />
      </g>
      <path d={CABEZA} fill="none" stroke={K} strokeWidth={9} strokeLinejoin="round" />
      {/* cejas */}
      <path d="M -128 -36 Q -100 -62 -40 -58 Q -14 -54 -8 -34 Q -30 -42 -60 -42 Q -100 -42 -126 -26 Z" fill={PELO} />
      <path d="M 20 -32 Q 30 -52 64 -56 Q 110 -60 138 -44 Q 136 -36 130 -32 Q 100 -44 64 -42 Q 40 -40 20 -32 Z" fill={PELO} />
      {ojo(-78, -10, 38, "i")}{ojo(80, -10, 35, "d")}
      {/* nariz */}
      <path d="M -32 75 Q -50 82 -44 100 Q -38 108 -24 104 M 46 75 Q 62 82 56 100 Q 50 108 36 104" fill="none" stroke={K} strokeWidth={5.5} strokeLinecap="round" />
      <path d="M -24 104 Q 6 112 36 104" fill="none" stroke={LINEA} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={-14} cy={96} rx={6} ry={4} fill={S3} /><ellipse cx={24} cy={96} rx={6} ry={4} fill={S3} />
      <path d="M -20 60 Q -30 80 -32 75" fill="none" stroke={S1} strokeWidth={8} strokeLinecap="round" />
      {/* bigote delgado */}
      <path d="M -60 128 Q 10 120 72 130" fill="none" stroke="#5a3420" strokeWidth={4} strokeLinecap="round" />
      {/* labios */}
      {g.boca === "abierta" ? <path d="M -66 152 Q 10 138 86 152 Q 60 192 10 194 Q -40 192 -66 152 Z" fill="#3a1410" stroke={K} strokeWidth={5} />
        : <g>
          <path d="M -66 153 Q -40 132 10 138 Q 50 132 86 153 Z" fill="#5e2a1c" />
          <path d="M -55 155 Q 10 157 70 155 Q 50 186 10 188 Q -30 186 -55 155 Z" fill="#a0684e" />
          <path d="M -70 154 Q 10 152 88 154" fill="none" stroke={K} strokeWidth={5} strokeLinecap="round" />
          <path d="M -20 168 Q 10 172 40 167" fill="none" stroke="#c0886c" strokeWidth={5} strokeLinecap="round" />
        </g>}
      {/* perilla */}
      <path d="M -20 202 Q 0 196 20 202 Q 12 236 0 248 Q -12 236 -20 202 Z" fill={u("perilla")} />
    </g>
  );
};

/** busto de CJ: hombros anchos, cuello ancho con tendones, camiseta de tirantes con escote en U */
export const BustoCJ2: React.FC<{ f: number; x: number; y: number; s?: number; id: string; g?: GestoCJ; semilla?: number }> = ({ f, x, y, s = 1, id, g = {}, semilla = 2 }) => {
  const t = f / 30, r = Math.sin(2 * Math.PI * 0.58 * t);
  const p = (k: string) => `${id}-${k}`, u = (k: string) => `url(#${p(k)})`;
  const TORSO = "M -430 900 C -430 700 -400 470 -300 410 C -230 370 -170 336 -120 330 L 96 330 C 150 336 220 372 290 410 C 390 470 420 700 420 900 Z";
  const CAMISETA = "M -250 900 C -252 720 -250 540 -222 450 C -200 400 -176 370 -150 362 C -110 500 -60 540 -10 540 C 40 540 84 500 116 362 C 150 370 180 392 200 450 C 228 540 232 720 230 900 Z";
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) translate(0 900) scale(${1 + 0.003 * r} ${1 + 0.007 * r}) translate(0 -900)`}>
      <defs>
        <clipPath id={p("tor")}><path d={TORSO} /></clipPath>
        <clipPath id={p("cam")}><path d={CAMISETA} /></clipPath>
        <clipPath id={p("cue")}><path d={CUELLO} /></clipPath>
      </defs>
      {/* hombros y brazos (subidos 60 para un cuello más corto) */}
      <g transform="translate(0 -70)">
      <path d={TORSO} fill={S0} />
      <g clipPath={u("tor")}>
        <path d="M -440 420 L -230 380 C -260 520 -270 760 -250 900 L -440 900 Z" fill={S1} />
        <path d="M -440 560 C -380 600 -340 720 -330 900 L -440 900 Z" fill={S2} />
        <path d="M 210 380 C 280 400 340 450 380 530 C 330 510 280 490 240 480 Z" fill={SH} />
        <path d="M 300 420 C 380 470 412 600 418 780" fill="none" stroke={RIM} strokeWidth={12} strokeLinecap="round" />
        <path d="M -310 620 Q -296 700 -306 820 M 300 640 Q 290 720 300 840" fill="none" stroke={LINEA} strokeWidth={3} strokeLinecap="round" />
        <path d="M -230 560 Q -200 640 -214 720" fill="none" stroke={S3} strokeWidth={22} strokeLinecap="round" opacity={0.6} />
      </g>
      <path d={TORSO} fill="none" stroke={K} strokeWidth={10} strokeLinejoin="round" />
      </g>
      {/* cuello ancho con banda de sombra bajo la quijada y tendones */}
      <g transform="translate(0 0)">
        <path d={CUELLO} fill={S0} />
        <g clipPath={u("cue")}>
          <path d="M -140 100 L 120 100 L 120 210 Q 0 250 -140 200 Z" fill={S2} />
          <path d="M -140 100 L -70 100 Q -84 260 -96 400 L -140 400 Z" fill={S1} />
          <path d="M 84 230 Q 92 280 94 330" fill="none" stroke={RIM} strokeWidth={8} strokeLinecap="round" />
          <path d="M -60 230 Q -40 300 -20 360 M 40 230 Q 26 300 6 360" fill="none" stroke={LINEA} strokeWidth={3} strokeLinecap="round" />
          <path d="M -18 286 Q -8 300 2 286" fill="none" stroke={LINEA} strokeWidth={3} strokeLinecap="round" />
        </g>
        <path d="M -150 120 C -146 220 -150 320 -160 420 M 136 420 C 126 320 124 230 128 160" fill="none" stroke={K} strokeWidth={10} strokeLinecap="round" />
      </g>
      <g transform="translate(0 -80)">
      {/* clavículas */}
      <path d="M -200 380 Q -130 400 -40 370 M 30 370 Q 110 400 170 378" fill="none" stroke={LINEA} strokeWidth={3} strokeLinecap="round" />
      {/* camiseta de tirantes con banda acanalada */}
      <path d={CAMISETA} fill="#f2ede2" />
      <g clipPath={u("cam")}>
        <path d="M -260 520 C -220 640 -230 780 -250 900 L -300 900 L -300 500 Z" fill="#d8d0c0" />
        <path d="M -200 700 Q -150 720 -110 700 M -60 780 Q 0 800 60 780 M 90 700 Q 140 720 190 690 M -190 840 Q -160 850 -130 840" fill="none" stroke="#c9c0ae" strokeWidth={3} strokeLinecap="round" />
        <path d="M 140 520 C 190 580 210 700 214 860" fill="none" stroke="#fffaf0" strokeWidth={14} strokeLinecap="round" opacity={0.8} />
      </g>
      <path d={CAMISETA} fill="none" stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -150 362 C -110 500 -60 540 -10 540 C 40 540 84 500 116 362" fill="none" stroke="#cfc6b4" strokeWidth={16} />
      <path d="M -150 362 C -110 500 -60 540 -10 540 C 40 540 84 500 116 362" fill="none" stroke={K} strokeWidth={9} strokeLinecap="round" />
      <path d="M -222 450 C -200 400 -176 370 -150 362 M 116 362 C 150 370 180 392 200 450" fill="none" stroke="#cfc6b4" strokeWidth={14} strokeLinecap="round" />
      </g>
      {/* cabeza */}
      <g transform={`rotate(${(g.cabeza ?? 0) + 0.8 * Math.sin(t * 1.3)} 0 200)`}>
        <CabezaCJ2 f={f} id={id} g={g} semilla={semilla} />
      </g>
    </g>
  );
};
