// «El autobús escolar» — animación completa. Zombies. Gancho con acción desde el cuadro 0, en orden y sin adelantos
// (guía §1; modelo aprobado: «La ambulancia»): ya vas corriendo hacia el camión cuando empieza. Mismo composer,
// tarjetas, capas de texto y acabado aprobado (§8.9: personajes ref7, lugares gastados, LUT frío, SIN puntitos).
// En la calle el camión no avanza: corre la avenida (`avance`). Cada plano empieza 2 cuadros antes de su palabra.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction, BloomEffect, BrightnessContrastEffect, EffectComposer, EffectPass, HueSaturationEffect, LUT3DEffect, LookupTexture, RenderPass,
  ToneMappingEffect, ToneMappingMode, VignetteEffect,
} from "postprocessing";
import { InkPass, NOINK } from "../alejandro/ink";
import { LensBlur } from "../alejandro/lensblur";
import { Aspecto, LIENZO_H, Pose } from "../prueba_pasillo/personaje";
import { POSE, Tarjeta, lerp, parpadea, ruido, suave } from "../turno3/comun";
import { empuje, tiembla } from "../comun/movimiento";
import { ASIENTO_X, ASIENTO_Y, CHOFER, FILAS } from "../camion/camion";
import { AV0, BUS_Y, ESC, ESCRITORIO, PUERTA_S, PUPITRES, SALON, crearEscenario } from "./autobus";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const AUTOBUS_CUADROS = Math.ceil(81.99 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes (todos ref7)
const PIELES = ["#d8b496", "#c49a7a", "#a87a5a", "#8e6346", "#d2ae8e", "#b88a66"], PELOS = ["#1d1512", "#3a2a1e", "#141012", "#5a3a22"];
const PEINADOS: Aspecto["peinado"][] = ["revuelto", "trenza", "mono", "largo", "rizado", "recogido"];
const NINO = (i: number): Aspecto => ({
  piel: PIELES[i % 6], pelo: PELOS[(i * 3) % 4], ropa: i % 3 === 0 ? "#7a2a3a" : "#f0ece2", ropaInterior: "#f0ece2", pantalon: "#2a3a6a", zapatos: "#1a1614",
  peinado: PEINADOS[(i * 5) % 6], prenda: i % 3 === 0 ? undefined : "uniforme", cuello: i % 3 === 0 ? "redondo" : undefined, lentes: i === 4 || i === 9, coletas: i === 1 || i === 7 ? "#e04a8a" : undefined, estilo: "ref7", semilla: 1220 + i,
});
const TU: Aspecto = { piel: "#d6ae8c", pelo: "#2a1c16", ropa: "#f0ece2", ropaInterior: "#f0ece2", pantalon: "#2a3a6a", zapatos: "#1a1614", peinado: "revuelto", prenda: "uniforme", mochila: "#2f6fb0", estilo: "ref7", semilla: 1201 };
const RAMIRO: Aspecto = { piel: "#b88a66", pelo: "#d8d4cc", ropa: "#4a5a6a", ropaInterior: "#e6e0d0", pantalon: "#3a342e", zapatos: "#141012", peinado: "recogido", prenda: "camisa", gorra: "#2a3a5a", bigote: true, arrugas: true, estilo: "ref7", semilla: 1203 };
const LUPITA: Aspecto = { piel: "#c99a78", pelo: "#2a1a14", ropa: "#7a3a4a", ropaInterior: "#f0e6d0", pantalon: "#2e3446", zapatos: "#2a2224", peinado: "recogido", prenda: "chamarra", lentes: true, estilo: "ref7", semilla: 1205 };
const MATEO: Aspecto = { ...NINO(11), peinado: "rizado", ropa: "#f0ece2", prenda: "uniforme", mochila: "#3a9a5a", semilla: 1231 };
const zombi = (ropa: string, pantalon: string, pelo: string, peinado: Aspecto["peinado"], piel: string, n: number, extra: Partial<Aspecto> = {}): Aspecto => ({ piel, pelo, ropa, ropaInterior: "#3a3a36", pantalon, zapatos: "#2a2622", peinado, estilo: "ref7", semilla: 1240 + n, zombi: n + 20, ...extra });
const CARTAS = {
  tu: [TU, 1.25], ramiro: [RAMIRO, 1.68], lupita: [LUPITA, 1.62], mateo: [MATEO, 1.22],
  n1: [NINO(1), 1.2], n2: [NINO(2), 1.26], n3: [NINO(3), 1.18], n4: [NINO(4), 1.24], n5: [NINO(5), 1.2], n6: [NINO(6), 1.28], n7: [NINO(7), 1.16], n8: [NINO(8), 1.22], n9: [NINO(9), 1.25], n10: [NINO(10), 1.2],
  z1: [zombi("#4a6450", "#3a3e48", "#2a2420", "revuelto", "#9a9fa8", 1, { prenda: "camisa" }), 1.7],
  z2: [zombi("#7a3e3a", "#2e3238", "#2a2226", "largo", "#a39aa8", 2), 1.6],
  z3: [zombi("#3a4a6a", "#4a4238", "#1e1c1c", "recogido", "#8e9a9c", 3, { prenda: "uniforme", gorra: "#2a3a5a" }), 1.74],
  z4: [zombi("#6a6478", "#34383e", "#4a4440", "mono", "#a8a6a0", 4, { rebozo: "#5a6a4a" }), 1.62],
  z5: [zombi("#8a7440", "#2a2e38", "#2a2420", "rizado", "#9098a8", 5, { mandil: "#b8b0a0" }), 1.68],
  z6: [zombi("#5a5a5e", "#2a2e38", "#3a3430", "revuelto", "#a0a4a0", 6, { prenda: "chamarra", barba: "sombra" }), 1.72],
  z7: [zombi("#6a3a5a", "#2a2e38", "#1e1c1c", "trenza", "#9aa0aa", 7), 1.6],
  z8: [zombi("#3a5a5a", "#34383e", "#4a3a30", "rizado", "#a4a09a", 8, { gorra: "#8a6a2a" }), 1.7],
  z9: [zombi("#7a6a5a", "#2a2e38", "#2a2420", "mono", "#9a9ca8", 9, { prenda: "uniforme" }), 1.66],
} as const;
type Quien = keyof typeof CARTAS;
const ALTO = (q: Quien) => CARTAS[q][1];
const ZS: Quien[] = ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8", "z9"];
const NS: Quien[] = ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10"];
/** quién se sienta en cada pupitre (índice 0 … 11): el 11 (Mateo) y el 12 (tú) atrás */
const EN_PUPITRE: Quien[] = ["n1", "n2", "n3", "n4", "n5", "n6", "n7", "n8", "n9", "n10", "mateo", "tu"];
const LUNA: Partial<Pose> = { luzX: -1, borde: "#a8c0ff" };
const SALON_L: Partial<Pose> = { luzX: -1, borde: "#e8eeff" }; // tubos del salón
const LAMPARA: Partial<Pose> = { luzX: -1, borde: "#ffd7a0" }; // lámpara del escritorio

type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Lugar = "calle" | "escuela" | "salon";
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; lugar: Lugar; enBus?: boolean; rapido?: boolean; sacude?: (f: number) => number; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const golpeCam = (f: number, desde: number, fuerza: number, dura = 14) => (f >= desde && f < desde + dura ? fuerza * (1 - (f - desde) / dura) : 0);
const MIEDO = (f: number, k = 0.4): Partial<Pose> => ({ ojos: 1.1, pupila: 0.2, ojeras: 0.4, cejasMiedo: 0.8, ...tiembla(f, k) });
const ZOMBI = (f: number, n: number): Partial<Pose> => ({ ojosVacios: true, ojeras: 1, parpadeo: false, boca: "abierta", bocaAbre: 0.6 + 0.4 * Math.sin(f * 0.35 + n), cejasAlto: -0.3, cabezaX: 0.06 * Math.sin(f * 0.3 + n * 2) });
const CORRE = (f: number, n: number, v = 0.85): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v + n)), Math.max(0, -Math.sin(f * v + n))], brazoIzq: [1.0 + 0.5 * Math.sin(f * v + n), 0.6], brazoDer: [1.0 - 0.5 * Math.sin(f * v + n), 0.6] });
const brinco = (f: number, n: number, v = 0.85) => 0.06 * Math.abs(Math.sin(f * v + n));

// ------------------------------------------------------------------ la calle: el camión y la avenida
const BX = 2.6; // el camión, en el carril derecho (su puerta da a la banqueta, +x)
const ACELERA = () => fw(28), BANQ = () => fw(56), TUMBA = () => fw(61) + 4, VOLANTAZO = () => fw(42);
const VEL = (f: number) => { const v0 = 14 / FPS; if (f < ACELERA()) return 0; return lerp(0, v0, Math.min(1, (f - ACELERA()) / 40) ** 1.5); };
const AVANCE: number[] = [];
const avance = (f: number) => { const n = Math.max(0, Math.floor(f)); while (AVANCE.length <= n) AVANCE.push((AVANCE[AVANCE.length - 1] ?? AV0) + VEL(AVANCE.length)); return AVANCE[n]; };
const recorrido = (f: number) => avance(f) - AV0;
/** el camión: x, altura, giro (volantazo) y ladeo (al subir a la banqueta) */
const busEn = (f: number) => {
  const v = f >= VOLANTAZO() && f < VOLANTAZO() + 70 ? Math.sin((f - VOLANTAZO()) / 70 * Math.PI * 2) * Math.exp(-(f - VOLANTAZO()) / 50) : 0;
  const sube = suave(BANQ(), BANQ() + 14, f);
  const x = BX + 4.1 * suave(BANQ() - 16, BANQ() + 10, f);
  const ladeo = f >= BANQ() - 4 && f < BANQ() + 26 ? -0.06 * Math.sin((f - BANQ() + 4) / 30 * Math.PI) : 0;
  return { x: x + 0.5 * v, y: 0.16 * sube, giro: -0.22 * v, ladeo: ladeo + 0.015 * v + (f > ACELERA() ? 0.004 * Math.sin(f * 0.37) : 0) };
};
const BUS_M = new THREE.Matrix4();
/** de coordenadas del camión (piso = 0) a coordenadas del mundo */
const B = (p: V3): V3 => { const v = new THREE.Vector3(p[0], p[1] + BUS_Y, p[2]).applyMatrix4(BUS_M); return [v.x, v.y, v.z]; };
const sentadoEn = (lado: number, fila: number, alto: number): V3 => [lado * ASIENTO_X, ASIENTO_Y + 0.012 - 0.197 * alto, FILAS[fila] + 0.18];
const RAMIRO_P: V3 = [CHOFER.x, 0.47 + 0.012 - 0.197 * 1.68, CHOFER.z + 0.15];
const CERCA_CHOFER = (dz = 0, fov = 46): Cam => c([-0.5, 1.33, 5.95 - dz], [-0.7, 1.15, 4.0], fov); // por fuera del parabrisas (coords del camión)
// el niño que corre por la banqueta hacia la puerta (mundo); llega a la puerta en fw(15)
const KX = 6.3, PUERTA_Z = 3.9;
const ninoZ = (f: number) => lerp(-8.5, PUERTA_Z, Math.min(1, f / fw(16)));
// los zombies del parque: salen por la entrada (mundo z ≈ −6.5) y corren hacia el camión
const ENTRADA: V3 = [8.6, 0.16, -6.5];
const zombiCalle = (f: number, i: number): V3 => {
  const sale = fw(13) + i * 8, t = Math.max(0, f - sale) / FPS;
  const dx = [0, 1, -0.5, 1.6, 0.6, -0.2][i], dz = [0, -0.6, 0.7, 0.2, -1.1, 1.2][i];
  if (f < sale) return [ENTRADA[0] + 2.5 + dx, ENTRADA[1], ENTRADA[2] + dz * 0.5]; // adentro del parque, detrás de la reja
  const x = Math.max(4.6 + i * 0.25, ENTRADA[0] + 2.5 + dx - t * 3.0), sal = Math.max(0, t - (2.5 + dx) / 3.0); // por la entrada y luego hacia la puerta
  const z = Math.min(PUERTA_Z - 1.2 - i * 0.7, ENTRADA[2] + dz * 0.5 + sal * 2.8);
  return [x, x < 5.5 ? 0 : 0.16, z - recorrido(f)];
};

// ------------------------------------------------------------------ el salón
const PUP = (i: number): V3 => [PUPITRES[i][0], 0, PUPITRES[i][1]];
const CARA_PUP = (i: number, q: Quien): V3 => [PUPITRES[i][0], ALTO(q) * 0.62, PUPITRES[i][1]];
const LUPITA_P: V3 = [-0.9, 0, -3.0];
const LUPITA_CARA: V3 = [LUPITA_P[0], 1.62 * 0.83, LUPITA_P[2]];
const PIZ = (dx: number, y: number, dist: number, fov: number): Cam => c([0.3 + dx, y + 0.05, -SALON.z + dist], [0.3 + dx, y, -SALON.z], fov);
const CARA = (q: V3, dist: number, fov: number, dx = -0.75): Cam => c([q[0] + dx, q[1] + 0.32, q[2] - dist - 0.35], [q[0], q[1] - 0.05, q[2]], fov + 4); // desde el frente (−z), por el pasillo
const LUP = (dist: number, fov: number): Cam => c([LUPITA_P[0] + 0.2, 1.5, LUPITA_P[2] + dist], [LUPITA_CARA[0], LUPITA_CARA[1] - 0.22, LUPITA_CARA[2]], fov);
/** el salón entero en diagonal, desde la esquina del frente (todos los niños se ven) */
const DIAG = (dx = 0, fov = 52): Cam => c([3.3 + dx, 2.45, -4.15], [-1.3 + dx, 0.65, 1.2], fov);
const PERILLA: V3 = [SALON.x - 0.04, 1.0, PUERTA_S.z - PUERTA_S.ancho / 2 + 0.83];

const PLANOS: Plano[] = [
  // 0 · Imagina que eres el último niño en subir al autobús escolar  (corres por la banqueta hacia la puerta abierta)
  { w: 0, lugar: "calle", foco: 6, cInf: 7, sacude: () => 0.01, ini: c([5.2, 1.25, -2.6], [6.7, 0.95, -9.5], 50), fin: c([5.3, 1.25, 3.0], [6.6, 0.95, -3.5], 50), hacer: ({ f, m }) => { m.corre(f); m.calleZombis(f, 2); m.busNinos(f); } },
  // 1 · Detrás de ti,  (tu cara de cerca, corriendo; atrás, la entrada del parque)
  { w: 11, lugar: "calle", foco: 1.6, cInf: 8, sacude: () => 0.012, ini: c([5.6, 1.1, 1.6], [6.4, 0.8, -1.0], 50), fin: c([5.55, 1.1, 4.0], [6.1, 0.8, 1.5], 50), hacer: ({ f, m }) => { m.corre(f, true); m.calleZombis(f, 6); } },
  // 2 · los zombies salen corriendo del parque.  (desde la avenida: salen por la entrada; al fondo, el camión)
  { w: 14, lugar: "calle", foco: 8, cInf: 6, ini: c([4.9, 1.45, -1.0], [9.5, 1.0, -7.0], 50), fin: c([4.85, 1.45, -0.4], [8.8, 1.0, -5.5], 50), hacer: ({ f, m }) => { m.corre(f); m.calleZombis(f, 6); } },
  // 3 · El chofer, don Ramiro,
  { w: 20, lugar: "calle", enBus: true, foco: 0.8, cInf: 9, sacude: () => 0.004, ini: CERCA_CHOFER(0, 44), fin: CERCA_CHOFER(0.15, 42), hacer: ({ f, m }) => { m.ramiro(f, { mirarX: 0.8, ...MIEDO(f, 0.4), boca: "dientes", sudor: 0.7, brazoDer: [0.9, 0.6] }); } },
  // 4 · cierra la puerta y acelera.  (adentro: subes los escalones; las hojas se cierran en la cara del zombie)
  { w: 24, lugar: "calle", enBus: true, foco: 1.8, cInf: 7, sacude: (f) => golpeCam(f, ACELERA(), 0.03, 16), ini: c([-0.35, 1.5, 2.55], [1.3, 0.55, 4.0], 54), fin: c([-0.3, 1.48, 2.7], [1.3, 0.6, 4.0], 52), hacer: ({ f, k, m }) => { m.subeTu(f, k); m.ramiro(f, { mirarX: 0.8, ...MIEDO(f, 0.3), boca: "dientes" }); m.ninosBus(f, true); } },
  // 5 · Uno se avienta contra el vidrio.  (adentro: la cara contra la ventana; los niños se hacen para atrás)
  { w: 29, lugar: "calle", enBus: true, foco: 1.6, cInf: 7, sacude: (f) => 0.008 + golpeCam(f, fw(31) + 6, 0.05, 12), ini: c([-0.55, 1.42, 2.4], [1.25, 1.2, 0.75], 52), fin: c([-0.5, 1.42, 2.2], [1.25, 1.22, 0.75], 50), hacer: ({ f, m }) => { m.ventana(f); m.ninosBus(f, true); } },
  // 6 · Otro se cuelga del espejo.  (por fuera, de frente: colgado del brazo del espejo; Ramiro al volante)
  { w: 35, lugar: "calle", enBus: true, foco: 3.2, cInf: 7, sacude: () => 0.01, ini: c([3.9, 1.2, 9.4], [1.2, 1.2, 4.8], 46), fin: c([3.7, 1.2, 8.8], [1.2, 1.2, 4.8], 44), hacer: ({ f, m }) => { m.colgado(f); m.ramiro(f, { mirarX: 0.8, ...MIEDO(f, 0.6), boca: "grito" }); } },
  // 7 · Don Ramiro da un volantazo...  (por el parabrisas: gira el volante con todo; el camión se avienta de lado)
  { w: 40, lugar: "calle", enBus: true, foco: 1.0, cInf: 8, sacude: (f) => 0.012 + golpeCam(f, VOLANTAZO(), 0.06, 20), ini: CERCA_CHOFER(0, 48), fin: CERCA_CHOFER(0.1, 46), hacer: ({ f, m }) => { const g = Math.sin(f * 0.5); m.ramiro(f, { ...MIEDO(f, 0.5), boca: "grito", brazoIzq: [0.3 + 0.6 * g, 1.35], brazoDer: [0.3 - 0.6 * g, 1.35], cuerpoX: 0.15 * g }); m.colgado(f); } },
  // 8 · y el zombie sale volando.  (de lado: sale disparado hacia la banqueta, dando vueltas)
  { w: 45, lugar: "calle", foco: 5, cInf: 7, rapido: true, ini: c([8.4, 2.2, 10.5], [4.2, 1.5, 3.5], 52), fin: c([8.3, 2.0, 9.5], [5.6, 0.6, -2.0], 52), hacer: ({ f, m }) => { m.vuela(f); m.busNinos(f); } },
  // 9 · Las calles están llenas.  (desde arriba y atrás: zombies por toda la avenida)
  { w: 50, lugar: "calle", foco: 14, cInf: 5, ini: c([0.6, 4.2, -8.5], [2.2, 0.8, 12], 50), fin: c([0.7, 3.9, -7.5], [2.2, 0.8, 13], 50), hacer: ({ f, m }) => { m.llenas(f); } },
  // 10 · El autobús se sube a la banqueta,  (por fuera, adelante: se avienta a la derecha y brinca la guarnición)
  { w: 54, lugar: "calle", foco: 7, cInf: 7, sacude: (f) => golpeCam(f, BANQ() + 6, 0.05, 14), ini: c([3.5, 1.0, 16], [5.0, 1.4, 4], 50), fin: c([4.4, 1.0, 15.5], [6.4, 1.4, 4], 48), hacer: ({ f, m }) => { m.llenas(f, true); m.busNinos(f); } },
  // 11 · tumba un puesto de periódicos...  (el puesto vuela en pedazos; las hojas por todos lados)
  { w: 61, lugar: "calle", foco: 6, cInf: 7, sacude: (f) => golpeCam(f, TUMBA(), 0.08, 16), ini: c([8.25, 1.4, 16.5], [6.6, 1.2, 6.5], 50), fin: c([8.3, 1.6, 17.5], [6.6, 1.5, 8], 52), hacer: ({ f, m }) => { m.puesto(f); m.busNinos(f); } },
  // 12 · y entra a la escuela.  (desde el patio: entra por el portón y frena)
  { w: 66, lugar: "escuela", foco: 10, cInf: 6, ini: c([24, 2.2, 6.8], [9, 1.8, 0], 46), fin: c([23.5, 2.1, 6.5], [10, 1.7, 0], 46), hacer: ({ f, k, m }) => { m.entra(f, k); } },
  // 13 · La maestra Lupita cierra el portón con cadena.
  { w: 71, lugar: "escuela", foco: 3.6, cInf: 7, ini: c([12.8, 1.55, -3.4], [9.0, 1.3, 0.4], 50), fin: c([12.4, 1.5, -3.0], [9.0, 1.25, 0.2], 48), hacer: ({ f, k, m }) => { m.cierra(f, k); } },
  // 14 · Los zombies se pegan a la reja.
  { w: 79, lugar: "escuela", foco: 2.6, cInf: 7, sacude: () => 0.006, ini: c([11.2, 1.55, -2.2], [8.4, 1.6, 0.2], 50), fin: c([11.0, 1.55, -2.0], [8.4, 1.65, 0.2], 48), hacer: ({ f, m }) => { m.portonCerrado(); m.reja(f); } },
  // 15 · Los llevan al salón.  (cruzan el patio detrás de la maestra, hacia la puerta del edificio)
  { w: 86, lugar: "escuela", foco: 7, cInf: 7, ini: c([15.5, 1.9, -6.5], [24, 1.1, 0.5], 46), fin: c([16.2, 1.9, -6.2], [25, 1.1, 0.5], 46), hacer: ({ f, k, m }) => { m.portonCerrado(); m.fila(f, k); } },
  // 16 · En el pizarrón, tres reglas.  (el salón desde atrás: los niños sentados, de espaldas)
  { w: 90, lugar: "salon", foco: 6, cInf: 6, ini: c([0.3, 2.05, 4.1], [0.3, 1.45, -4.5], 50), fin: c([0.3, 1.95, 3.5], [0.3, 1.5, -4.5], 48), hacer: ({ f, m }) => { m.clase(f, {}, true); } },
  // 17 · Regla número uno:
  { w: 95, lugar: "salon", foco: 2.4, cInf: 6, ini: PIZ(-1.28, 1.55, 2.9, 46), fin: PIZ(-1.28, 1.55, 2.65, 46), hacer: () => {} },
  // 18 · las cortinas siempre cerradas.  (detrás de las cortinas, sombras de manos)
  { w: 98, lugar: "salon", foco: 3.0, cInf: 6, ini: c([-1.2, 1.75, 1.6], [-4, 1.65, -0.6], 52), fin: c([-1.4, 1.75, 1.4], [-4, 1.65, -0.6], 50), hacer: ({ f, k, m }) => { m.sombras(suave(0.15, 0.7, k), f); m.clase(f, { mirarX: -0.7 }, true, [1, 5]); } },
  // 19 · Regla número dos:
  { w: 102, lugar: "salon", foco: 2.4, cInf: 6, ini: PIZ(0, 1.5, 2.9, 46), fin: PIZ(0, 1.5, 2.65, 46), hacer: () => {} },
  // 20 · si alguien toca la puerta, nadie contesta.  (la puerta tiembla con los golpes)
  { w: 105, lugar: "salon", foco: 2.6, cInf: 7, ini: c([1.5, 1.55, 1.2], [4, 1.2, 3.0], 50), fin: c([1.7, 1.55, 1.3], [4, 1.2, 3.0], 48), hacer: ({ f, m }) => { m.toca(f, [fw(107), fw(107) + 7, fw(107) + 14]); m.clase(f, { mirarX: 0.8, ...MIEDO(f, 0.3) }, true, [3, 7, 11]); } },
  // 21 · Regla número tres:
  { w: 112, lugar: "salon", foco: 2.4, cInf: 6, ini: PIZ(1.28, 1.45, 2.9, 46), fin: PIZ(1.28, 1.45, 2.65, 46), hacer: () => {} },
  // 22 · cada hora se pasa lista.  (la lista en el escritorio, junto a la lámpara)
  { w: 115, lugar: "salon", foco: 0.9, cInf: 8, ini: c([ESCRITORIO.x - 0.4, 1.55, ESCRITORIO.z + 0.85], [ESCRITORIO.x - 0.1, 0.8, ESCRITORIO.z + 0.1], 44), fin: c([ESCRITORIO.x - 0.35, 1.45, ESCRITORIO.z + 0.75], [ESCRITORIO.x - 0.1, 0.8, ESCRITORIO.z + 0.1], 42), hacer: () => {} },
  // 23 · Si alguien falta, no se le busca.  (la maestra, seria)
  { w: 120, lugar: "salon", foco: 1.5, cInf: 8, ini: LUP(2.40, 44), fin: LUP(2.20, 43), hacer: ({ f, m }) => { m.lupita(f, { boca: "abierta", bocaAbre: habla(f, 120, 126), cejasMiedo: 0.3, cejasAlto: -0.2, mirarY: 0.1 }); } },
  // 24 · Son doce niños.  (desde el frente: los doce en sus mesabancos)
  { w: 127, lugar: "salon", foco: 5, cInf: 6, ini: DIAG(0, 54), fin: DIAG(-0.15, 52), hacer: ({ f, m }) => { m.clase(f, {}, true); } },
  // 25 · Tú eres el número doce.
  { w: 130, lugar: "salon", foco: 1.5, cInf: 8, ini: CARA(CARA_PUP(11, "tu"), 1.7, 42), fin: CARA(CARA_PUP(11, "tu"), 1.5, 40), hacer: ({ f, m }) => { m.clase(f, { mirarY: -0.2 }, true, [11, 10, 7, 6]); m.pupitre(11, "tu", { mirarX: -0.2, boca: "linea", cejasMiedo: 0.4, respira: 0.5 + 0.5 * Math.sin(f * 0.1) }); } },
  // 26 · A las nueve, la maestra pasa lista.  (de noche: medio salón apagado; ella con la lista, bajo el reloj)
  { w: 135, lugar: "salon", foco: 3.0, cInf: 7, ini: c([-0.45, 1.55, -0.1], [-0.85, 1.5, -4.5], 50), fin: c([-0.5, 1.55, -0.4], [-0.85, 1.5, -4.5], 48), hacer: ({ f, m }) => { m.noche = true; m.lupita(f, { sostiene: "hoja", brazoDer: [0.9, -0.3], mirarY: -0.3, boca: "linea" }); } },
  // 27 · Uno... dos... tres...  (levantan la mano uno por uno)
  { w: 142, lugar: "salon", foco: 3.2, cInf: 7, ini: DIAG(0.1, 50), fin: DIAG(-0.25, 48), hacer: ({ f, m }) => { m.noche = true; m.clase(f, {}, true, [0, 1, 2, 3, 4, 5, 6, 7], (i) => [fw(142), fw(143), fw(144), fw(144) + 10, fw(144) + 16, fw(145), fw(145) + 6, fw(146)][i]); } },
  // 28 · Todos contestan.
  { w: 145, lugar: "salon", foco: 4.6, cInf: 6, ini: DIAG(-0.1, 52), fin: DIAG(-0.2, 50), hacer: ({ f, m }) => { m.noche = true; m.clase(f, {}, true, undefined, () => fw(142), true); } },
  // 29 · Llega al once.
  { w: 147, lugar: "salon", foco: 1.5, cInf: 8, ini: LUP(2.35, 44), fin: LUP(2.20, 43), hacer: ({ f, m }) => { m.noche = true; m.lupita(f, { sostiene: "hoja", brazoDer: [0.9, -0.3], mirarY: -0.4, boca: "linea" }); } },
  // 30 · «Mateo».
  { w: 150, lugar: "salon", foco: 1.4, cInf: 8, ini: LUP(2.15, 44), fin: LUP(2.05, 43), hacer: ({ f, m }) => { m.noche = true; m.lupita(f, { sostiene: "hoja", brazoDer: [0.9, -0.3], mirarY: 0.15, mirarX: 0.4, boca: "abierta", bocaAbre: habla(f, 150, 150) }); } },
  // 31 · Silencio.  (los niños se miran entre ellos)
  { w: 151, lugar: "salon", foco: 4.4, cInf: 6, ini: DIAG(0, 48), fin: DIAG(-0.1, 46), hacer: ({ f, m }) => { m.noche = true; m.clase(f, { ...MIEDO(f, 0.25), boca: "linea" }, true, undefined, undefined, false, true); } },
  // 32 · El banco de Mateo está vacío.  (su mesabanco con el 11 y la mochila en el piso)
  { w: 152, lugar: "salon", foco: 1.6, cInf: 8, ini: c([0.95, 1.4, -0.15], [0.8, 0.55, 1.3], 44), fin: c([0.92, 1.35, 0.05], [0.8, 0.55, 1.3], 42), hacer: ({ f, m }) => { m.noche = true; m.clase(f, { mirarX: 0.4, mirarY: 0.2 }, true, [11, 9, 8]); } },
  // 33 · La maestra respira hondo y sigue.
  { w: 158, lugar: "salon", foco: 1.5, cInf: 8, ini: LUP(2.30, 44), fin: LUP(2.15, 43), hacer: ({ f, m }) => { m.noche = true; const resp = f < fw(162); m.lupita(f, { sostiene: "hoja", brazoDer: [0.9, -0.3], parpadeo: resp, respira: resp ? 1 : 0.4, hombros: resp ? 0.4 : 0, boca: "linea", mirarY: resp ? 0 : -0.4, cejasMiedo: 0.5 }); } },
  // 34 · «Doce».  (te mira a ti)
  { w: 164, lugar: "salon", foco: 1.4, cInf: 8, ini: LUP(2.10, 44), fin: LUP(2.00, 43), hacer: ({ f, m }) => { m.noche = true; m.lupita(f, { sostiene: "hoja", brazoDer: [0.9, -0.3], mirarX: 0.7, mirarY: 0.1, boca: "abierta", bocaAbre: habla(f, 164, 164), cejasMiedo: 0.4 }); } },
  // 35 · Abres la boca para contestar...
  { w: 165, lugar: "salon", foco: 1.4, cInf: 8, ini: CARA(CARA_PUP(11, "tu"), 1.5, 38), fin: CARA(CARA_PUP(11, "tu"), 1.3, 36), hacer: ({ f, k, m }) => { m.noche = true; m.clase(f, {}, true, [11, 10, 7]); m.pupitre(11, "tu", { mirarX: -0.5, mirarY: 0.1, boca: "abierta", bocaAbre: 0.5 * suave(0.2, 0.7, k), cejasMiedo: 0.4, brazoDer: [lerp(0.3, 2.6, suave(0.1, 0.6, k)), 0.4] }); } },
  // 36 · pero alguien contesta antes que tú. «Presente».  (la puerta: detrás del vidrio, una silueta)
  { w: 170, lugar: "salon", foco: 2.4, cInf: 7, ini: c([1.6, 1.5, 1.4], [4, 1.45, 2.85], 46), fin: c([1.9, 1.5, 1.6], [4, 1.5, 2.85], 42), hacer: ({ f, m }) => { m.noche = true; m.pasillo(suave(fw(170), fw(172), f)); } },
  // 37 · Desde el pasillo.  (todos voltean hacia la puerta)
  { w: 177, lugar: "salon", foco: 4.4, cInf: 6, ini: c([-3.0, 2.35, -4.1], [1.9, 0.8, 2.6], 50), fin: c([-2.9, 2.3, -3.9], [1.9, 0.8, 2.6], 48), hacer: ({ f, m }) => { m.noche = true; m.pasillo(1); m.clase(f, { ...MIEDO(f, 0.4), mirarX: 0.9, boca: "o" }, true, undefined, undefined, false, false, true); } },
  // 38 · Con tu voz.
  { w: 180, lugar: "salon", foco: 1.3, cInf: 8, sacude: () => 0.004, ini: CARA(CARA_PUP(11, "tu"), 1.35, 36), fin: CARA(CARA_PUP(11, "tu"), 1.2, 34), hacer: ({ f, m }) => { m.noche = true; m.pasillo(1); m.clase(f, {}, true, [11, 10, 7]); m.pupitre(11, "tu", { ...MIEDO(f, 0.7), ojos: 1.18, pupila: 0.16, mirarX: 0.9, boca: "o", sudor: 0.8 }); } },
  // 39 · La perilla de la puerta empieza a girar.
  { w: 183, lugar: "salon", foco: 0.45, cInf: 9, ini: c([PERILLA[0] - 0.42, 1.12, PERILLA[2] - 0.32], PERILLA, 34), fin: c([PERILLA[0] - 0.36, 1.1, PERILLA[2] - 0.27], PERILLA, 32), hacer: ({ f, m }) => { m.noche = true; m.pasillo(1); m.gira(f); } },
  // 40 · ¿Contestas tú también...
  { w: 191, lugar: "salon", foco: 1.3, cInf: 8, sacude: () => 0.004, ini: CARA(CARA_PUP(11, "tu"), 1.3, 35), fin: CARA(CARA_PUP(11, "tu"), 1.15, 33), hacer: ({ f, m }) => { m.noche = true; m.pasillo(1); m.gira(f); m.clase(f, {}, true, [11, 10, 7]); m.pupitre(11, "tu", { ...MIEDO(f, 0.8), mirarX: 0.9, boca: "linea", sudor: 1, lagrimas: 0.3 }); } },
  // 41 · o te quedas callado?  (todo el salón, inmóvil, mirando la puerta; la perilla sigue girando)
  { w: 194, lugar: "salon", foco: 5, cInf: 6, ini: c([-2.6, 2.3, -3.9], [1.4, 1.0, 2.2], 50), fin: c([-2.4, 2.25, -3.6], [1.6, 1.0, 2.4], 48), hacer: ({ f, m }) => { m.noche = true; m.pasillo(1); m.gira(f); m.clase(f, { ...MIEDO(f, 0.4), mirarX: 0.9, boca: "linea" }, true, undefined, undefined, false, false, true); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

// ------------------------------------------------------------------ mundo (estado por cuadro)
class Mundo {
  h = crearEscenario();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  f = 0;
  noche = false;
  private cam!: THREE.PerspectiveCamera;
  constructor() { for (const c of Object.values(this.cartas)) { this.h.raiz.add(c.grupo); c.sombraLarga.visible = false; } }
  reiniciar(cam: THREE.PerspectiveCamera) {
    this.cam = cam;
    for (const c of Object.values(this.cartas)) { c.grupo.visible = false; c.contacto.visible = true; c.grupo.rotation.set(0, 0, 0); }
    const h = this.h;
    this.noche = false;
    h.puesto.visible = false; h.cadena.visible = false; h.silueta.visible = false; h.luzPasillo.intensity = 0;
    h.sombras.forEach((s) => ((s.material as THREE.MeshBasicMaterial).opacity = 0));
    h.sillas.forEach((s) => (s.visible = true));
    h.puerta.position.x = SALON.x + 0.03; h.perilla.rotation.x = 0;
    h.hojaA.rotation.y = 1.45; h.hojaB.rotation.y = -1.45;
    h.luzExtra.intensity = 0;
  }
  /** tarjeta que mira a la cámara; `mira` (±x, ±z): hacia dónde ve la persona (si la cámara queda detrás, de espaldas); `giro`: rueda en su plano */
  ver(quien: Quien, pos: V3, pose: Partial<Pose>, mira?: [number, number], giro = 0, silla?: string) {
    const c = this.cartas[quien], cp = this.cam.position;
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.set(0, Math.atan2(cp.x - pos[0], cp.z - pos[2]), giro);
    const espalda = mira ? (cp.x - pos[0]) * mira[0] + (cp.z - pos[2]) * mira[1] < 0 : false;
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[0] * 3), ...pose, ...(silla ? { silla: { color: silla, k: LIENZO_H / ALTO(quien) } } : {}), ...(espalda ? { vista: "espalda" as const } : {}) });
  }
  /** lo mismo, en coordenadas del camión */
  verB(quien: Quien, p: V3, pose: Partial<Pose>, mira?: [number, number], giro = 0) { this.ver(quien, B(p), pose, mira, giro); this.cartas[quien].contacto.visible = false; }

  // ---------------- la calle
  /** tú corriendo por la banqueta hacia la puerta (cerca: la cara de miedo) */
  corre(f: number, cerca = false) {
    const z = ninoZ(f), llega = suave(fw(14), fw(16), f);
    if (f > fw(17)) return;
    this.ver("tu", [lerp(KX, 4.3, llega), 0.16 * (1 - llega) + brinco(f, 0, 1.0), z], { ...LUNA, ...CORRE(f, 0, 1.0), ...MIEDO(f, 0.3), boca: cerca ? "grito" : "abierta", bocaAbre: 0.8, mirarX: cerca ? -0.4 : 0, sudor: 0.6 }, [0, 1], 0.06 * Math.sin(f * 0.5));
  }
  /** los zombies del parque */
  calleZombis(f: number, n: number) { for (let i = 0; i < n; i++) { const p = zombiCalle(f, i); this.ver(ZS[i], [p[0], p[1] + brinco(f, i), p[2]], { ...LUNA, ...ZOMBI(f, i), ...CORRE(f, i * 1.7) }, [-0.6, 1], 0.1 * Math.sin(f * 0.42 + i * 2)); } }
  /** niños en las ventanas del camión (visto por fuera) */
  busNinos(f: number) { [[1, 0], [1, 2], [1, 4], [-1, 1], [-1, 3]].forEach(([l, fi], i) => this.verB(NS[i], sentadoEn(l, fi, ALTO(NS[i])), { ...LUNA, sentado: 1, ...MIEDO(f, 0.5), boca: i % 2 ? "grito" : "o", mirarX: 0.6 }, [0, 1])); }
  /** niños adentro (vistos desde adelante del pasillo) */
  ninosBus(f: number, asustados: boolean) {
    const L: [number, number][] = [[1, 1], [-1, 1], [1, 3], [-1, 2], [-1, 4], [1, 5]];
    L.forEach(([l, fi], i) => this.verB(NS[i], sentadoEn(l, fi, ALTO(NS[i])), { ...SALON_L, sentado: 1, ...(asustados ? MIEDO(f, 0.5) : {}), boca: i % 3 === 0 ? "grito" : "o", mirarX: 0.7, brazoIzq: i % 2 ? [1.6, -1.0] : [0.3, 0.3], brazoDer: i % 2 ? [1.6, -1.0] : [0.3, 0.3] }, [0, 1]));
  }
  ramiro(f: number, pose: Partial<Pose>) { this.verB("ramiro", RAMIRO_P, { ...LUNA, sentado: 1, brazoIzq: [0.3, 1.35], brazoDer: [0.3, 1.35], ...pose }, [0, 1]); }
  /** «cierra la puerta»: subes los escalones; las hojas se cierran; un zombie se estrella afuera */
  subeTu(f: number, k: number) {
    const cierra = suave(fw(24), fw(24) + 10, f), sube = suave(0, 0.45, k);
    this.h.bus.hojas[0].rotation.y = -1.3 * (1 - cierra); this.h.bus.hojas[1].rotation.y = 1.3 * (1 - cierra);
    this.verB("tu", [lerp(0.95, 0.55, sube), lerp(-0.55, 0, sube), lerp(3.9, 3.55, sube)], { ...SALON_L, ...MIEDO(f, 0.6), boca: "abierta", bocaAbre: 0.7, sudor: 0.8, mirarX: 0.8, piernas: [Math.max(0, Math.sin(f * 0.7)) * (1 - sube), 0], brazoIzq: [1.2, 0.5], brazoDer: [0.6, 0.3] }, [-1, 0]);
    const atras = recorrido(f), zz = 3.9 - atras;
    this.verB("z1", [1.75, -0.8 + brinco(f, 1), zz], { ...LUNA, ...ZOMBI(f, 1), boca: "dientes", brazoIzq: [2.4, 0.4], brazoDer: [2.4, 0.4] }, [-1, 0]);
    this.verB("z2", [2.2, -0.8 + brinco(f, 2), zz - 0.9], { ...LUNA, ...ZOMBI(f, 2), ...CORRE(f, 2) }, [-1, 0]);
  }
  /** «se avienta contra el vidrio»: brinca, se pega a la ventana, se resbala y se queda atrás */
  ventana(f: number) {
    const t = f - fw(31) + 2, sal = suave(-8, 6, t), cae = suave(30, 50, t);
    const z = 0.85 - cae * 3.5, y = -0.8 + 0.75 * sal - 1.1 * cae;
    this.verB("z3", [1.47, y, z], { ...LUNA, ...ZOMBI(f, 3), boca: "dientes", ojosVacios: true, brazoIzq: [2.5, 0.3], brazoDer: [2.5, 0.3], cabezaX: 0.05 * Math.sin(f * 0.6) }, [-1, 0], cae * 0.6);
    this.verB("n3", sentadoEn(1, 2, ALTO("n3")), { ...SALON_L, sentado: 1, ...MIEDO(f, 1), boca: "grito", ojos: 1.15, mirarX: 0.8, cuerpoX: -0.2 * sal, brazoIzq: [1.6, -1.0], brazoDer: [1.6, -1.0] }, [0, 1]);
  }
  /** «se cuelga del espejo»: agarrado del brazo del espejo derecho, con las piernas colgando */
  colgado(f: number) {
    const sw = Math.sin(f * 0.25) * 0.08;
    this.verB("z5", [1.78 + sw * 0.5, -0.1 + 0.02 * Math.sin(f * 0.5), 5.0], { ...LUNA, ...ZOMBI(f, 5), boca: "dientes", brazoIzq: [2.9, 0.1], brazoDer: [2.9, 0.1], piernas: [0.4 + 0.3 * Math.sin(f * 0.4), 0.4 - 0.3 * Math.sin(f * 0.4)] }, [0, 1], sw);
  }
  /** «sale volando»: sale disparado hacia la banqueta, en arco y dando vueltas */
  vuela(f: number) {
    const t = Math.max(0, f - fw(47)), u = Math.min(1, t / 16), rueda = Math.max(0, t - 16);
    const p = B([1.78 + u * 2.6 + Math.min(0.6, rueda * 0.04), -0.1 + 2.2 * u * (1 - u) - 0.55 * u, 5.0 - u * 4 - rueda * 0.3]);
    if (t <= 0) { this.colgado(f); return; }
    this.ver("z5", [p[0], Math.max(0.17, p[1]), p[2]], { ...LUNA, ...ZOMBI(f, 5), boca: "grito", brazoIzq: [2.2, 0.2], brazoDer: [1.2, 0.6], piernas: [0.8, 0.2] }, [0, 1], -u * Math.PI * 2.4);
    this.cartas.z5.contacto.visible = false;
  }
  /** «las calles están llenas»: zombies por toda la avenida (fuera del carril del camión) */
  llenas(f: number, cerca = false) {
    const L: [number, number][] = [[-3.2, 9], [-0.6, 12], [6.8, 14], [-4.0, 17], [0.3, 20], [7.2, 23], [-2.4, 26], [5.9, 30], [-0.8, 34]];
    const r = recorrido(f) - recorrido(fw(50) - 2);
    L.forEach(([x, z], i) => { const zz = z - r + (cerca ? -2 : 0); if (zz < -20 || zz > 70 || (cerca && x > 5)) return; this.ver(ZS[i], [x + 0.3 * Math.sin(f * 0.05 + i), (x > 5.5 ? 0.16 : 0) + brinco(f, i, 0.5), zz], { ...LUNA, ...ZOMBI(f, i), ...CORRE(f, i * 1.7, 0.5), brazoIzq: [2.2 + 0.3 * Math.sin(f * 0.3 + i), 0.3], brazoDer: [2.2 - 0.3 * Math.sin(f * 0.3 + i), 0.3] }, [0, -1]); });
  }
  /** «tumba un puesto de periódicos» */
  puesto(f: number) {
    const h = this.h; h.puesto.visible = true;
    const z = 6.4 + 0.9 + (avance(TUMBA()) - avance(f));
    h.puesto.position.set(7.2, 0.16, z);
    h.tumbar((f - TUMBA()) / FPS);
  }
  // ---------------- la escuela
  /** «entra a la escuela»: el camión entra por el portón (mirando a +x) y frena en el patio */
  entra(f: number, k: number) {
    const h = this.h, x = lerp(-6, 18, empuje(k * 1.1, 2.2));
    h.busG.position.set(x, 0, 0); h.busG.rotation.set(0, Math.PI / 2, 0);
    h.bus.llantas.forEach((l) => (l.rotation.x = x / 0.5));
    BUS_M.copy(h.busG.matrixWorld.compose(h.busG.position, h.busG.quaternion, h.busG.scale));
    this.verB("ramiro", RAMIRO_P, { ...LUNA, sentado: 1, brazoIzq: [0.3, 1.35], brazoDer: [0.3, 1.35], ...MIEDO(f, 0.3), boca: "dientes" }, [0, 1]);
    this.verB("n1", sentadoEn(1, 1, ALTO("n1")), { ...LUNA, sentado: 1, boca: "o", mirarX: -0.5 }, [0, 1]);
    this.verB("n2", sentadoEn(-1, 2, ALTO("n2")), { ...LUNA, sentado: 1, boca: "o", mirarX: 0.5 }, [0, 1]);
    // la maestra espera junto al portón con su linterna
    this.ver("lupita", [11.5, 0, -4.2], { ...LUNA, borde: "#ffd7a0", mirarX: -0.6, boca: "abierta", bocaAbre: 0.5 + 0.4 * Math.sin(f * 0.5), brazoDer: [2.4 + 0.3 * Math.sin(f * 0.4), 0.3], brazoIzq: [0.4, -0.3] }, [-1, 0]);
    this.luz(11.2, 1.6, -3.8, 3, "#ffd7a0");
  }
  /** «cierra el portón con cadena» */
  cierra(f: number, k: number) {
    const h = this.h, a = empuje(Math.min(1, k / 0.55), 2);
    h.hojaA.rotation.y = lerp(1.45, 0, a); h.hojaB.rotation.y = lerp(-1.45, 0, a);
    h.cadena.visible = k > 0.62;
    this.busParado();
    const zL = lerp(1.8, 0.45, a);
    this.ver("lupita", [ESC.barda + 0.55, 0, zL], { ...LUNA, borde: "#ffd7a0", ...MIEDO(f, 0.3), boca: "dientes", mirarX: -0.7, brazoIzq: [1.5, -0.2], brazoDer: [1.4, -0.2], cuerpoX: -0.1 }, [-1, 0]);
    // afuera: los zombies que llegan corriendo
    [[-3, -2.5], [-5, 1.5], [-8, -0.5], [-6.5, 3.5]].forEach(([x, z], i) => { const xx = Math.min(ESC.barda - 0.5, x + k * 9 + i * 0.4); this.ver(ZS[i], [xx, xx > 5.5 ? 0.16 : 0, z + Math.sin(f * 0.05 + i) * 0.3], { ...LUNA, ...ZOMBI(f, i), ...CORRE(f, i) }, [1, 0]); });
    this.luz(ESC.barda + 1.5, 1.8, 0.5, 3, "#ffd7a0");
  }
  portonCerrado() { this.h.hojaA.rotation.y = 0; this.h.hojaB.rotation.y = 0; this.h.cadena.visible = true; this.busParado(); }
  busParado() { const h = this.h; h.busG.position.set(18, 0, 0); h.busG.rotation.set(0, Math.PI / 2, 0); BUS_M.compose(h.busG.position, h.busG.quaternion, h.busG.scale); }
  /** «se pegan a la reja»: brazos por encima, manos que se agarran de los barrotes */
  reja(f: number) {
    const L: [number, number][] = [[-1.9, 1.7], [-1.05, 1.62], [-0.2, 1.74], [0.65, 1.6], [1.5, 1.7], [2.35, 1.66]];
    L.forEach(([z], i) => this.ver(ZS[i], [ESC.barda - 0.3 - (i % 2) * 0.35, 0.16, z + 0.04 * Math.sin(f * 0.2 + i)], { ...LUNA, ...ZOMBI(f, i), boca: i % 2 ? "dientes" : "abierta", brazoIzq: [2.6 + 0.2 * Math.sin(f * 0.5 + i), 0.2], brazoDer: [2.6 - 0.2 * Math.sin(f * 0.45 + i), 0.2], cuerpoX: 0.05 * Math.sin(f * 0.6 + i) }, [1, 0]));
    [[-4.2, -0.6], [-5.5, 1.2], [-3.4, 3.0]].forEach(([x, z], i) => this.ver(ZS[6 + i], [x, 0, z], { ...LUNA, ...ZOMBI(f, 6 + i), ...CORRE(f, i, 0.5) }, [1, 0]));
    this.luz(ESC.barda + 1.2, 2.2, 0.2, 3.5, "#ffd7a0");
  }
  /** «los llevan al salón»: en fila detrás de la maestra, hacia la puerta del edificio */
  fila(f: number, k: number) {
    this.busParado();
    const fila: Quien[] = ["lupita", "n1", "n2", "tu", "n3", "n4", "mateo", "n5"];
    fila.forEach((q, i) => {
      const x = lerp(18, 24.5, k) - i * 0.9, z = -2.6 - (i % 2) * 0.35, paso = Math.sin(f * 0.45 + i);
      this.ver(q, [x, 0, z], { ...LUNA, borde: "#ffd7a0", ...(q === "lupita" ? { brazoDer: [1.3, -0.2] } : MIEDO(f, 0.2)), mirarX: 0.6, piernas: [Math.max(0, paso) * 0.5, Math.max(0, -paso) * 0.5], boca: "linea" }, [1, 0]);
    });
  }
  // ---------------- el salón
  /** la clase: cada niño en su pupitre (la silla se dibuja en la tarjeta). `solo`: índices de pupitre a dibujar;
   *  `mano(i)`: cuadro en que el niño i levanta la mano; `seMiran`: voltean a los lados; `puerta`: miran a la puerta */
  clase(f: number, pose: Partial<Pose>, conMateo: boolean, solo?: number[], mano?: (i: number) => number, todos = false, seMiran = false, puerta = false) {
    EN_PUPITRE.forEach((q, i) => {
      if (solo && !solo.includes(i)) return;
      if (q === "mateo" && !conMateo) return;
      if (q === "mateo" && this.noche) return; // de noche, su banco está vacío
      const fm = mano ? (todos ? mano(i) : mano(i) ?? 1e9) : 1e9;
      const arriba = f >= fm && f < fm + 40;
      const mira = seMiran ? { mirarX: Math.sin(i * 2.3 + f * 0.04) * 0.8, giro: Math.sin(i * 2.3) * 0.3 } : puerta ? { mirarX: Math.min(1, 0.4 + (PUPITRES[i][0] + 3) * 0.15), giro: 0.3 } : {};
      this.pupitre(i, q, { ...pose, ...mira, ...(arriba ? { brazoDer: [2.7, 0.2], boca: "abierta", bocaAbre: f < fm + 8 ? 0.7 : 0 } : {}) });
    });
  }
  pupitre(i: number, q: Quien, pose: Partial<Pose>) {
    const s = this.h.sillas[i]; s.visible = false;
    this.ver(q, PUP(i), { ...(this.noche ? LAMPARA : SALON_L), sentado: 1, mirarY: -0.1, respira: 0.5 + 0.5 * Math.sin(this.f * 0.07 + i), ...pose }, [0, -1], 0, "#2f5f9a");
  }
  lupita(f: number, pose: Partial<Pose>) { this.ver("lupita", LUPITA_P, { ...(this.noche ? LAMPARA : SALON_L), mirarY: 0.1, respira: 0.5 + 0.5 * Math.sin(f * 0.08), ...pose }, [0, 1]); }
  sombras(k: number, f: number) { this.h.sombras.forEach((s, i) => { (s.material as THREE.MeshBasicMaterial).opacity = 0.75 * k; s.position.y = 1.7 + 0.03 * Math.sin(f * 0.2 + i); }); }
  /** golpes en la puerta: tiembla un poco en cada golpe */
  toca(f: number, golpes: number[]) { const g = golpes.reduce((a, t) => a + (f >= t && f < t + 4 ? (1 - (f - t) / 4) : 0), 0); this.h.puerta.position.x = SALON.x + 0.03 - 0.012 * g; }
  /** la luz del pasillo y la silueta detrás del vidrio */
  pasillo(k: number) { const h = this.h; h.luzPasillo.intensity = 2.5 * k; h.silueta.visible = k > 0.02; (h.silueta.material as THREE.MeshBasicMaterial).opacity = k; }
  /** la perilla gira despacio (a partir de «girar») */
  gira(f: number) { this.h.perilla.rotation.x = -0.9 * suave(fw(188), fw(190) + 20, f); }
  luz(x: number, y: number, z: number, i: number, color = "#ffc890") { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; l.color.set(color); }

  luces(f: number, pl: Plano) {
    const h = this.h, L = pl.lugar;
    h.calle.visible = L === "calle"; h.escuela.visible = L === "escuela"; h.salon.visible = L === "salon";
    h.busG.visible = L !== "salon"; h.cielo.visible = L !== "salon";
    for (const o of h.derecha) o.visible = false; // postes y coches de la banqueta derecha: estorbarían al niño y al camión
    const parque = f < fw(40); h.parque.visible = parque; h.ocultos.forEach((o) => (o.visible = !parque)); // el parque solo al principio (la avenida se repite)
    if (L === "calle") {
      const av = avance(f); h.avanzar(av);
      const b = busEn(f); h.busG.position.set(b.x, b.y, 0); h.busG.rotation.set(0, b.giro, b.ladeo);
      h.bus.llantas.forEach((l) => (l.rotation.x = av / 0.5));
      if (pl.w < 24) { h.bus.hojas[0].rotation.y = -1.3; h.bus.hojas[1].rotation.y = 1.3; }
      else if (pl.w > 24) { h.bus.hojas[0].rotation.y = 0; h.bus.hojas[1].rotation.y = 0; }
    }
    h.fuego.animar(f / FPS);
    const salon = L === "salon";
    h.amb.intensity = salon ? 0.4 : 0.5; h.hemi.intensity = salon ? 0.35 : 0.7; h.luna.intensity = salon ? 0 : 1.5;
    const n = this.noche;
    h.tubos.forEach((t, i) => (t.visible = !n || i >= 8)); // de noche solo quedan prendidos los de atrás
    h.luzSalon[0].intensity = n ? 0.4 : 3.2; h.luzSalon[1].intensity = n ? 1.6 : 3.2; h.luzLamp.intensity = n ? 3.2 : 1.6;
    h.amb.intensity = salon ? (n ? 0.22 : 0.4) : h.amb.intensity;
    h.minG.rotation.z = 0; h.horaG.rotation.z = n ? Math.PI / 2 : -Math.PI / 6 * 2; // a las nueve (la manecilla de la hora a la izquierda)
    h.bus.luzInt.forEach((l) => (l.intensity = L === "calle" ? 1.1 : 0.6));
  }
}

// ------------------------------------------------------------------ acabado aprobado (§8.9)
const lutFrio = () => {
  const n = 32, d = new Float32Array(n ** 3 * 4);
  for (let bi = 0; bi < n; bi++) for (let gi = 0; gi < n; gi++) for (let ri = 0; ri < n; ri++) {
    let r = ri / (n - 1), g = gi / (n - 1), b = bi / (n - 1);
    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    r = L + (r - L) * 0.6; g = L + (g - L) * 0.63; b = L + (b - L) * 0.7;
    r = r ** 0.7; g = g ** 0.7; b = b ** 0.7;
    r *= 0.92; g *= 0.985; b *= 1.07;
    const s = (1 - L) ** 2; r += 0.03 * s; g += 0.045 * s; b += 0.075 * s;
    const i = (ri + gi * n + bi * n * n) * 4;
    d[i] = Math.min(1, r); d[i + 1] = Math.min(1, g); d[i + 2] = Math.min(1, b); d[i + 3] = 1;
  }
  return new LookupTexture(d, n).convertToUint8();
};

// ------------------------------------------------------------------ escena 3D
const PORTADA_I = 39; // la perilla… se cambia abajo si hace falta
const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? fw(37) : f0;
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => new Mundo(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 1.5, distFar: 30 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.0, luminanceThreshold: 0.62, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    sat: new HueSaturationEffect({ saturation: -0.06 }),
    lut: new LUT3DEffect(lutFrio()),
    luz: new BrightnessContrastEffect({ brightness: -0.01, contrast: 0.16 }),
    vin: new VignetteEffect({ offset: 0.28, darkness: 0.78 }),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const composer = useMemo(() => {
    const cc = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    cc.addPass(new RenderPass(scene, cam)); cc.addPass(fx.ink);
    cc.addPass(new EffectPass(cam, fx.lens.pre)); cc.addPass(new EffectPass(cam, fx.lens.main));
    cc.addPass(new EffectPass(cam, fx.bloom, fx.tone, fx.lut, fx.sat, fx.luz, fx.vin));
    return cc;
  }, [gl, scene, cam, fx]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size.width, size.height]);
  useFrame(() => { composer.render(); }, 1);

  const i = portada ? PORTADA_I : planoEn(f);
  const pl = PLANOS[i];
  const fp = portada ? fw(PLANOS[PORTADA_I].w) + 50 : f;
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : AUTOBUS_CUADROS;
  const k0 = Math.min(1, Math.max(0, (fp - a) / Math.max(1, b - a)));
  const k = pl.rapido ? empuje(k0, 3) : k0;
  mundo.f = fp;
  // el camión primero (las cámaras «en el camión» se mueven con él)
  if (pl.lugar === "calle") { const bb = busEn(fp); mundo.h.busG.position.set(bb.x, bb.y, 0); mundo.h.busG.rotation.set(0, bb.giro, bb.ladeo); }
  mundo.h.busG.updateMatrixWorld(true); BUS_M.copy(mundo.h.busG.matrixWorld);
  let pos = pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3;
  let mira = pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3;
  if (pl.enBus) { pos = B(pos); mira = B(mira); }
  const s = pl.sacude ? pl.sacude(fp) : 0;
  if (s) { pos[0] += s * Math.sin(fp * 1.3); pos[1] += s * Math.sin(fp * 1.7 + 1); mira[0] += s * 1.5 * Math.sin(fp * 1.1 + 2); } // ≈ 6 Hz: sacude sin vibrar cuadro a cuadro
  cam.position.set(...pos);
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.03; cam.far = 320; cam.updateProjectionMatrix();
  cam.lookAt(...mira);
  cam.updateMatrixWorld();
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  scene.background = new THREE.Color("#0a0f1c");
  scene.fog = pl.lugar === "salon" ? null : new THREE.Fog("#101827", 16, 85);
  mundo.reiniciar(cam);
  pl.hacer({ f: fp, k: k0, m: mundo });
  mundo.luces(fp, pl);
  if (pl.lugar !== "calle") { mundo.h.busG.updateMatrixWorld(true); }
  return <primitive object={mundo.h.raiz} dispose={null} />;
};

// ------------------------------------------------------------------ capas de texto (guía §3)
const FUENTES = [["Titulo", "fuentes/InterDisplay-Black.otf"], ["Texto", "fuentes/InterDisplay-ExtraBold.otf"], ["Mono", "fuentes/JetBrainsMono-Bold.ttf"]];
const useFuentes = () => {
  const [h] = React.useState(() => delayRender("fuentes"));
  useEffect(() => {
    Promise.all(FUENTES.map(([n, u]) => new FontFace(n, `url(${staticFile(u)})`).load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); })))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};
const contornoTexto = (px: number) => ({ WebkitTextStroke: `${px}px #0d0a0c`, paintOrder: "stroke fill" as const, textShadow: "0 6px 14px rgba(0,0,0,0.55)" });

const BLOQUES: number[][] = (() => {
  const out: number[][] = []; let cur: number[] = [];
  P.forEach((w, i) => {
    if (cur.length && (cur.length >= 3 || w.ini - P[i - 1].fin > 0.32 || /[.,:;?!»…]$/.test(P[i - 1].txt))) { out.push(cur); cur = []; }
    cur.push(i);
  });
  if (cur.length) out.push(cur);
  return out;
})();
const Subtitulos: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS + 1.6 / FPS;
  const bi = BLOQUES.findIndex((b, j) => t >= P[b[0]].ini && (j + 1 >= BLOQUES.length || t < P[BLOQUES[j + 1][0]].ini));
  if (bi < 0) return null;
  const b = BLOQUES[bi];
  if (t > P[b[b.length - 1]].fin + 0.6) return null;
  const actual = b.filter((i) => t >= P[i].ini).pop();
  const pop = Math.min(1, (t - P[b[0]].ini) * 30 / 3);
  return (
    <div style={{ position: "absolute", top: 1517 - 50, width: "100%", textAlign: "center", fontFamily: "Texto", fontSize: 66, lineHeight: "100px", transform: `scale(${0.9 + 0.1 * pop})`, ...contornoTexto(11) }}>
      {b.map((i) => <span key={i} style={{ color: i === actual ? "#ffd23a" : "#ffffff", margin: "0 9px" }}>{P[i].txt.replace(/[«»]/g, "")}</span>)}
    </div>
  );
};
const Titulo: React.FC<{ f: number }> = ({ f }) => {
  const reglas: [number, number, string][] = [[95, 102, "REGLA Nº 1"], [102, 112, "REGLA Nº 2"], [112, 127, "REGLA Nº 3"], [135, 142, "9:00 PM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "DÍA 1 · 7:10 PM · PARQUE LOS FRESNOS";
  if (f >= inicioPlano(3)) return null;
  const n = Math.round(Math.min(1, (f + 6) / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(191) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 38, padding: "12px 26px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
      {boton("CONTESTAR", "#2f63d2", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("QUEDARTE CALLADO", "#c8263a", 4)}
    </div>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.03, far: 320 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Autobus: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D />
      <Rotulo f={f} />
      <Titulo f={f} />
      <Botones f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
export const AutobusPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 1.1, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", bottom: 0, width: "100%", height: 620, background: "linear-gradient(#05070c00, #05070cee 50%)" }} />
      <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center" }}>
        {linea("ALGUIEN CONTESTÓ", "#ffffff", 96)}
        {linea("«PRESENTE»…", "#ffffff", 96)}
        {linea("CON TU VOZ", "#ffd23a", 112)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void lerp; void ALTO;
