// Prueba de CJ con las reglas de la skill borninlore-animacion: atardecer cálido con fondo desenfocado
// (cables, edificios, cerros, palmeras), resplandor suave (bloom) y viñeta. 4 s.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { BustoCJ2 } from "./cj";

export const CJ2_CUADROS = 120;
const eio = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

const Palmera: React.FC<{ x: number; y: number; h: number; f: number; i: number }> = ({ x, y, h, f, i }) => {
  const g = 1.3 * Math.sin(1.7 * (f / 30) + i * 1.3);
  return (
    <g transform={`rotate(${g} ${x} ${y})`} fill="#6a3e50">
      <path d={`M ${x - 6} ${y} Q ${x + 10} ${y - h * 0.55} ${x + 4} ${y - h} L ${x + 14} ${y - h} Q ${x + 22} ${y - h * 0.55} ${x + 8} ${y} Z`} />
      {Array.from({ length: 9 }).map((_, k) => {
        const a = -Math.PI - 0.1 + k * (Math.PI + 0.2) / 8, L = 90 + (k % 3) * 18;
        const fx = x + 9, fy = y - h, ex = fx + Math.cos(a) * L, ey = fy + Math.sin(a) * L * 0.45 + 34 + Math.abs(Math.cos(a)) * 26;
        return <path key={k} d={`M ${fx} ${fy} Q ${fx + Math.cos(a) * L * 0.55} ${fy + Math.sin(a) * L * 0.55 - 22} ${ex} ${ey} L ${ex - 3} ${ey + 7} Q ${fx + Math.cos(a) * L * 0.45} ${fy + Math.sin(a) * L * 0.35} ${fx} ${fy + 7} Z`} />;
      })}
    </g>
  );
};

export const PruebaCJ2: React.FC = () => {
  const f = useCurrentFrame(), k = f / 120, z = 1.035 + 0.05 * eio(k);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <linearGradient id="cielo" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3a1c2c" /><stop offset="0.25" stopColor="#6b3548" /><stop offset="0.5" stopColor="#c47878" /><stop offset="0.68" stopColor="#f09a6e" /><stop offset="0.8" stopColor="#ffc890" /></linearGradient>
          <radialGradient id="sol" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor="#ffe2b0" stopOpacity={0.9} /><stop offset="1" stopColor="#ffc890" stopOpacity={0} /></radialGradient>
          <radialGradient id="vg" cx=".5" cy=".5" r=".78"><stop offset=".55" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.45} /></radialGradient>
          <filter id="lejos" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation={5} /></filter>
          <filter id="bloom" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={40} /></filter>
        </defs>
        <g transform={`translate(540 900) scale(${z}) translate(-540 -900)`}>
          {/* fondo lejano, desenfocado y con poco contraste */}
          <g transform={`translate(${12 * k} 0)`} filter="url(#lejos)">
            <rect x={-60} y={-60} width={1200} height={2040} fill="url(#cielo)" />
            <circle cx={300} cy={1180} r={340} fill="url(#sol)" />
            {[[60, 300], [380, 180], [700, 260]].map(([x, y], i) => <path key={i} d={`M ${x} ${y} h ${260 + i * 40}`} stroke="#a05a6a" strokeWidth={14} strokeLinecap="round" opacity={0.5} />)}
            <path d="M -60 1240 Q 200 1150 420 1210 Q 680 1140 920 1200 Q 1040 1180 1140 1210 L 1140 1400 L -60 1400 Z" fill="#a35e6a" opacity={0.75} />
            {[[620, 1090, 70, 170], [700, 1050, 60, 210], [770, 1110, 80, 150], [860, 1070, 60, 190], [930, 1120, 90, 140]].map(([x, y, w, h], i) => (
              <g key={i} opacity={0.55}><rect x={x} y={y} width={w} height={h} fill="#c78a86" />{Array.from({ length: Math.floor(h / 26) }).map((_, j) => <rect key={j} x={x + 8} y={y + 12 + j * 26} width={w - 16} height={6} fill="#e0a898" />)}</g>
            ))}
            <Palmera x={120} y={1250} h={560} f={f} i={0} />
            <Palmera x={960} y={1240} h={480} f={f} i={1} />
            <path d="M 0 1250 L 0 520 M -14 560 h 40" stroke="#5d3648" strokeWidth={14} />
            <path d="M -40 600 Q 540 700 1120 560 M -40 640 Q 540 760 1120 610 M -40 700 Q 540 800 1120 680" fill="none" stroke="#3e2230" strokeWidth={4} />
            <rect x={-60} y={1250} width={1200} height={120} fill="#5e6a38" />
            <rect x={-60} y={1370} width={1200} height={40} fill="#c9a690" />
            <rect x={-60} y={1410} width={1200} height={12} fill="#b23a28" />
            <rect x={-60} y={1422} width={1200} height={560} fill="#352626" />
          </g>
          {/* resplandor del sol (bloom) */}
          <ellipse cx={320} cy={1150} rx={420} ry={260} fill="#ffc890" opacity={0.35} filter="url(#bloom)" style={{ mixBlendMode: "screen" }} />
          <g transform={`translate(${-24 * k} ${-2 * k})`}>
            <BustoCJ2 f={f} x={560} y={820} s={1.0} id="cj2" g={{ mirarX: -0.2 }} />
          </g>
        </g>
        <rect width={1080} height={1920} fill="url(#vg)" />
      </svg>
    </AbsoluteFill>
  );
};
