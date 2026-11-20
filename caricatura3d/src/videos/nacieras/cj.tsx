// CJ (fan art, dibujo propio) según la skill borninlore-animacion: cel shading plano de borde duro (sin degradados
// en el personaje), piel en 4 tonos, contorno casi negro #120b08 grueso ENCIMA de las sombras, líneas internas
// delgadas y teñidas (nunca negras), cero esquinas, rim light naranja del lado del sol, bigote delgado arriba del
// labio, perilla con textura, camiseta de tirantes con escote en U.
import React from "react";
import { parpadea } from "./dibujo";

const K = "#120b08";
const S0 = "#8b502b", S1 = "#7a4426", S2 = "#5d2f18", S3 = "#3e1c0b", SH = "#a86f4c", SH2 = "#985f3a", RIM = "#f4a868", PELO = "#0f0805";
const LINEA = "#4a2414"; // líneas internas teñidas

// cabeza calcada por coordenadas (cuadrícula sobre la imagen de alta resolución que mandó el usuario); origen en el centro de la cara
const CABEZA = "M 0 -265 C 66 -266 120 -236 134 -186 C 146 -130 158 -40 156 40 C 154 110 140 150 124 172 C 92 210 50 245 3 250 C -40 248 -92 210 -142 166 C -158 130 -168 70 -168 10 C -168 -70 -160 -140 -156 -186 C -140 -238 -78 -266 0 -265 Z";
const CUELLO = "M -140 150 C -136 240 -140 330 -150 420 L 104 420 C 96 330 94 240 98 170 Z";

export type GestoCJ = { mirarX?: number; mirarY?: number; cabeza?: number; boca?: "seria" | "abierta" };

export const CabezaCJ2: React.FC<{ f: number; id: string; g?: GestoCJ; semilla?: number }> = ({ f, id, g = {}, semilla = 2 }) => {
  const p = (k: string) => `${id}-${k}`, u = (k: string) => `url(#${p(k)})`;
  const cerr = parpadea(f, semilla), mx = (g.mirarX ?? 0) * 5, my = (g.mirarY ?? 0) * 2;
  const ojo = (cx: number, cy: number, w: number, k: string) => {
    const d = `M ${cx - w} ${cy + 2} Q ${cx - w * 0.1} ${cy - 13} ${cx + w} ${cy} Q ${cx} ${cy + 9} ${cx - w} ${cy + 2} Z`;
    return (
      <g>
        <path d={d} fill="#efe6d6" />
        <clipPath id={p("o" + k)}><path d={d} /></clipPath>
        {!cerr && <g clipPath={u("o" + k)}>
          <circle cx={cx + mx} cy={cy - 1 + my} r={9} fill="#4a2a17" /><circle cx={cx + mx} cy={cy - 1 + my} r={4.5} fill="#100805" />
          <circle cx={cx + mx + 3} cy={cy - 4 + my} r={2.2} fill="#fff" />
          <path d={`M ${cx - w - 4} ${cy - 14} H ${cx + w + 4} V ${cy - 6} Q ${cx} ${cy - 9} ${cx - w - 4} ${cy - 4} Z`} fill={S2} />
        </g>}
        {cerr
          ? <path d={`M ${cx - w} ${cy + 2} Q ${cx} ${cy + 7} ${cx + w} ${cy}`} fill="none" stroke={K} strokeWidth={6} strokeLinecap="round" />
          : <path d={`M ${cx - w - 2} ${cy + 3} Q ${cx - w * 0.1} ${cy - 15} ${cx + w + 2} ${cy}`} fill="none" stroke="#1a0c06" strokeWidth={5.5} strokeLinecap="round" />}
        <path d={`M ${cx - w * 0.8} ${cy - 16} Q ${cx} ${cy - 24} ${cx + w * 0.8} ${cy - 15}`} fill="none" stroke={S2} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        <path d={`M ${cx - w * 0.75} ${cy + 9} Q ${cx} ${cy + 13} ${cx + w * 0.75} ${cy + 6}`} fill="none" stroke={LINEA} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      </g>
    );
  };
  return (
    <g>
      <defs>
        <clipPath id={p("cab")}><path d={CABEZA} /></clipPath>
        <filter id={p("suave")} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={9} /></filter>
        <filter id={p("leve")} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={1.6} /></filter>
        <radialGradient id={p("piel")} cx="0.55" cy="0.42" r="0.65"><stop offset="0" stopColor="#9c5e38" /><stop offset="0.6" stopColor={S0} /><stop offset="1" stopColor="#6e3c22" /></radialGradient>
      </defs>
      {/* orejas */}
      <path d="M -156 -42 C -222 -50 -222 112 -150 110 Z" fill={S1} stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M -168 -6 C -194 6 -192 74 -164 86" fill="none" stroke={S2} strokeWidth={10} strokeLinecap="round" />
      <path d="M 146 -50 C 196 -58 198 108 142 106 Z" fill={S0} stroke={K} strokeWidth={9} strokeLinejoin="round" />
      <path d="M 156 -14 C 178 -4 176 70 154 84" fill="none" stroke={S2} strokeWidth={9} strokeLinecap="round" />
      <path d="M 176 -34 C 190 -6 190 66 176 90" fill="none" stroke={RIM} strokeWidth={5} strokeLinecap="round" />
      {/* cara */}
      <path d={CABEZA} fill={u("piel")} />
      <g clipPath={u("cab")}>
        <g filter={u("suave")}>
          <path d="M -190 -300 L -136 -300 C -144 -120 -144 20 -128 120 C -112 190 -76 230 -30 280 L -190 280 Z" fill={S1} />
          <path d="M -126 0 Q -96 14 -78 56 Q -74 96 -98 124 Q -128 116 -138 66 Q -140 26 -126 0 Z M 78 6 Q 112 0 144 12 Q 148 76 132 128 Q 104 114 92 84 Q 80 50 78 6 Z" fill={S1} opacity={0.7} />
          <path d="M -52 176 Q 10 186 78 174 Q 56 204 12 210 Q -32 204 -52 176 Z" fill={S1} />
          <path d="M -150 150 C -110 220 -50 262 4 262 C 50 260 96 226 124 186 L 130 300 L -150 300 Z" fill={S1} opacity={0.5} />
          {/* cuencas bajo las cejas, lados de la nariz, bajo el labio y bajo la barbilla */}
          <path d="M -112 -44 Q -68 -58 -14 -44 Q -18 -12 -40 -6 Q -80 -4 -110 -18 Z M 34 -44 Q 90 -60 142 -48 Q 138 -18 120 -8 Q 80 -4 40 -16 Z" fill={S2} opacity={0.75} />
          <path d="M -6 -20 Q -16 30 -30 74 L -6 78 Z M 26 -20 Q 40 30 54 74 L 30 78 Z" fill={S2} opacity={0.6} />
          <path d="M -40 180 Q 14 192 70 178 Q 50 200 14 204 Q -20 200 -40 180 Z" fill={S2} opacity={0.6} />
          <path d="M -36 96 Q -56 120 -62 140 L -50 142 Q -44 118 -28 100 Z M 64 96 Q 82 120 88 140 L 76 142 Q 70 118 54 100 Z" fill={S2} opacity={0.7} />
        </g>
        {/* luces suaves: centro de la frente, tabique, pómulos y labio inferior */}
        <g filter={u("suave")}>
          <ellipse cx={-30} cy={-140} rx={60} ry={30} fill="#c78a5e" opacity={0.6} />
          <path d="M 10 -36 Q 16 20 20 70 Q 14 78 8 70 Q 4 20 4 -36 Z" fill="#e3a476" opacity={0.85} />
          <ellipse cx={-92} cy={30} rx={22} ry={16} fill="#c78a5e" opacity={0.18} />
          <ellipse cx={110} cy={24} rx={20} ry={16} fill="#e3a476" opacity={0.25} />
          <ellipse cx={14} cy={78} rx={18} ry={11} fill="#d8996c" opacity={0.6} />
        </g>
        {/* brillos: frente y puente de la nariz */}
        {/* rim light a la derecha */}
        <path d="M 128 -200 C 144 -140 146 -40 144 40 C 142 100 132 150 116 180" fill="none" stroke={RIM} strokeWidth={6} strokeLinecap="round" />
        {/* pelo */}
        <path d="M -168 -80 C -175 -150 -165 -230 -90 -258 C -40 -274 40 -274 100 -252 C 130 -238 148 -212 150 -170 L 128 -168 L -104 -168 Q -128 -130 -140 -76 Q -156 -72 -170 -74 Z" fill={PELO} />
        <path d="M -104 -168 L 128 -168" fill="none" stroke="#3a2416" strokeWidth={3} strokeDasharray="2 5" />
      </g>
      <path d={CABEZA} fill="none" stroke={K} strokeWidth={16} strokeLinejoin="round" opacity={0.35} filter={u("leve")} />
      <path d={CABEZA} fill="none" stroke={K} strokeWidth={11} strokeLinejoin="round" />
      <g transform="translate(16 0)">
      {/* cejas: más bajas, gruesas, bordes difuminados */}
      <g transform="translate(0 7) translate(0 -55) scale(1 1.3) translate(0 55)" filter={u("leve")}>
      <path d="M -118 -46 Q -90 -70 -40 -70 Q -14 -70 0 -60 L -2 -46 Q -20 -54 -44 -55 Q -86 -54 -116 -38 Z" fill={PELO} />
      <path d="M 30 -46 Q 34 -60 64 -68 Q 110 -76 146 -64 L 144 -52 Q 110 -60 70 -54 Q 46 -52 30 -46 Z" fill={PELO} />
      </g>
      {ojo(-70, -20, 36, "i")}<g transform="translate(86 -20) scale(0.86 1) translate(-86 20)">{ojo(86, -20, 33, "d")}</g>
      {/* nariz: sombra lateral, alas en C y fosas chiquitas */}
            <path d="M -16 62 Q -36 64 -34 78 Q -32 90 -16 92" fill="none" stroke="#3a1c10" strokeWidth={4} strokeLinecap="round" opacity={0.55} filter={u("leve")} />
      <path d="M 46 62 Q 64 64 62 78 Q 60 90 46 92" fill="none" stroke="#3a1c10" strokeWidth={4} strokeLinecap="round" opacity={0.55} filter={u("leve")} />
      <path d="M -14 92 Q 15 98 44 92" fill="none" stroke="#3a1c10" strokeWidth={3} strokeLinecap="round" opacity={0.4} filter={u("leve")} />
      <ellipse cx={-3} cy={86} rx={7} ry={4} fill="#2a140a" opacity={0.6} filter={u("leve")} /><ellipse cx={35} cy={86} rx={7} ry={4} fill="#2a140a" opacity={0.6} filter={u("leve")} />
      {/* rayitas de la nariz a las comisuras */}
      {/* bigote fino justo encima del labio superior */}
      <path d="M -54 116 Q 14 108 83 116" fill="none" stroke="#1e100a" strokeWidth={4} strokeLinecap="round" opacity={0.7} filter={u("leve")} />
      {/* labios */}
      {g.boca === "abierta" ? <path d="M -62 140 Q 14 124 92 140 Q 64 182 14 184 Q -36 182 -62 140 Z" fill="#3a1410" stroke={K} strokeWidth={5} />
        : <g>
          <path d="M -60 142 Q -40 120 14 122 Q 66 120 90 142 Q 14 138 -60 142 Z" fill="#6a3a2a" />
          <path d="M -51 146 Q 14 146 80 146 Q 60 174 14 175 Q -32 174 -51 146 Z" fill="#a8786a" />
          <path d="M -18 156 Q 14 160 46 155" fill="none" stroke="#d6aa9a" strokeWidth={5} strokeLinecap="round" />
          <path d="M -62 144 Q 14 139 92 144" fill="none" stroke="#2a140c" strokeWidth={4.5} strokeLinecap="round" opacity={0.85} filter={u("leve")} />
        </g>}
      {/* perilla chica */}
      <path d="M -14 184 Q 12 178 38 184 Q 34 214 12 228 Q -10 214 -14 184 Z" fill="#1e100a" opacity={0.6} filter={u("suave")} />
      </g>
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
      <g transform="translate(0 0) scale(1.08 1)">
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
      <g transform="translate(0 0) scale(1.3 1.0)">
        <path d={CUELLO} fill={S0} />
        <g clipPath={u("cue")}>
          <path d="M -140 100 L 120 100 L 120 210 Q 0 250 -140 200 Z" fill={S2} />
          <path d="M -140 100 L -70 100 Q -84 260 -96 400 L -140 400 Z" fill={S1} />
          <path d="M 84 230 Q 92 280 94 330" fill="none" stroke={RIM} strokeWidth={8} strokeLinecap="round" />
          <path d="M -60 230 Q -40 300 -20 360 M 40 230 Q 26 300 6 360" fill="none" stroke={LINEA} strokeWidth={3} strokeLinecap="round" />
          <path d="M -18 286 Q -8 300 2 286" fill="none" stroke={LINEA} strokeWidth={3} strokeLinecap="round" />
        </g>
        <path d="M -140 150 C -136 240 -140 330 -150 420 M 104 420 C 96 330 94 240 98 170" fill="none" stroke={K} strokeWidth={10} strokeLinecap="round" />
      </g>
      <g transform="translate(0 10) scale(1.05 1)">
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
        <g transform="translate(0 -30) scale(1.2)"><CabezaCJ2 f={f} id={id} g={g} semilla={semilla} /></g>
      </g>
    </g>
  );
};
