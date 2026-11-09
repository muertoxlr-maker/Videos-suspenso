import { useMemo } from "react";
import * as THREE from "three";
import { random, useCurrentFrame } from "remotion";

// Pasillo de hotel en 3D: suelo con alfombra, paredes, puertas numeradas y lámparas.
// Medidas en metros. El pasillo empieza en z = 6 y se aleja hacia z negativo.

const ANCHO = 3.6;
const ALTO = 3;
const LARGO = 34;
const Z_INICIO = 6;

function texturaAlfombra() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#5a1418";
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = "#7a2228";
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, 208, 208);
  ctx.fillStyle = "#3a0c10";
  ctx.beginPath();
  ctx.moveTo(128, 70);
  ctx.lineTo(186, 128);
  ctx.lineTo(128, 186);
  ctx.lineTo(70, 128);
  ctx.closePath();
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(2, LARGO / 1.8);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function texturaNumero(numero: string) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#c9a24a";
  ctx.fillRect(0, 0, 128, 64);
  ctx.fillStyle = "#2a1a10";
  ctx.font = "bold 40px monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(numero, 64, 34);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const Puerta: React.FC<{ lado: -1 | 1; z: number; numero: string }> = ({ lado, z, numero }) => {
  const placa = useMemo(() => texturaNumero(numero), [numero]);
  const x = lado * (ANCHO / 2 - 0.04);
  const giro = -lado * (Math.PI / 2);
  return (
    <group position={[x, 0, z]} rotation={[0, giro, 0]}>
      {/* marco */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[1.25, 2.3, 0.08]} />
        <meshStandardMaterial color="#2e170e" roughness={0.8} />
      </mesh>
      {/* hoja de la puerta */}
      <mesh position={[0, 1.08, 0.05]}>
        <boxGeometry args={[1.05, 2.15, 0.06]} />
        <meshStandardMaterial color="#53291a" roughness={0.7} />
      </mesh>
      {/* perilla */}
      <mesh position={[0.4, 1.0, 0.12]}>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color="#d8b04a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* número */}
      <mesh position={[0, 1.85, 0.09]}>
        <planeGeometry args={[0.3, 0.15]} />
        <meshStandardMaterial map={placa} roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
};

const Lampara: React.FC<{ z: number; parpadea?: boolean }> = ({ z, parpadea }) => {
  const frame = useCurrentFrame();
  // la lámpara que falla se apaga a ratos, siempre igual para el mismo cuadro
  const apagada = parpadea && random(`lampara-${Math.floor(frame / 2)}`) < 0.22;
  const intensidad = apagada ? 0.05 : 6;
  return (
    <group position={[0, ALTO - 0.02, z]}>
      <mesh>
        <boxGeometry args={[0.7, 0.04, 0.25]} />
        <meshStandardMaterial
          color="#ffd090"
          emissive="#ffb060"
          emissiveIntensity={apagada ? 0.05 : 2.5}
        />
      </mesh>
      <pointLight position={[0, -0.25, 0]} color="#ffb070" intensity={intensidad} distance={7} decay={1.6} />
    </group>
  );
};

export const Pasillo: React.FC = () => {
  const alfombra = useMemo(texturaAlfombra, []);
  const centroZ = Z_INICIO - LARGO / 2;
  return (
    <group>
      <color attach="background" args={["#070304"]} />
      <fog attach="fog" args={["#0d0506", 3, 24]} />
      <ambientLight intensity={0.25} color="#ff9a80" />
      <hemisphereLight args={["#ffb090", "#200808", 0.35]} />

      {/* suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, centroZ]}>
        <planeGeometry args={[ANCHO, LARGO]} />
        <meshStandardMaterial map={alfombra} roughness={0.95} />
      </mesh>
      {/* techo */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, ALTO, centroZ]}>
        <planeGeometry args={[ANCHO, LARGO]} />
        <meshStandardMaterial color="#2a1416" roughness={1} />
      </mesh>
      {/* paredes con zócalo de madera */}
      {([-1, 1] as const).map((lado) => (
        <group key={lado}>
          <mesh rotation={[0, (-lado * Math.PI) / 2, 0]} position={[(lado * ANCHO) / 2, ALTO / 2, centroZ]}>
            <planeGeometry args={[LARGO, ALTO]} />
            <meshStandardMaterial color="#6a3a2c" roughness={0.9} />
          </mesh>
          <mesh position={[lado * (ANCHO / 2 - 0.03), 0.45, centroZ]}>
            <boxGeometry args={[0.06, 0.9, LARGO]} />
            <meshStandardMaterial color="#3a1c12" roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* puertas */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i}>
          <Puerta lado={-1} z={2 - i * 5} numero={`3${String(11 + i * 2)}`} />
          <Puerta lado={1} z={-0.5 - i * 5} numero={`3${String(12 + i * 2)}`} />
        </group>
      ))}
      {/* lámparas del techo */}
      {[3, -2, -7, -12, -17].map((z, i) => (
        <Lampara key={z} z={z} parpadea={i === 1} />
      ))}
      {/* fondo del pasillo: oscuridad total */}
      <mesh position={[0, ALTO / 2, Z_INICIO - LARGO + 0.01]}>
        <planeGeometry args={[ANCHO, ALTO]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
};
