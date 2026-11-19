// CJ (fan art, dibujo propio) según la skill borninlore-animacion: cel shading plano de borde duro (sin degradados
// en el personaje), piel en 4 tonos, contorno casi negro #120b08 grueso ENCIMA de las sombras, líneas internas
// delgadas y teñidas (nunca negras), cero esquinas, rim light naranja del lado del sol, bigote delgado arriba del
// labio, perilla con textura, camiseta de tirantes con escote en U.
import React from "react";
import { parpadea } from "./dibujo";

const K = "#120b08";
const S0 = "#8b502b", S1 = "#7a4426", S2 = "#5d2f18", S3 = "#3e1c0b", SH = "#a86f4c", SH2 = "#985f3a", RIM = "#f4a868", PELO = "#0f0805";
const LINEA = "#4a2414"; // líneas internas teñidas

// cabeza en 3/4 (mira un poco hacia su derecha); origen en el centro de la cara
const CABEZA = "M -15 -272 C 62 -276 132 -232 143 -150 C 151 -82 147 -2 139 40 C 131 100 112 140 88 162 C 62 196 32 228 2 232 C -40 228 -92 182 -128 132 C -151 92 -163 30 -163 -40 C -165 -110 -163 -152 -151 -192 C -131 -246 -81 -270 -15 -272 Z";
const CUELLO = "M -128 110 C -128 200 -134 300 -150 380 L 130 380 C 116 300 110 200 112 118 Z";

export type GestoCJ = { mirarX?: number; mirarY?: number; cabeza?: number; boca?: "seria" | "abierta" };

export const CabezaCJ2: React.FC<{ f: number; id: string; g?: GestoCJ; semilla?: number }> = ({ f, id, g = {}, semilla = 2 }) => {
  const p = (k: string) => `${id}-${k}`, u = (k: string) => `url(#${p(k)})`;
  const cerr = parpadea(f, semilla), mx = (g.mirarX ?? 0) * 6, my = (g.mirarY ?? 0) * 3;
  const ojo = (cx: number, cy: number, w: number, k: string) => {
    const d = `M ${cx - w} ${cy + 2} Q ${cx - w * 0.2} ${cy - 13} ${cx + w} ${cy - 3} Q ${cx + w * 0.1} ${cy + 10} ${cx - w} ${cy + 2} Z`;
    return (
      <g>
        <path d={d} fill="#e8dccb" />
        <clipPath id={p("o" + k)}><path d={d} /></clipPath>
        {!cerr && <g clipPath={u("o" + k)}>
          <circle cx={cx + mx} cy={cy - 1 + my} r={10} fill="#4a2a17" /><circle cx={cx + mx} cy={cy - 1 + my} r={5} fill="#120906" />
          <circle cx={cx + mx + 3} cy={cy - 5 + my} r={2.4} fill="#fff" />
          <path d={`M ${cx - w - 4} ${cy - 16} H ${cx + w + 4} V ${cy - 5} Q ${cx} ${cy - 9} ${cx - w - 4} ${cy - 3} Z`} fill={S2} />
        </g>}
        {cerr
          ? <path d={`M ${cx - w} ${cy + 2} Q ${cx} ${cy + 8} ${cx + w} ${cy - 3}`} fill="none" stroke={K} strokeWidth={6} strokeLinecap="round" />
          : <path d={`M ${cx - w - 2} ${cy + 3} Q ${cx - w * 0.2} ${cy - 15} ${cx + w + 2} ${cy - 3} q 6 -1 10 -5`} fill="none" stroke={K} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round" />}
        <path d={`M ${cx - w + 6} ${cy + 9} Q ${cx} ${cy + 14} ${cx + w - 4} ${cy + 5}`} fill="none" stroke={LINEA} strokeWidth={2.5} strokeLinecap="round" />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <clipPath id={p("cab")}><path d={CABEZA} /></clipPath>
        <pattern id={p("perilla")} width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill={S2} /><circle cx="2" cy="2" r="1.4" fill={PELO} /><circle cx="5.5" cy="5.5" r="1.4" fill={PELO} /></pattern>
      </defs>
      {/* orejas (la izquierda en sombra) */}
      <path d="M -150 -58 C -200 -82 -214 52 -148 92 C -136 98 -128 80 -132 60 Z" fill={S1} stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -160 -30 C -188 -10 -186 40 -156 62" fill="none" stroke={S3} strokeWidth={9} strokeLinecap="round" />
      <path d="M 136 -48 C 188 -70 198 58 134 96 C 122 100 116 84 120 64 Z" fill={S0} stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M 148 -22 C 172 -2 172 46 146 66" fill="none" stroke={S2} strokeWidth={9} strokeLinecap="round" />
      <path d="M 150 -50 C 186 -50 194 40 160 82" fill="none" stroke={RIM} strokeWidth={6} strokeLinecap="round" />
      {/* cara: base + sombras duras + brillos (recortados dentro de la cabeza) */}
      <path d={CABEZA} fill={S0} />
      <g clipPath={u("cab")}>
        <path d="M -175 -300 L -96 -300 C -118 -180 -122 -60 -100 40 C -84 110 -50 170 -10 240 L -175 240 Z" fill={S1} />
        <path d="M -175 -300 L -138 -300 C -150 -160 -148 -40 -124 60 C -108 130 -80 180 -40 240 L -175 240 Z" fill={S2} />
        {/* cuencas, bajo los pómulos, bajo la nariz y bajo el labio */}
        <path d="M -128 -52 Q -84 -64 -44 -48 Q -48 -24 -60 -18 Q -96 -14 -126 -26 Z M 36 -54 Q 74 -66 112 -50 Q 110 -26 98 -20 Q 66 -16 40 -28 Z" fill={S1} />
        <path d="M -122 40 C -104 70 -92 110 -86 140 C -108 120 -126 90 -134 60 Z M 92 40 C 84 72 80 100 78 128 C 96 108 108 80 114 52 Z" fill={S1} />
        <path d="M -36 100 Q 4 112 46 100 Q 30 112 4 114 Q -22 112 -36 100 Z" fill={S2} />
        <path d="M -52 164 Q 4 176 60 162 Q 40 186 4 190 Q -34 186 -52 164 Z" fill={S1} />
        <path d="M -150 120 C -110 190 -50 236 2 236 C 50 232 90 196 112 160 L 112 260 L -150 260 Z" fill={S2} opacity={0.0} />
        {/* brillos: frente, puente de la nariz, pómulo y barbilla */}
        <path d="M -70 -172 Q -10 -196 52 -170 Q 30 -140 -10 -138 Q -54 -140 -70 -172 Z" fill={SH} />
        <path d="M -2 -46 Q 6 0 10 60 Q 2 70 -6 60 Q -10 0 -10 -44 Z" fill={SH} />
        <path d="M 62 -4 Q 96 -10 118 6 Q 104 28 76 26 Q 60 16 62 -4 Z" fill={SH2} />
        <path d="M -16 200 Q 4 194 22 200 Q 8 212 -16 200 Z" fill={SH2} />
        {/* rim light naranja del lado del sol */}
        <path d="M 120 -190 C 146 -120 148 -10 134 50 C 124 110 104 150 80 172" fill="none" stroke={RIM} strokeWidth={10} strokeLinecap="round" />
        {/* pelo: UNA gorrita redonda con línea de frente curva y patilla corta */}
        <path d="M -170 -36 C -166 -60 -160 -92 -150 -128 C -134 -168 -96 -186 -40 -190 C 20 -194 84 -186 122 -162 C 136 -170 142 -160 146 -150 C 142 -238 74 -292 -14 -290 C -104 -286 -178 -226 -176 -110 C -176 -80 -174 -56 -170 -36 Z" fill={PELO} />
        <path d="M -40 -246 Q 30 -262 92 -232" fill="none" stroke="#2c1c14" strokeWidth={7} strokeLinecap="round" />
        {/* sombra de rasurado en la quijada (puntitos fijos) */}
        <path d="M -118 120 C -86 176 -40 214 2 216 C 44 214 76 186 96 150 C 74 176 42 196 2 198 C -40 196 -84 166 -118 120 Z" fill={u("perilla")} opacity={0.45} />
      </g>
      <path d={CABEZA} fill="none" stroke={K} strokeWidth={11} strokeLinejoin="round" />
      <g transform="translate(0 12) translate(0 -66) scale(1.12 1.35) translate(0 66)">
      {/* cejas: gruesas, afiladas, bajan hacia la nariz */}
      <path d="M -132 -60 Q -96 -84 -40 -70 Q -30 -66 -26 -58 Q -44 -62 -60 -62 Q -100 -64 -128 -50 Z" fill={PELO} />
      <path d="M 26 -60 Q 34 -70 50 -74 Q 96 -84 128 -62 Q 126 -54 120 -52 Q 92 -66 52 -62 Q 38 -62 26 -60 Z" fill={PELO} />
      {[-110, -96, -82, -68, 46, 60, 74, 88, 102].map((x0, i) => <path key={i} d={`M ${x0} ${x0 < 0 ? -75 + (x0 + 110) * 0.08 : -76 + (x0 - 46) * 0.12} l ${x0 < 0 ? 6 : -6} -5`} stroke={PELO} strokeWidth={2} strokeLinecap="round" />)}
      </g>
      {ojo(-80, -28, 30, "i")}{ojo(72, -30, 29, "d")}
      <g transform="translate(0 -30) translate(6 40) scale(1.0 1.15) translate(-6 -40)">
      {/* nariz: planos de luz y sombra + 2 curvas de fosa */}
      <path d="M -10 -30 Q -16 20 -34 70 Q -20 66 -8 74 Z" fill={S1} />
      <path d="M -30 64 Q -56 66 -54 86 Q -50 102 -28 98 M 40 62 Q 66 64 64 84 Q 60 100 38 96" fill="none" stroke={K} strokeWidth={5} strokeLinecap="round" />
      <path d="M -24 96 Q 6 108 34 94" fill="none" stroke={LINEA} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M -24 90 q 6 -8 14 -2 Z M 20 88 q 8 -6 14 2 Z" fill={S3} stroke={S3} strokeWidth={3} />
      <circle cx={8} cy={78} r={10} fill={SH} />
      </g>
      <g transform="translate(6 126) scale(1.3 1.3) translate(-6 -126)">
      {/* bigote delgado (un poco arriba del labio) */}
      <path d="M -54 112 Q -20 102 4 106 Q 32 102 66 112" fill="none" stroke={PELO} strokeWidth={5} strokeLinecap="round" />
      {/* labios en 2 tonos con línea de boca oscura */}
      {g.boca === "abierta" ? <path d="M -60 124 Q 4 114 70 124 Q 50 160 4 162 Q -40 160 -60 124 Z" fill="#3a1410" stroke={K} strokeWidth={5} />
        : <g>
          <path d="M -62 127 Q -30 106 4 114 Q 40 106 72 127 Q 4 130 -62 127 Z" fill="#6e3222" />
          <path d="M -58 129 Q 4 133 68 129 Q 50 162 4 164 Q -40 162 -58 129 Z" fill="#9a644c" />
          <path d="M -64 127 Q 4 124 74 127" fill="none" stroke={K} strokeWidth={5} strokeLinecap="round" />
          <path d="M -24 142 Q 4 148 32 141" fill="none" stroke="#b47a60" strokeWidth={4} strokeLinecap="round" />
        </g>}
      </g>
      {/* perilla: parche oscuro con textura */}
      <path d="M -14 182 Q 4 176 22 182 Q 14 214 4 224 Q -6 214 -14 182 Z" fill={u("perilla")} stroke={S3} strokeWidth={2} />
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
      <g transform="translate(0 -60)">
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
        <path d="M -128 110 C -128 200 -134 300 -150 380 M 130 380 C 116 300 110 200 112 118" fill="none" stroke={K} strokeWidth={10} strokeLinecap="round" />
      </g>
      <g transform="translate(0 -60)">
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
