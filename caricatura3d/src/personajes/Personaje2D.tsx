import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  ALTO_LIENZO,
  ANCHO_LIENZO,
  AspectoPersonaje,
  Expresion,
  dibujarPersonaje,
} from "./dibujarPersonaje";

type Props = {
  aspecto: AspectoPersonaje;
  expresion?: Expresion;
  posicion: [number, number, number]; // x, y (suelo), z en el mundo 3D
  altura?: number; // en metros
  habla?: boolean;
  mirar?: number;
  semilla?: number;
  tinte?: string; // color de la luz del ambiente sobre el dibujo
};

// Un personaje plano, como un recorte de papel, colocado dentro del escenario 3D.
// Se redibuja en cada cuadro: respira, parpadea y mueve la boca si habla.
export const Personaje2D: React.FC<Props> = ({
  aspecto,
  expresion = "neutral",
  posicion,
  altura = 1.7,
  habla = false,
  mirar = 0,
  semilla = 0,
  tinte = "#f2d6c8",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps + semilla * 3.7;

  const { lienzo, textura } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = ANCHO_LIENZO;
    c.height = ALTO_LIENZO;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { lienzo: c, textura: tex };
  }, []);

  useEffect(() => () => textura.dispose(), [textura]);

  // Todo depende del número de cuadro, así cada render da exactamente la misma imagen.
  const ctx = lienzo.getContext("2d")!;
  dibujarPersonaje(ctx, aspecto, {
    expresion,
    ojosCerrados: t % 3.4 < 0.12,
    boca: habla ? Math.max(0, Math.sin(t * 2 * Math.PI * 5)) : 0,
    mirar,
    respiracion: Math.sin(t * 2 * Math.PI * 0.45),
  });
  textura.needsUpdate = true;

  const ancho = altura * (ANCHO_LIENZO / ALTO_LIENZO);
  const balanceo = Math.sin(t * 2 * Math.PI * 0.23) * 0.015;
  const [x, y, z] = posicion;

  return (
    <group position={[x, y, z]}>
      {/* sombra difusa en el suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0.05]}>
        <circleGeometry args={[ancho * 0.42, 32]} />
        <meshBasicMaterial color="black" transparent opacity={0.45} depthWrite={false} />
      </mesh>
      {/* el recorte del personaje */}
      <mesh position={[0, altura / 2, 0]} rotation={[0, 0, balanceo]}>
        <planeGeometry args={[ancho, altura]} />
        {/* material sin sombreado: el dibujo conserva sus colores planos de caricatura */}
        <meshBasicMaterial map={textura} color={tinte} transparent alphaTest={0.4} fog />
      </mesh>
    </group>
  );
};
