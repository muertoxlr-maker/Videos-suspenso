import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { ThreeCanvas } from "@remotion/three";
import { AbsoluteFill, interpolate, Easing, useCurrentFrame, useVideoConfig } from "remotion";
import { Pasillo } from "./escenarios/Pasillo";
import { Personaje2D } from "./personajes/Personaje2D";

// Cámara que avanza despacio por el pasillo (movimiento tipo "dolly").
const Camara: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const camera = useThree((s) => s.camera);
  const avance = interpolate(frame, [0, durationInFrames], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
  });
  useEffect(() => {
    camera.position.set(Math.sin(frame / 40) * 0.05, 1.5, 5.2 - avance * 1.6);
    camera.lookAt(0, 1.25, -6);
  }, [camera, frame, avance]);
  return null;
};

const PROTAGONISTA = { piel: "#eab48c", pelo: "#2a1c16", ropa: "#3b5a7a", pantalon: "#26243a" };
const SOMBRA = { piel: "#120a0c", pelo: "#0a0607", ropa: "#0a0607", pantalon: "#0a0607" };

export const Plantilla: React.FC = () => {
  const { width, height } = useVideoConfig();
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 55, near: 0.1, far: 60, position: [0, 1.5, 5.2] }}
      >
        <Camara />
        <Pasillo />
        <Personaje2D aspecto={PROTAGONISTA} expresion="miedo" posicion={[0.75, 0, 0.6]} mirar={-0.6} />
        <Personaje2D aspecto={SOMBRA} expresion="neutral" posicion={[-0.45, 0, -9]} semilla={2} />
      </ThreeCanvas>

      {/* capa 2D por encima del 3D: rótulo y subtítulo */}
      <AbsoluteFill style={{ fontFamily: "Inter, 'DejaVu Sans', sans-serif" }}>
        <div
          style={{
            position: "absolute",
            top: 90,
            left: 60,
            padding: "14px 22px",
            border: "3px solid #be2832",
            borderRadius: 14,
            background: "rgba(14,6,10,0.85)",
            color: "#f0dcd2",
            fontFamily: "'JetBrains Mono', 'DejaVu Sans Mono', monospace",
            fontWeight: 700,
            fontSize: 38,
          }}
        >
          PISO 3 · 3:33 AM
        </div>
        <div
          style={{
            position: "absolute",
            top: height * 0.74,
            width: "100%",
            textAlign: "center",
            fontSize: 84,
            fontWeight: 900,
            color: "white",
            WebkitTextStroke: "10px #0a0608",
            paintOrder: "stroke fill",
            opacity: interpolate(frame, [5, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          Al fondo hay <span style={{ color: "#ffd23a" }}>alguien.</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
