// Prueba de CJ con las reglas de la skill borninlore-animacion (fondo de atardecer sencillo). 4 s.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BustoCJ2 } from "./cj";

export const CJ2_CUADROS = 120;
export const PruebaCJ2: React.FC = () => {
  const f = useCurrentFrame(), k = f / 120, z = 1.035 + 0.05 * (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a3a5e" /><stop offset="0.35" stopColor="#94566a" /><stop offset="0.65" stopColor="#d57f70" /><stop offset="1" stopColor="#f09a6e" /></linearGradient>
          <radialGradient id="vg" cx=".5" cy=".5" r=".78"><stop offset=".55" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.45} /></radialGradient>
        </defs>
        <g transform={`translate(540 900) scale(${z}) translate(-540 -900)`}>
          <rect width={1080} height={1920} fill="url(#cielo)" />
          <path d="M 0 1250 Q 540 1210 1080 1250 V 1920 H 0 Z" fill="#5e6a38" />
          <g transform={`translate(${-24 * k} ${-2 * k})`}>
            <BustoCJ2 f={f} x={560} y={820} s={1.0} id="cj2" g={{ mirarX: -0.2 }} />
          </g>
        </g>
        <rect width={1080} height={1920} fill="url(#vg)" />
      </svg>
    </AbsoluteFill>
  );
};
