// Prueba de nivel de dibujo: CJ (busto) en la sala de noche. 4 s.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BustoCJ, SalaNoche } from "./detalle";

export const DETALLE_CUADROS = 120;
export const PruebaDetalle: React.FC = () => {
  const f = useCurrentFrame(), z = 1 + 0.04 * (f / 120);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs><radialGradient id="vin" cx="50%" cy="50%" r="75%"><stop offset="0.55" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.5} /></radialGradient></defs>
        <g transform={`translate(540 1100) scale(${z}) translate(-540 -1100)`}>
          <SalaNoche f={f} id="sd" desenfoque={2.2} />
          <BustoCJ f={f} x={540} y={1170} s={1.05} id="cjb" g={{ mirarX: -0.2, cejas: 0.5 }} />
        </g>
        <rect width={1080} height={1920} fill="url(#vin)" />
      </svg>
    </AbsoluteFill>
  );
};
