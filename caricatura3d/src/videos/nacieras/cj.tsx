// CJ (fan art, dibujo propio) según la skill borninlore-animacion: cel shading plano de borde duro (sin degradados
// en el personaje), piel en 4 tonos, contorno casi negro #120b08 grueso ENCIMA de las sombras, líneas internas
// delgadas y teñidas (nunca negras), cero esquinas, rim light naranja del lado del sol, bigote delgado arriba del
// labio, perilla con textura, camiseta de tirantes con escote en U.
import React from "react";
import { parpadea } from "./dibujo";

const K = "#120b08";
const S0 = "#8b502b", S1 = "#7a4426", S2 = "#5d2f18", S3 = "#3e1c0b", SH = "#a86f4c", SH2 = "#985f3a", RIM = "#f4a868", PELO = "#0f0805";
const LINEA = "#4a2414"; // líneas internas teñidas

// cabeza calcada por coordenadas sobre el VIDEO ORIGINAL (cuadro 1.5 s, cuadrícula 4x); origen en el centro de la cara
const CABEZA = "M 0 -258 C 60 -258 112 -236 128 -205 C 146 -170 152 -120 153 -60 C 155 20 150 90 138 130 C 124 175 104 205 70 230 C 50 245 34 254 4 257 C -20 258 -40 250 -64 232 C -96 210 -116 190 -130 168 C -146 140 -152 90 -156 20 C -160 -60 -158 -130 -150 -180 C -136 -230 -74 -258 0 -258 Z";
const CUELLO = "M -132 150 C -128 240 -134 330 -146 420 L 140 420 C 128 330 126 240 130 150 Z";

export type GestoCJ = { mirarX?: number; mirarY?: number; cabeza?: number; boca?: "seria" | "abierta" };

export const CabezaCJ2: React.FC<{ f: number; id: string; g?: GestoCJ; semilla?: number }> = ({ f, id, g = {}, semilla = 2 }) => {
  const p = (k: string) => `${id}-${k}`, u = (k: string) => `url(#${p(k)})`;
  const cerr = parpadea(f, semilla), mx = (g.mirarX ?? 0) * 5, my = (g.mirarY ?? 0) * 2;
  const ojo = (cx: number, cy: number, w: number, k: string) => {
    const d = `M ${cx - w} ${cy + 2} Q ${cx - w * 0.1} ${cy - 17} ${cx + w} ${cy} Q ${cx} ${cy + 11} ${cx - w} ${cy + 2} Z`;
    return (
      <g>
        <path d={d} fill="#efe6d6" />
        <clipPath id={p("o" + k)}><path d={d} /></clipPath>
        {!cerr && <g clipPath={u("o" + k)}>
          <circle cx={cx + mx} cy={cy + my} r={10} fill="#3e2416" /><circle cx={cx + mx} cy={cy + my} r={4} fill="#100805" />
          <circle cx={cx + mx + 3} cy={cy - 3 + my} r={2.2} fill="#fff" />
          <path d={`M ${cx - w - 4} ${cy - 14} H ${cx + w + 4} V ${cy - 4} Q ${cx} ${cy - 7} ${cx - w - 4} ${cy - 2} Z`} fill={S2} />
        </g>}
        {cerr
          ? <path d={`M ${cx - w} ${cy + 2} Q ${cx} ${cy + 6} ${cx + w} ${cy}`} fill="none" stroke={K} strokeWidth={6} strokeLinecap="round" />
          : <path d={`M ${cx - w - 2} ${cy + 3} Q ${cx - w * 0.1} ${cy - 16} ${cx + w + 2} ${cy}`} fill="none" stroke={K} strokeWidth={6} strokeLinecap="round" />}
        <path d={`M ${cx - w * 0.75} ${cy + 8} Q ${cx} ${cy + 12} ${cx + w * 0.75} ${cy + 6}`} fill="none" stroke={LINEA} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
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
      <path d="M -150 -30 C -196 -40 -200 120 -140 120 Z" fill={S1} stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -160 0 C -180 14 -178 80 -152 94" fill="none" stroke={S2} strokeWidth={10} strokeLinecap="round" />
      <path d="M 150 -46 C 222 -56 222 120 140 120 Z" fill={S0} stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M 162 -12 C 196 0 194 80 160 96" fill="none" stroke={S2} strokeWidth={10} strokeLinecap="round" />
      {/* cara */}
      <path d={CABEZA} fill={S0} />
      <g clipPath={u("cab")}>
        <path d="M -170 -300 L -122 -300 C -130 -120 -132 20 -116 120 C -100 190 -70 230 -30 280 L -170 280 Z" fill={S1} />
        {/* mejillas: plano de sombra bajo los ojos */}
        <path d="M -126 6 Q -96 20 -76 60 Q -70 100 -96 126 Q -124 120 -134 70 Q -136 30 -126 6 Z M 76 16 Q 112 10 146 24 Q 150 80 132 132 Q 104 118 90 86 Q 78 52 76 16 Z" fill={S1} opacity={0.6} />
        {/* bajo los labios y la quijada */}
        <path d="M -60 176 Q 10 186 84 174 Q 60 200 12 206 Q -36 200 -60 176 Z" fill={S1} />
        <path d="M -150 150 C -110 220 -50 262 4 262 C 50 260 96 230 120 196 L 130 300 L -150 300 Z" fill={S1} opacity={0.55} />
        {/* brillos: frente, puente de la nariz */}
        <path d="M -110 -168 Q -60 -180 -10 -168 Q -20 -140 -60 -136 Q -100 -140 -110 -168 Z" fill={SH} />
        <path d="M -1 11 Q 6 40 13 67 Q 6 74 0 67 Q -4 40 -5 11 Z" fill={SH} />
        {/* rim light a la derecha */}
        <path d="M 124 -200 C 142 -150 146 -60 146 20 C 144 90 134 140 112 186" fill="none" stroke={RIM} strokeWidth={6} strokeLinecap="round" />
        {/* pelo: casquete grueso con línea de frente RECTA y esquinas cuadradas; baja grueso por la izquierda */}
        <path d="M -162 -80 C -166 -150 -152 -210 -110 -238 C -70 -262 -20 -266 10 -266 C 70 -266 120 -240 136 -200 L 124 -184 L -104 -184 Q -116 -182 -118 -170 L -120 -84 Q -140 -76 -162 -80 Z" fill={PELO} />
      </g>
      <path d={CABEZA} fill="none" stroke={K} strokeWidth={9} strokeLinejoin="round" />
      {/* cejas: muy gruesas, bajan hacia la nariz */}
      <path d="M -128 -38 Q -100 -58 -60 -60 Q -28 -60 -6 -40 L -10 -24 Q -36 -36 -64 -38 Q -96 -38 -126 -28 Z" fill={PELO} />
      <path d="M 28 -40 Q 50 -60 90 -60 Q 126 -60 148 -48 L 142 -36 Q 116 -42 90 -40 Q 56 -38 32 -24 Z" fill={PELO} />
      {ojo(-71, -8, 32, "i")}{ojo(88, -8, 33, "d")}
      {/* nariz: ancha abajo, alas y fosas */}
      <path d="M -8 -24 Q -10 30 -26 74 Q -14 70 -4 80 Q -2 30 -2 -24 Z" fill={S1} />
      <path d="M -20 68 Q -46 70 -46 90 Q -44 104 -22 102 Q -30 88 -20 68 Z M 38 68 Q 64 70 64 90 Q 62 104 40 102 Q 48 88 38 68 Z" fill={S1} />
      <path d="M -44 82 Q -48 98 -26 103 M 62 82 Q 66 98 44 103" fill="none" stroke={LINEA} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M -20 101 Q 8 108 38 101" fill="none" stroke={LINEA} strokeWidth={3} strokeLinecap="round" />
      <ellipse cx={-6} cy={95} rx={6} ry={4} fill={S3} /><ellipse cx={24} cy={95} rx={6} ry={4} fill={S3} />
      {/* rayitas de la nariz a la boca */}
      <path d="M -44 100 Q -60 118 -62 140 M 62 100 Q 78 118 82 140" fill="none" stroke={LINEA} strokeWidth={3} strokeLinecap="round" opacity={0.85} />
      {/* bigote delgado */}
      <path d="M -54 118 Q 10 110 74 118" fill="none" stroke="#3e2216" strokeWidth={3.5} strokeLinecap="round" />
      {/* labios: el de arriba grande y oscuro, comisuras hacia abajo */}
      {g.boca === "abierta" ? <path d="M -68 140 Q 10 120 86 140 Q 60 180 10 182 Q -40 180 -68 140 Z" fill="#3a1410" stroke={K} strokeWidth={5} />
        : <g>
          <path d="M -70 151 Q -52 118 10 120 Q 68 118 88 151 Q 10 146 -70 151 Z" fill="#4a2418" />
          <path d="M -64 151 Q 10 150 84 151 Q 64 174 10 176 Q -44 174 -64 151 Z" fill="#9a6050" />
          <path d="M -72 152 Q 10 145 90 152" fill="none" stroke={S3} strokeWidth={5} strokeLinecap="round" />
          <path d="M -24 162 Q 10 166 44 161" fill="none" stroke="#bd8670" strokeWidth={4} strokeLinecap="round" />
        </g>}
      {/* perilla chica en la barbilla */}
      <path d="M -16 202 Q -4 198 8 202 Q 4 228 -4 238 Q -12 228 -16 202 Z" fill={u("perilla")} />
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
        <path d="M -132 150 C -128 240 -134 330 -146 420 M 140 420 C 128 330 126 240 130 150" fill="none" stroke={K} strokeWidth={10} strokeLinecap="round" />
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
