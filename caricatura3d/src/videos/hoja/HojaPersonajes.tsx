// Hoja de personajes para revisar el acabado sin render 3D: arriba como estaban, abajo con las mejoras.
import React, { useEffect, useRef } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { hablaGestos, tiembla } from "../comun/movimiento";
import { Aspecto, LIENZO_H, LIENZO_W, Pose, dibujarPersonaje } from "../prueba_pasillo/personaje";
import { POSE } from "../turno3/comun";

const base: Aspecto[] = [
  { piel: "#d8b89a", pelo: "#1d1512", ropa: "#9e2b2b", ropaInterior: "#e6e0d0", pantalon: "#2a2d36", zapatos: "#2a2422", peinado: "revuelto", cuello: "redondo", insignia: { tipo: "gafete" }, semilla: 101 },
  { piel: "#c49a7a", pelo: "#8f8a84", ropa: "#4f5d3f", ropaInterior: "#d9d2c0", pantalon: "#3a3530", zapatos: "#2a2422", peinado: "recogido", bigote: true, gorra: "#2f4a7a", cuello: "v", semilla: 103 },
  { piel: "#b98a6a", pelo: "#1b1514", ropa: "#5a3a2a", ropaInterior: "#cfc8b4", pantalon: "#2c2f38", zapatos: "#2a2422", peinado: "revuelto", gorra: "#8a2a24", semilla: 105 },
  { piel: "#d6b294", pelo: "#2a1d16", ropa: "#cfc9b8", ropaInterior: "#bdb6a2", pantalon: "#3a4a6a", zapatos: "#c9a283", peinado: "revuelto", cuello: "redondo", semilla: 107 },
];
const mejor: Aspecto[] = [
  { ...base[0], prenda: "uniforme" },
  { ...base[1], prenda: "chamarra", arrugas: true, barba: "sombra" },
  { ...base[2], prenda: "camisa", barba: "candado" },
  { ...base[3], mochila: "#3d5a7a" },
];
const posesA: Pose[] = [
  { ...POSE, cejasMiedo: 0.6, boca: "linea" },
  { ...POSE, mirarX: -0.3, boca: "abierta", bocaAbre: 0.6 },
  { ...POSE, giro: 0.4, boca: "linea" },
  { ...POSE, pupila: 0.24, boca: "linea" },
];
const posesB: Pose[] = [
  { ...posesA[0], ojos: 1.18, pupila: 0.2, cejasMiedo: 1, boca: "grito", sudor: 1, borde: "#ffb062", luzX: 1 },
  { ...posesA[1], borde: "#ffb062", luzX: -1 },
  { ...posesA[2], borde: "#ffb062", luzX: 1 },
  { ...posesA[3], cejasMiedo: 0.8, cejasAlto: 0.3, boca: "triste", lagrimas: 0.8, borde: "#9cc4ff", luzX: -1 },
];

const Carta: React.FC<{ a: Aspecto; p: Pose }> = ({ a, p }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { const c = ref.current!.getContext("2d")!; dibujarPersonaje(c, a, p); }, [a, p]);
  return <canvas ref={ref} width={LIENZO_W} height={LIENZO_H} style={{ width: 250, height: 417 }} />;
};

/** video corto: a la izquierda hablando como antes (solo la boca), a la derecha con gestos y temblor */
export const HojaMovimiento: React.FC = () => {
  const f = useCurrentFrame();
  const boca = Math.abs(Math.sin(f * 0.55)) * 0.9;
  const pA: Pose = { ...posesA[1], boca: "abierta", bocaAbre: boca };
  const pB: Pose = { ...posesB[1], boca: "abierta", bocaAbre: boca, ...hablaGestos(f, 2) };
  const pC: Pose = { ...posesA[0], cejasMiedo: 1 };
  const pD: Pose = { ...posesB[0], ...tiembla(f, 1) };
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #2a2420, #0b0d12)", flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10 }}>
      {[[base[1], pA, "ANTES"], [mejor[1], pB, "DESPUÉS"], [base[0], pC, "ANTES"], [mejor[0], pD, "DESPUÉS"]].map(([a, p, t], i) => (
        <div key={i} style={{ textAlign: "center" }}>
          <div style={{ color: i % 2 ? "#ffd23a" : "#fff", fontFamily: "sans-serif", fontWeight: 900, fontSize: 34 }}>{t as string}</div>
          <Carta a={a as Aspecto} p={p as Pose} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

export const HojaPersonajes: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #2a2420, #0b0d12)", flexDirection: "column", justifyContent: "center", gap: 60 }}>
    {[[base, posesA, "ANTES"], [mejor, posesB, "DESPUÉS"]].map(([as, ps, t], k) => (
      <div key={k}>
        <div style={{ color: k ? "#ffd23a" : "#fff", fontFamily: "sans-serif", fontWeight: 900, fontSize: 44, marginLeft: 30 }}>{t as string}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>{(as as Aspecto[]).map((a, i) => <Carta key={i} a={a} p={(ps as Pose[])[i]} />)}</div>
      </div>
    ))}
  </AbsoluteFill>
);
