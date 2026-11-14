// «El último tren» — animación completa. Zombies, gancho con acción desde el cuadro 0, en orden y sin adelantos
// (modelo aprobado: «La ambulancia»). Escenario: el metro de «Último vagón» (puertas ahora móviles) + `extra.ts`.
// Mismo composer y acabado aprobado (§8.9: personajes ref7, LUT frío, SIN capa de puntitos encima).
// Coordenadas: el vagón va de z −9 a 9 (frente hacia +z), sus puertas del lado del andén están en x = +1.4.
// Cada plano empieza 2 cuadros antes de su palabra.
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
import { Aspecto, Pose } from "../prueba_pasillo/personaje";
import { POSE, Tarjeta, lerp, parpadea, ruido, suave, texTexto } from "../turno3/comun";
import { empuje, hablaGestos, tiembla } from "../comun/movimiento";
import { V, crearMetro } from "../ultimo_vagon/metro";
import { crearExtras } from "./extra";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const TREN_CUADROS = Math.ceil(82.36 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes (todos ref7)
const TU: Aspecto = { piel: "#d6ae8c", pelo: "#2a1c16", ropa: "#4a5a6e", ropaInterior: "#e8e6e0", pantalon: "#263248", zapatos: "#e8e4dc", peinado: "revuelto", cuello: "capucha", mochila: "#c8482e", estilo: "ref7", semilla: 1101 };
const SOFI: Aspecto = { piel: "#dcb490", pelo: "#3a2418", ropa: "#e0b030", ropaInterior: "#f0e6d0", pantalon: "#5a3a6a", zapatos: "#e04a6a", peinado: "mono", coletas: "#e04a8a", cuello: "redondo", estilo: "ref7", semilla: 1103 };
const MAMA: Aspecto = { piel: "#cfa282", pelo: "#2a1a14", ropa: "#7a4a6a", ropaInterior: "#e0d8c8", pantalon: "#3a3440", zapatos: "#2a2224", peinado: "largo", rota: true, estilo: "ref7", semilla: 1105 };
const GUARDIA: Aspecto = { piel: "#b98a68", pelo: "#1e1a18", ropa: "#3e4a3a", ropaInterior: "#2a2a2a", pantalon: "#2e3238", zapatos: "#1a1a1a", peinado: "recogido", gorra: "#2a3a2e", prenda: "chamarra", barba: "candado", arrugas: true, estilo: "ref7", semilla: 1107 };
const SENORA: Aspecto = { piel: "#c99a78", pelo: "#5a5a5e", ropa: "#6a4a6a", ropaInterior: "#e0d8c8", pantalon: "#3a3440", zapatos: "#2a2224", peinado: "trenza", rebozo: "#8a5a3a", arrugas: true, estilo: "ref7", semilla: 1109 };
const SENOR: Aspecto = { piel: "#c49470", pelo: "#3a3a3c", ropa: "#7a6a4a", ropaInterior: "#e8e0d0", pantalon: "#4a4238", zapatos: "#2a2018", peinado: "recogido", sombrero: "#c9b48a", bigote: true, prenda: "camisa", arrugas: true, estilo: "ref7", semilla: 1111 };
const JOVEN: Aspecto = { piel: "#d2a482", pelo: "#1a1414", ropa: "#3a6a5a", ropaInterior: "#2a2a34", pantalon: "#2a3446", zapatos: "#d8d4cc", peinado: "largo", cuello: "capucha", estilo: "ref7", semilla: 1113 };
const zombi = (ropa: string, pantalon: string, pelo: string, peinado: Aspecto["peinado"], piel: string, n: number, extra: Partial<Aspecto> = {}): Aspecto => ({ piel, pelo, ropa, ropaInterior: "#3a3a36", pantalon, zapatos: "#2a2622", peinado, estilo: "ref7", semilla: 1120 + n, zombi: n + 10, ...extra });
const CARTAS = {
  tu: [TU, 1.6], sofi: [SOFI, 1.12], mama: [MAMA, 1.56], guardia: [GUARDIA, 1.76], senora: [SENORA, 1.52], senor: [SENOR, 1.66], joven: [JOVEN, 1.6],
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
const ZS: Quien[] = ["z1", "z2", "z3", "z4", "z5", "z6"];
const ANDEN: Partial<Pose> = { luzX: 1, borde: "#dfe8ff" }; // tubos del andén
const VAGON: Partial<Pose> = { luzX: -1, borde: "#ffe2a6" }; // luces del vagón
const CALIDA: Partial<Pose> = { luzX: 1, borde: "#ffc888" }; // linternas del refugio
const OSCURO: Partial<Pose> = { luzX: 1, borde: "#8aa0d0" }; // luces apagadas

type V3 = [number, number, number];
const ZC = 3.0; // centro de la puerta (lado del andén)
const ASIENTO_Y = 0.15; // los asientos del vagón son más altos que la silla de `sentado`
const TU_S: V3 = [1.0, ASIENTO_Y, 0.95], SOFI_S: V3 = [1.02, ASIENTO_Y + 0.08, 0.38]; // sentados bajo la ventana, mirando a −x
const TU_S_CARA: V3 = [TU_S[0], 1.26, TU_S[2]], SOFI_S_CARA: V3 = [SOFI_S[0], 1.02, SOFI_S[2]];
const MAMA_P: V3 = [1.78, 0, ZC + 0.31]; // frente a la ventanilla de una hoja (no detrás de la junta) // afuera, pegada a la puerta (del lado del andén)

// ------------------------------------------------------------------ planos
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Lugar = "estacion" | "tunel" | "refugio";
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; lugar: Lugar; rapido?: boolean; sacude?: (f: number) => number; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const golpeCam = (f: number, desde: number, fuerza: number, dura = 14) => (f >= desde && f < desde + dura ? fuerza * (1 - (f - desde) / dura) : 0);
const MIEDO = (f: number, k = 0.4): Partial<Pose> => ({ ojos: 1.1, pupila: 0.2, ojeras: 0.6, cejasMiedo: 0.8, ...tiembla(f, k) });
const ZOMBI = (f: number, n: number): Partial<Pose> => ({ ojosVacios: true, ojeras: 1, parpadeo: false, boca: "abierta", bocaAbre: 0.6 + 0.4 * Math.sin(f * 0.35 + n), cejasAlto: -0.3, cabezaX: 0.06 * Math.sin(f * 0.3 + n * 2) });
const CORRE = (f: number, n: number, v = 0.85): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v + n)), Math.max(0, -Math.sin(f * v + n))], brazoIzq: [1.0 + 0.5 * Math.sin(f * v + n), 0.6], brazoDer: [1.0 - 0.5 * Math.sin(f * v + n), 0.6] });
const CORRE_Z = (f: number, n: number, v = 0.85): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v + n)), Math.max(0, -Math.sin(f * v + n))], brazoIzq: [2.4 + 0.3 * Math.sin(f * v + n), 0.2], brazoDer: [2.4 - 0.3 * Math.sin(f * v + n), 0.2] });
const brinco = (f: number, n: number, v = 0.85) => 0.06 * Math.abs(Math.sin(f * v + n));
const tambalea = (f: number, n: number) => 0.12 * Math.sin(f * 0.42 + n * 2);

// la carrera del inicio por el andén (hacia +z, a la puerta)
const CARRERA = (f: number) => -16 + (f / FPS) * 3.0; // z de tus pies
// el tren arranca en «arranca» (z del tren: 0 → se va hacia +z)
const ARRANCA = () => fw(69) - 6;
const trenZ = (f: number) => { const t = Math.max(0, f - ARRANCA()) / FPS; return 0.55 * t * t; };
const PUERTA_CIERRA = () => fw(42) - 4; // empieza a cerrar
const HAY_BRAZO = () => fw(47) - 4;
const SUELTA = () => fw(64);
/** qué tan abiertas están las puertas (1 abiertas, 0 cerradas) */
const abiertas = (f: number) => {
  if (f < PUERTA_CIERRA()) return 1;
  if (f < HAY_BRAZO()) return lerp(1, 0.12, suave(PUERTA_CIERRA(), HAY_BRAZO(), f));
  if (f < SUELTA()) return 0.12 + 0.015 * Math.sin(f * 0.9); // atoradas contra el brazo
  return Math.max(0, 0.12 * (1 - (f - SUELTA()) / 6));
};
const SIRENA = () => fw(157) - 2, APAGON = () => fw(161) - 1;
const MAMA_LLEGA = (f: number) => lerp(-14, ZC + 0.05, suave(fw(164), fw(179) - 4, f)); // z de tu mamá por el andén

/** tú y Sofi corriendo por el andén (Sofi un paso atrás, de tu mano) */
const CORREN = (m: Mundo, f: number, z: number, x = 3.1) => {
  m.ver("tu", [x, brinco(f, 0, 0.9), z], { ...ANDEN, ...MIEDO(f, 0.3), boca: "dientes", sudor: 0.8, ...CORRE(f, 0, 0.9), brazoIzq: [1.2, 0.4] }, [0, 1]);
  m.ver("sofi", [x - 0.62, brinco(f, 1, 0.9), z - 0.55], { ...ANDEN, ...MIEDO(f, 0.5), boca: "grito", lagrimas: 0.5, ...CORRE(f, 1, 0.9), brazoDer: [1.3, 0.3] }, [0, 1]);
};
/** zombies que los persiguen por el andén */
const PERSIGUEN = (m: Mundo, f: number, z: number, cuantos = 6) => {
  const L: [number, number][] = [[3.4, -3.2], [4.6, -4.4], [2.4, -5.2], [5.5, -6.0], [3.9, -7.1], [2.8, -8.3]];
  L.slice(0, cuantos).forEach(([x, dz], i) => m.ver(ZS[i], [x, brinco(f, i), z + dz + 0.3 * Math.sin(f * 0.07 + i)], { ...ANDEN, ...ZOMBI(f, i), ...CORRE_Z(f, i * 1.7) }, [0, 1], tambalea(f, i)));
};
/** los dos sentados bajo la ventana (Sofi recargada en tu hombro: se inclina toda su tarjeta) */
const SENTADOS = (m: Mundo, f: number, luz: Partial<Pose>, tu: Partial<Pose> = {}, sofi: Partial<Pose> = {}, recarga = 0) => {
  m.ver("tu", TU_S, { ...luz, sentado: 1, brazoIzq: [0.2, 0.3], brazoDer: [0.2, 0.3], ...tu }, [-1, 0]);
  m.ver("sofi", [SOFI_S[0], SOFI_S[1], SOFI_S[2] + recarga * 0.1], { ...luz, sentado: 1, ...sofi }, [-1, 0], -recarga * 0.2);
};
const DOS = (dist: number, fov: number): Cam => c([1.0 - dist, 1.05, 0.68], [1.0, 0.95, 0.68], fov);
const CERCA = (q: V3, dist: number, fov: number): Cam => c([q[0] - dist, q[1] + 0.02, q[2] + 0.06], [q[0], q[1] - 0.13, q[2]], fov);
const PUERTA_DENTRO = (dist: number, fov: number, dz = 0, y = 1.35): Cam => c([V.x - dist, y, ZC + dz], [V.x, y - 0.05, ZC + dz * 0.9], fov);
const REGLAS_CAM = (dist: number, y: number, fov: number): Cam => c([6.86 - dist, y + 0.05, -4], [6.86, y, -4], fov);
const VENTANA = (m: Mundo) => void m; // (reservado)

const PLANOS: Plano[] = [
  // 0 · Imagina que corres por la estación del metro con tu hermana Sofi de la mano.
  { w: 0, lugar: "estacion", foco: 3.2, cInf: 6, sacude: () => 0.01, ini: c([2.8, 1.1, CARRERA(0) + 2.6], [2.9, 1.0, CARRERA(0) - 2], 52), fin: c([2.8, 1.1, CARRERA(fw(15)) + 2.6], [2.9, 1.0, CARRERA(fw(15)) - 2], 50), hacer: ({ f, m }) => { CORREN(m, f, CARRERA(f)); PERSIGUEN(m, f, CARRERA(f), 4); } },
  // 1 · Los zombies bajan por las escaleras eléctricas detrás de ustedes.
  { w: 15, lugar: "estacion", foco: 6, cInf: 6, ini: c([2.3, 1.6, -9.5], [4.9, 2.0, -16.5], 50), fin: c([2.4, 1.5, -10.2], [4.9, 1.8, -16.5], 48), hacer: ({ f, m }) => { m.escaleraZombies(f); } },
  // 2 · Suena el silbato. El último tren está cerrando sus puertas.  (el tren con las puertas abiertas; ustedes corren hacia él)
  { w: 25, lugar: "estacion", foco: 6, cInf: 6, ini: c([5.6, 1.7, 10.5], [1.6, 1.0, 0.5], 50), fin: c([5.4, 1.6, 9.8], [1.6, 1.0, 1.0], 48), hacer: ({ f, m }) => { const z = lerp(-3.5, 0.6, suave(fw(25) - 2, fw(35), f)); CORREN(m, f, z, 2.6); PERSIGUEN(m, f, z - 3, 4); m.luzPuerta = true; } },
  // 3 · Saltas al vagón.  (desde adentro: entras de un brinco)
  { w: 35, lugar: "estacion", foco: 2.4, cInf: 7, rapido: true, ini: c([-0.9, 1.45, 5.6], [1.2, 1.1, 2.9], 50), fin: c([-0.8, 1.42, 5.3], [1.2, 1.1, 2.9], 48), hacer: ({ f, k, m }) => { const u = empuje(Math.min(1, k * 1.6), 2); m.ver("tu", [lerp(2.4, 0.55, u), 0.35 * Math.sin(u * Math.PI), ZC + 0.15], { ...VAGON, ...MIEDO(f, 0.3), boca: "dientes", sudor: 0.8, brazoIzq: [1.6, 0.3], brazoDer: [0.9, 0.8], piernas: u < 0.9 ? [0.8, 0.3] : [0, 0] }, [-1, 0]); m.ver("sofi", [2.6, 0, ZC - 0.25], { ...ANDEN, ...MIEDO(f, 0.6), boca: "grito", brazoIzq: [2.0, 0.3], lagrimas: 0.6 }, [-1, 0]); } },
  // 4 · Jalas a Sofi.
  { w: 38, lugar: "estacion", foco: 2.2, cInf: 7, ini: c([-0.7, 1.3, 1.4], [1.0, 1.0, 3.35], 54), fin: c([-0.65, 1.3, 1.55], [1.0, 1.0, 3.35], 52), hacer: ({ f, k, m }) => { const u = empuje(Math.min(1, k * 1.4), 2); m.ver("tu", [0.7 - 0.1 * u, 0, ZC + 0.6], { ...VAGON, ...MIEDO(f, 0.3), boca: "dientes", brazoDer: [lerp(1.7, 1.1, u), -0.2], agacha: 0.3 }, [1, 0]); m.ver("sofi", [lerp(2.2, 0.85, u), 0.2 * Math.sin(u * Math.PI), ZC - 0.25], { ...VAGON, ...MIEDO(f, 0.6), boca: "grito", brazoIzq: [1.6, 0.2], lagrimas: 0.6, piernas: u < 0.9 ? [0.7, 0.2] : [0, 0] }, [-1, 0]); PERSIGUEN(m, f, 0.5, 3); } },
  // 5 · Las puertas se cierran...  (de cerca: las hojas se juntan; atrás vienen corriendo)
  { w: 41, lugar: "estacion", foco: 1.6, cInf: 7, ini: PUERTA_DENTRO(2.3, 50, 0.3), fin: PUERTA_DENTRO(2.1, 48, 0.25), hacer: ({ f, m }) => { m.ver("z1", [2.6 + 0.8 * (1 - suave(fw(41), fw(45), f)), brinco(f, 1), ZC + 0.1], { ...ANDEN, ...ZOMBI(f, 1), ...CORRE_Z(f, 1) }, [-1, 0], tambalea(f, 1)); m.ver("z3", [3.7, brinco(f, 3), ZC - 0.6], { ...ANDEN, ...ZOMBI(f, 3), ...CORRE_Z(f, 3) }, [-1, 0], tambalea(f, 3)); } },
  // 6 · y un brazo se mete entre ellas.
  { w: 45, lugar: "estacion", foco: 1.3, cInf: 7, sacude: (f) => golpeCam(f, HAY_BRAZO(), 0.04, 10), ini: PUERTA_DENTRO(1.7, 46, 0.5, 1.2), fin: PUERTA_DENTRO(1.6, 44, 0.45, 1.2), hacer: ({ f, m }) => { m.ver("z1", [1.72, 0, ZC + 0.08], { ...ANDEN, ...ZOMBI(f, 1), boca: "grito", brazoIzq: [2.4, 0.2], brazoDer: [1.6, 0.2] }, [-1, 0]); m.cartas.z1.contacto.visible = false; m.brazoEn(f, 0.15, 0); } },
  // 7 · Los dedos te agarran la mochila.
  { w: 52, lugar: "estacion", foco: 1.6, cInf: 7, sacude: () => 0.008, ini: c([-0.35, 1.4, 4.3], [1.1, 1.25, 3.25], 46), fin: c([-0.3, 1.38, 4.15], [1.1, 1.25, 3.25], 44), hacer: ({ f, k, m }) => { m.ver("tu", [1.0, 0, ZC + 0.42], { ...VAGON, ...MIEDO(f, 0.7), boca: "grito", sudor: 1, mirarX: 0.6, brazoIzq: [1.0, 0.6], brazoDer: [0.5, 0.4], cuerpoX: -0.08 }, [-1, 0]); m.brazoEn(f, 0.22 * empuje(k * 2, 2), 1); m.ver("sofi", [0.2, 0, ZC + 1.25], { ...VAGON, ...MIEDO(f, 0.6), boca: "grito", lagrimas: 0.8, brazoIzq: [1.6, -0.6], brazoDer: [1.6, -0.6] }, [1, 0]); } },
  // 8 · Le pegas con el extintor.
  { w: 58, lugar: "estacion", foco: 1.4, cInf: 7, sacude: (f) => golpeCam(f, fw(59) + 2, 0.06, 12), ini: c([-0.2, 1.3, 1.6], [1.1, 1.1, 3.3], 50), fin: c([-0.15, 1.3, 1.75], [1.1, 1.1, 3.3], 48), hacer: ({ f, k, m }) => { m.ver("tu", [0.85, 0, ZC + 0.75], { ...VAGON, ...MIEDO(f, 0.4), boca: "dientes", sudor: 1, mirarX: 0.7, brazoIzq: [2.4, -0.4], brazoDer: [2.4, -0.4] }, [-1, 0]); m.golpe(f, k); m.brazoEn(f, 0.25, 1); } },
  // 9 · El brazo se suelta.
  { w: 63, lugar: "estacion", foco: 1.4, cInf: 7, ini: PUERTA_DENTRO(1.4, 46, 0.12), fin: PUERTA_DENTRO(1.3, 44, 0.1), hacer: ({ f, k, m }) => { m.brazoEn(f, -0.5 * empuje(k * 1.5, 2), 0); if (f < SUELTA() + 4) m.ver("z1", [1.75, 0, ZC + 0.08], { ...ANDEN, ...ZOMBI(f, 1), boca: "grito", brazoIzq: [2.4, 0.2] }, [-1, 0]); else m.ver("z1", [1.75, 0, ZC + 0.05], { ...ANDEN, ...ZOMBI(f, 1), boca: "abierta", brazoIzq: [2.6, 0.1], brazoDer: [2.6, 0.1] }, [-1, 0]); m.cartas.z1.contacto.visible = false; } },
  // 10 · El tren arranca.  (desde el andén: el tren se va; los zombies corren junto a él)
  { w: 67, lugar: "estacion", foco: 7, cInf: 6, ini: c([3.0, 1.6, -9.5], [1.4, 1.3, 2.0], 50), fin: c([3.0, 1.6, -9.5], [1.4, 1.3, 6.0], 48), hacer: ({ f, m }) => { const z = trenZ(f); PERSIGUEN(m, f, z + 4, 6); m.zombiesPegados(f, z); } },
  // 11 · Afuera, cientos de caras golpean las ventanas.  (desde adentro, las ventanas llenas)
  { w: 70, lugar: "estacion", foco: 2.6, cInf: 7, sacude: () => 0.008, ini: c([-0.75, 1.38, -0.75], [1.4, 1.36, -0.75], 50), fin: c([-0.5, 1.37, -0.75], [1.4, 1.36, -0.75], 48), hacer: ({ f, m }) => { m.multitudVentana(f);  } },
  // 12 · Diez minutos después, el tren se detiene en un túnel.  (por fuera: el tren llega frenando, con los faros)
  { w: 77, lugar: "tunel", foco: 8, cInf: 6, ini: c([-1.2, 0.9, 19], [0.2, 1.1, 8], 46), fin: c([-1.1, 0.95, 18.2], [0.2, 1.1, 8], 46), hacer: ({ f, m }) => { m.llega(f); } },
  // 13 · Hay gente con lámparas. Es un refugio.  (el andén del refugio, visto desde la puerta abierta)
  { w: 87, lugar: "refugio", foco: 4, cInf: 7, ini: c([0.4, 1.5, ZC - 0.1], [5.2, 1.0, 4.4], 52), fin: c([0.7, 1.5, ZC - 0.1], [5.2, 1.0, 4.0], 50), hacer: ({ f, m }) => { m.puertas = 1; m.genteRefugio(f, false); } },
  // 14 · En la pared del andén, tres reglas.
  { w: 94, lugar: "refugio", foco: 6, cInf: 6, ini: REGLAS_CAM(5.0, 1.7, 40), fin: REGLAS_CAM(4.7, 1.7, 40), hacer: ({ m }) => { m.puertas = 1; } },
  // 15 · Regla número uno: las luces se apagan a las diez.
  { w: 101, lugar: "refugio", foco: 4, cInf: 6, ini: REGLAS_CAM(3.9, 2.2, 38), fin: REGLAS_CAM(3.6, 2.2, 38), hacer: ({ m }) => { m.puertas = 1; } },
  // 16 · En la oscuridad, nadie habla.  (los que duermen en los catres, con el dedo en la boca)
  { w: 111, lugar: "refugio", foco: 4, cInf: 6, ini: c([2.6, 1.55, 1.2], [5.6, 0.7, 5.4], 48), fin: c([2.7, 1.5, 1.6], [5.6, 0.7, 5.4], 46), hacer: ({ f, m }) => { m.puertas = 1; m.genteRefugio(f, true); } },
  // 17 · Regla número dos: nadie camina por las vías.
  { w: 116, lugar: "refugio", foco: 4, cInf: 6, ini: REGLAS_CAM(3.9, 1.62, 38), fin: REGLAS_CAM(3.6, 1.62, 38), hacer: ({ m }) => { m.puertas = 1; } },
  // 18 · (las vías que se pierden en lo oscuro del túnel, delante del tren)
  { w: 119, lugar: "refugio", foco: 6, cInf: 6, ini: c([0.0, 0.4, 10.5], [0.0, -0.4, 24], 50), fin: c([0.0, 0.35, 11.0], [0.0, -0.4, 24], 48), hacer: ({ m }) => { m.puertas = 1; m.viasOscuras = true; } },
  // 19 · Regla número tres: después de la sirena, nadie se sube al tren.
  { w: 124, lugar: "refugio", foco: 4, cInf: 6, ini: REGLAS_CAM(3.9, 1.1, 38), fin: REGLAS_CAM(3.6, 1.1, 38), hacer: ({ m }) => { m.puertas = 1; } },
  // 20 · Aunque sea de tu familia.  (tú miras a Sofi)
  { w: 136, lugar: "refugio", foco: 1.4, cInf: 8, ini: CERCA(TU_S_CARA, 1.55, 36), fin: CERCA(TU_S_CARA, 1.4, 34), hacer: ({ f, m }) => { SENTADOS(m, f, CALIDA, { mirarX: 0.6, mirarY: 0.2, cejasMiedo: 0.6, boca: "linea", ...tiembla(f, 0.2) }, { parpadeo: true }); m.soloTu(); m.vagonTenue(); } },
  // 21 · Sofi se queda dormida en tu hombro.
  { w: 141, lugar: "refugio", foco: 1.9, cInf: 7, ini: DOS(2.1, 40), fin: DOS(1.95, 40), hacer: ({ f, k, m }) => { SENTADOS(m, f, CALIDA, { mirarX: 0.4, mirarY: 0.3, boca: "linea", cejasMiedo: 0.4 }, { parpadeo: f > fw(144), boca: "linea" }, suave(0, 0.6, k)); m.vagonTenue(); } },
  // 22 · Tú no puedes cerrar los ojos.
  { w: 148, lugar: "refugio", foco: 1.4, cInf: 8, ini: CERCA(TU_S_CARA, 1.5, 36), fin: CERCA(TU_S_CARA, 1.3, 33), hacer: ({ f, m }) => { SENTADOS(m, f, CALIDA, { ...MIEDO(f, 0.3), mirarX: -0.3, mirarY: 0.1, boca: "linea", ojeras: 1, parpadeo: false }, { parpadeo: true }, 1); m.soloTu(); m.vagonTenue(); } },
  // 23 · A las diez suena la sirena.  (el faro rojo en la columna)
  { w: 154, lugar: "refugio", foco: 3, cInf: 6, ini: c([2.6, 2.4, 2.2], [4.4, 3.05, -0.53], 44), fin: c([2.8, 2.5, 1.8], [4.4, 3.05, -0.53], 40), hacer: ({ m }) => { m.puertas = 0; } },
  // 24 · Se apagan las luces.
  { w: 160, lugar: "refugio", foco: 1.9, cInf: 7, ini: DOS(2.0, 40), fin: DOS(1.9, 40), hacer: ({ f, m }) => { SENTADOS(m, f, f >= APAGON() ? OSCURO : CALIDA, { ...MIEDO(f, 0.3), mirarX: 0.3, mirarY: 0.4, boca: "linea" }, { parpadeo: true, boca: "linea" }, 1); m.vagonTenue(); } },
  // 25 · Por la ventanilla ves una lámpara que se acerca por las vías.  (por detrás de ti, hacia el andén oscuro)
  { w: 164, lugar: "refugio", foco: 6, cInf: 6, ini: c([-0.6, 1.5, 1.6], [3.0, 1.0, -6], 44), fin: c([-0.5, 1.48, 1.4], [3.0, 1.0, -6], 42), hacer: ({ f, m }) => { m.vagonTenue(); m.mamaCorre(f, false); m.ver("tu", [0.95, 0, 0.95], { ...OSCURO, mirarX: 0.6 }, [1, -0.3]); } },
  // 26 · Alguien viene corriendo.  (en el andén: la lámpara se acerca)
  { w: 176, lugar: "refugio", foco: 5, cInf: 6, ini: c([3.6, 1.3, 9.5], [3.2, 1.1, -3], 46), fin: c([3.6, 1.3, 9.0], [3.2, 1.1, -1], 44), hacer: ({ f, m }) => { m.mamaCorre(f, true); } },
  // 27 · Es tu mamá.  (su cara en la ventanilla de la puerta, alumbrada por su lámpara)
  { w: 179, lugar: "refugio", foco: 1.6, cInf: 7, ini: PUERTA_DENTRO(1.65, 40, 0.31, 1.33), fin: PUERTA_DENTRO(1.45, 38, 0.31, 1.33), hacer: ({ f, m }) => { m.vagonTenue(); m.mama(f, { boca: "abierta", bocaAbre: 0.5 + 0.4 * Math.sin(f * 0.5), cejasMiedo: 0.8, lagrimas: 0.5, ...tiembla(f, 0.4), respira: 0.5 + 0.5 * Math.sin(f * 0.6) }); } },
  // 28 · Trae la ropa rota, pero está viva.  (en el andén, de cuerpo entero)
  { w: 182, lugar: "refugio", foco: 2.6, cInf: 7, ini: c([4.2, 1.25, ZC + 2.2], [1.8, 0.95, ZC + 0.31], 42), fin: c([4.0, 1.25, ZC + 2.0], [1.8, 0.95, ZC + 0.31], 40), hacer: ({ f, m }) => { m.mama(f, { boca: "abierta", bocaAbre: 0.5 + 0.4 * Math.sin(f * 0.5), cejasMiedo: 0.8, sudor: 1, mirarX: -0.6, ...tiembla(f, 0.4), respira: 0.5 + 0.5 * Math.sin(f * 0.6) }, true); } },
  // 29 · Golpea la puerta.
  { w: 189, lugar: "refugio", foco: 1.6, cInf: 7, sacude: (f) => golpeCam(f, fw(189) + 3, 0.02, 6) + golpeCam(f, fw(189) + 11, 0.02, 6), ini: PUERTA_DENTRO(1.7, 42, 0.31, 1.3), fin: PUERTA_DENTRO(1.6, 42, 0.31, 1.3), hacer: ({ f, m }) => { m.vagonTenue(); const g = Math.abs(Math.sin((f - fw(189)) * 0.4)); m.mama(f, { boca: "grito", cejasMiedo: 1, lagrimas: 0.8, brazoIzq: [2.3 + 0.2 * g, -0.4], brazoDer: [2.3 + 0.2 * g, -0.4] }); } },
  // 30 · «¡Ábreme, hijo! ¡Ya vienen!»
  { w: 192, lugar: "refugio", foco: 1.3, cInf: 8, ini: PUERTA_DENTRO(1.3, 36, 0.31, 1.33), fin: PUERTA_DENTRO(1.15, 34, 0.31, 1.33), hacer: ({ f, m }) => { m.vagonTenue(); m.mama(f, { boca: "abierta", bocaAbre: Math.max(habla(f, 192, 193), habla(f, 194, 195)), cejasMiedo: 1, lagrimas: 1, mirarX: -0.2, brazoIzq: [2.3, -0.4], brazoDer: [2.3, -0.4], ...tiembla(f, 0.6) }); } },
  // 31 · El guardia te mira y niega con la cabeza.
  { w: 196, lugar: "refugio", foco: 1.8, cInf: 7, ini: c([1.0, 1.45, 6.0], [-0.6, 1.3, 4.2], 42), fin: c([0.95, 1.45, 5.8], [-0.6, 1.3, 4.2], 40), hacer: ({ f, m }) => { m.vagonTenue(); const n = f >= fw(201) ? Math.sin((f - fw(201)) * 0.45) : 0; m.ver("guardia", [-0.6, 0, 4.2], { ...CALIDA, mirarX: 0.6, mirarY: 0.1, boca: "linea", cejasAlto: -0.3, brazoDer: [1.25, -0.3], giro: 0.3 * n, cabezaX: 0.05 * n }, [1, 0]); m.linternaGuardia(); } },
  // 32 · ¿Le abres la puerta...
  { w: 205, lugar: "refugio", foco: 1.4, cInf: 8, ini: c([-0.75, 1.32, ZC + 0.75], [0.75, 1.22, ZC + 0.55], 38), fin: c([-0.65, 1.31, ZC + 0.72], [0.75, 1.22, ZC + 0.55], 35), hacer: ({ f, m }) => { m.vagonTenue(); m.ver("tu", [0.75, 0, ZC + 0.55], { ...CALIDA, ...MIEDO(f, 0.6), mirarX: 0.8, boca: "linea", sudor: 1, lagrimas: 0.4, parpadeo: false }); } },
  // 33 · o la dejas afuera?  (tú junto a la puerta; ella del otro lado del vidrio)
  { w: 209, lugar: "refugio", foco: 1.9, cInf: 7, ini: c([-0.75, 1.35, ZC + 1.6], [1.2, 1.2, ZC + 0.6], 48), fin: c([-0.7, 1.35, ZC + 1.5], [1.2, 1.2, ZC + 0.6], 46), hacer: ({ f, m }) => { m.vagonTenue(); m.ver("tu", [0.55, 0, ZC + 1.35], { ...CALIDA, ...MIEDO(f, 0.6), mirarX: -0.9, boca: "linea", sudor: 1, brazoDer: [1.4, -0.2] }); m.mama(f, { boca: "abierta", bocaAbre: 0.4 + 0.4 * Math.sin(f * 0.5), cejasMiedo: 1, lagrimas: 1, brazoIzq: [2.3, -0.4], brazoDer: [2.3, -0.4] }); } },
];
void VENTANA;
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

// ------------------------------------------------------------------ mundo (estado por cuadro)
class Mundo {
  h = crearMetro();
  x = crearExtras(this.h.anden, this.h.nos.g);
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  f = 0;
  luzPuerta = false; puertas = -1; viasOscuras = false; tenue = false;
  private cam!: THREE.PerspectiveCamera;
  private tiras: THREE.MeshBasicMaterial[] = [];
  amb = new THREE.AmbientLight("#8a9cb8", 0.5);
  hemi = new THREE.HemisphereLight("#8fa4c8", "#2a2620", 0.7);
  luzFrente = new THREE.SpotLight("#fff0c8", 0, 40, 0.5, 0.6, 1.2);
  constructor() {
    this.h.raiz.add(this.amb, this.hemi);
    this.h.tren.add(this.luzFrente, this.luzFrente.target); this.luzFrente.position.set(0, 0.8, 9.3); this.luzFrente.target.position.set(0, 0, 25);
    for (const c of Object.values(this.cartas)) { this.h.raiz.add(c.grupo); c.sombraLarga.visible = false; }
    this.h.atras.g.visible = false; this.h.palanca.visible = false;
    this.h.nos.g.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial; if (m && m.type === "MeshBasicMaterial" && m.color && m.color.getHexString() === "fff0c2") this.tiras.push(m); });
    this.h.mapa.dibujar((c, w, h) => { c.fillStyle = "#f2efe6"; c.fillRect(0, 0, w, h); c.fillStyle = "#c27a2c"; c.fillRect(0, 0, w, 34); c.fillStyle = "#fff"; c.font = "bold 24px 'DejaVu Sans', sans-serif"; c.fillText("LÍNEA 3", 16, 25); c.strokeStyle = "#c27a2c"; c.lineWidth = 12; c.beginPath(); c.moveTo(80, 100); c.lineTo(w - 80, 100); c.stroke(); ["CENTRAL", "OBRERA", "LOS PINOS", "REFUGIO 4"].forEach((n, i) => { const x = 80 + i * (w - 160) / 3; c.fillStyle = "#fff"; c.strokeStyle = "#3a2a1a"; c.lineWidth = 4; c.beginPath(); c.arc(x, 100, 14, 0, 7); c.fill(); c.stroke(); c.fillStyle = "#3a2a1a"; c.font = "bold 20px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText(n, x, 158); }); });
    this.h.led.dibujar((c, w, h) => { c.fillStyle = "#120a06"; c.fillRect(0, 0, w, h); c.fillStyle = "#ff8a2a"; c.font = "bold 70px 'DejaVu Sans Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("SERVICIO DE EMERGENCIA", w / 2, h / 2 + 4); });
    this.h.letreros.forEach((m) => { (m.material as THREE.MeshLambertMaterial).map = texTexto("ESTACIÓN CENTRAL", "#c27a2c", "#ffffff", 512, 96, "bold 40px 'DejaVu Sans', sans-serif"); });
  }
  reiniciar(cam: THREE.PerspectiveCamera) {
    this.cam = cam;
    for (const c of Object.values(this.cartas)) { c.grupo.visible = false; c.contacto.visible = true; c.grupo.rotation.set(0, 0, 0); }
    this.luzPuerta = false; this.puertas = -1; this.viasOscuras = false; this.tenue = false;
    const x = this.x; x.brazo.visible = false; x.extMano.visible = false; x.extSoporte.visible = true; x.multitud.visible = false; x.lamMama.visible = false; x.luzMama.intensity = 0;
    this.h.tren.position.z = 0; this.h.anden.position.z = 0;
  }
  ver(quien: Quien, pos: V3, pose: Partial<Pose>, mira?: [number, number], giro = 0) {
    const c = this.cartas[quien], cp = this.cam.position;
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.set(0, Math.atan2(cp.x - pos[0], cp.z - pos[2]), giro);
    const espalda = mira ? (cp.x - pos[0]) * mira[0] + (cp.z - pos[2]) * mira[1] < 0 : false;
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[0] * 3), ...pose, ...(espalda ? { vista: "espalda" as const } : {}) });
    if (pos[1] > 0.25) c.contacto.visible = false;
  }
  soloTu() { this.cartas.sofi.grupo.visible = false; }
  vagonTenue() { this.tenue = true; }
  /** zombies bajando por la escalera eléctrica (y se juntan abajo) */
  escaleraZombies(f: number) {
    const E = this.x.ESCALERA;
    ZS.forEach((q, i) => {
      const z = E.z0 - 7.6 + ((f * 0.06 + i * 1.35) % 9.2), sobre = z < E.z0;
      const y = sobre ? (E.z0 - z) * E.pend : 0;
      this.ver(q, [E.x + (i % 2 ? 0.25 : -0.25), y + brinco(f, i) * 0.6, z], { ...ANDEN, ...ZOMBI(f, i), ...CORRE_Z(f, i, 0.6) }, [0, 1], tambalea(f, i));
      this.cartas[q].contacto.visible = !sobre;
    });
  }
  /** el brazo entre las puertas: `alarga` m hacia adentro; `agarra` 0 … 1 cierra los dedos */
  brazoEn(f: number, alarga: number, agarra: number) {
    const b = this.x.brazo; b.visible = true;
    b.position.set(V.x - 0.05 - alarga, 1.02 + 0.03 * Math.sin(f * 0.7), ZC + 0.02 + 0.04 * Math.sin(f * 0.53));
    b.rotation.set(0.1 * Math.sin(f * 0.6), 0.25 * Math.sin(f * 0.37), -0.08);
    this.x.dedos.forEach((d, i) => (d.rotation.z = -agarra * (0.9 + 0.1 * i) - 0.25 * (1 - agarra) * Math.abs(Math.sin(f * 0.5 + i))));
  }
  /** el extintor: lo levantas y le pegas al brazo (golpe a la mitad del plano) */
  golpe(f: number, k: number) {
    const e = this.x.extMano; e.visible = true; this.x.extSoporte.visible = false;
    const u = k < 0.45 ? -0.9 * suave(0, 0.45, k) : -0.9 + 1.5 * empuje((k - 0.45) / 0.15, 3);
    e.position.set(0.95, 1.3, ZC + 0.32); e.rotation.set(Math.min(0.5, u) - 0.6, 0, 0); // se levanta hacia atrás y baja de golpe sobre el brazo
    void f;
  }
  /** zombies que golpean las ventanas mientras el tren arranca */
  zombiesPegados(f: number, tz: number) { void f; void tz; }
  multitudVentana(f: number) {
    // atrás, la multitud sencilla (lejos y chiquita); pegados al vidrio, los zombies con detalle (los mismos de toda la historia)
    const x = this.x; x.multitud.visible = false; // (la multitud sencilla ya no: el usuario la vio simple; todos con detalle)
    const t = Math.max(0, f - ARRANCA()) / FPS, corre = 0.33 * t * t;
    x.multitud.position.set(1.8, 0.75, -corre); // más atrás y más arriba: de la multitud sencilla solo se ven las manos levantadas
    x.filas.forEach((p, i) => { p.position.y = 2.05 - Math.floor(i / 4) * 0.12 + 0.06 * Math.sin(f * 0.35 + i * 1.7); });
    ZS.forEach((q, i) => {
      let z = -2.2 + i * 0.62 - corre * 0.5; while (z < -2.3) z += 3.72;
      const golpe = Math.abs(Math.sin(f * 0.45 + i * 1.3));
      this.ver(q, [V.x + 0.2 + (i % 2) * 0.12, 0.08 + 0.05 * golpe, z], { ...ANDEN, ...ZOMBI(f, i), boca: i % 2 ? "grito" : "abierta", brazoIzq: [2.75 - 0.2 * golpe, 0.05], brazoDer: [2.75 - 0.2 * Math.abs(Math.sin(f * 0.45 + i * 1.3 + 1.5)), 0.05] }, [-1, 0], tambalea(f, i) * 0.5);
      this.cartas[q].contacto.visible = false;
    });
    (["z7", "z8", "z9"] as Quien[]).forEach((q, i) => { // segunda fila, un poco más atrás y más arriba
      let z = -1.9 + i * 1.24 - corre * 0.45; while (z < -2.3) z += 3.72;
      this.ver(q, [V.x + 0.85, 0.3 + 0.05 * Math.abs(Math.sin(f * 0.4 + i)), z], { ...ANDEN, ...ZOMBI(f, i + 6), boca: "grito", brazoIzq: [2.8, 0.05], brazoDer: [2.6, 0.1] }, [-1, 0]);
      this.cartas[q].contacto.visible = false;
    });
  }
  /** el tren llega al refugio frenando (visto desde el túnel) */
  llega(f: number) {
    const a = fw(77) - 2, t = Math.min(1, (f - a) / (fw(87) - a));
    this.h.tren.position.z = -14 * (1 - t) * (1 - t);
  }
  puertasA(a: number) {
    for (const hj of this.h.nos.hojas) { if (hj.s < 0) continue; const o = Math.min(1, Math.max(0, a)); hj.g.position.z = hj.z + hj.h * 0.6 * o; hj.g.position.x = hj.s * (V.x - 0.01) + hj.s * 0.06 * Math.min(1, o * 6); }
  }
  genteRefugio(f: number, duermen: boolean) {
    const L: [Quien, V3][] = [["senora", [5.6, 0.36, 3.0]], ["senor", [5.6, 0.36, 5.4]], ["joven", [5.6, 0.36, 7.8]]];
    L.forEach(([q, p], i) => this.ver(q, duermen ? p : [3.0 + i * 0.9, 0, 2.2 + i * 1.6], duermen ? { ...CALIDA, sentado: 1, parpadeo: true, boca: "linea", cabezaX: i % 2 ? 0.12 : -0.1, hombros: 0.4, respira: 0.5 + 0.5 * Math.sin(f * 0.07 + i) } : { ...CALIDA, mirarX: -0.6, cejasMiedo: 0.4, boca: "linea", brazoDer: [1.25, -0.2] }, [-1, 0]));
    if (!duermen) this.ver("guardia", [3.6, 0, 6.2], { ...CALIDA, mirarX: -0.7, boca: "linea", brazoDer: [1.3, -0.2], cejasAlto: -0.3 }, [-1, 0]);
  }
  /** tu mamá corriendo por el andén hacia la puerta, con su lámpara */
  mamaCorre(f: number, cerca: boolean) {
    const z = MAMA_LLEGA(f), x = cerca ? 2.6 : 2.4;
    this.ver("mama", [x, brinco(f, 2, 0.8), z], { ...CALIDA, ...MIEDO(f, 0.4), boca: "abierta", bocaAbre: 0.6, ...CORRE(f, 2, 0.8), brazoDer: [1.6, 0.2] }, [0, 1]);
    this.lampara(x + 0.25, 0.75, z + 0.1);
  }
  lampara(x: number, y: number, z: number) { const l = this.x.lamMama; l.visible = true; l.position.set(x, y, z); this.x.luzMama.intensity = 2.6; }
  mama(f: number, pose: Partial<Pose>, deFrente = false) {
    this.ver("mama", MAMA_P, { ...CALIDA, ...pose }, deFrente ? undefined : [-1, 0]);
    this.lampara(MAMA_P[0] + 0.3, 0.7, MAMA_P[2] + 0.4);
    void f;
  }
  linternaGuardia() { /* su linterna alumbra hacia ti */ }
  luces(f: number, pl: Plano) {
    const h = this.h, x = this.x, est = pl.lugar === "estacion", ref = pl.lugar === "refugio", tun = pl.lugar === "tunel";
    // andén: estación o refugio; en el túnel no hay
    h.anden.visible = !tun; h.muroDer.visible = tun; h.banqueta.visible = tun; h.lamparas.visible = tun || this.viasOscuras; h.luzTunel.visible = tun;
    x.escalera.visible = est; x.refugio.visible = ref;
    h.letreros.forEach((m) => (m.visible = est));
    if (est) h.tren.position.z = f >= ARRANCA() && pl.w >= 67 && pl.w < 70 ? trenZ(f) : 0;
    if (tun) { const off = -((f / FPS) * 6 % 3.5); h.lamparas.position.z = off; h.luzTunel.position.set(-1.8, 1.6, 9 + off); }
    // tubos del andén: prendidos en la estación; en el refugio apagados (solo linternas y la sirena)
    h.lamparasA.forEach(({ tubo, halo }) => { (tubo.material as THREE.MeshBasicMaterial).color.set(est ? "#f2f6ff" : "#22262a"); halo.visible = est; });
    const [l1, l2] = h.luzAnden; l1.intensity = est ? 2.4 : 0; l2.intensity = est ? 2.0 : 0; l1.position.set(3.4, 3.4, 2); l2.position.set(3.4, 3.4, -10); l1.distance = l2.distance = 12;
    // sirena (desde «suena la sirena»): faro que late
    const sir = ref && f >= SIRENA() ? 0.5 + 0.5 * Math.sin((f - SIRENA()) * 0.35) : 0;
    (x.faro.material as THREE.MeshBasicMaterial).color.setRGB(0.3 + 0.7 * sir, 0.05, 0.05); x.haloSir.material.opacity = 0.8 * sir; x.luzSir.intensity = 6 * sir;
    // apagón del refugio: las linternas se apagan
    const apagado = ref && f >= APAGON();
    x.luzRef.forEach((l, i) => (l.intensity = apagado ? 0 : [3.0, 2.4, 2.0][i]));
    x.linternas.forEach((l) => l.children.forEach((o) => { const m = (o as THREE.Mesh).material as THREE.MeshBasicMaterial; if (m && m.type === "MeshBasicMaterial") m.color.set(apagado ? "#2a2620" : "#ffd89a"); if ((o as THREE.Sprite).isSprite) o.visible = !apagado; }));
    this.amb.intensity = est ? 0.55 : tun ? 0.35 : apagado ? 0.16 : 0.3; this.hemi.intensity = est ? 0.8 : tun ? 0.5 : apagado ? 0.2 : 0.45;
    this.luzFrente.intensity = tun ? 14 : 0;
    if (tun) { const fr = this.h.luzTunel; fr.position.set(0.8, 1.6, 12); fr.intensity = 4; fr.distance = 12; }
    // vagón: luces normales; en el refugio, tenues; tras el apagón, casi nada
    const vl = est || tun ? 1 : apagado ? 0.06 : this.tenue ? 0.35 : 0.5;
    h.nos.luces.forEach((l) => (l.intensity = 1.1 * vl));
    this.tiras.forEach((m) => m.color.set(vl > 0.8 ? "#fff0c2" : vl > 0.2 ? "#8a7a5a" : "#1e1c18"));
    // puertas
    this.puertasA(this.puertas >= 0 ? this.puertas : est ? abiertas(f) : 0);
    // luz roja de «puertas cerrando»
    void this.luzPuerta;
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
const PORTADA: Plano = PLANOS[6];

const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? fw(49) : f0;
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

  const i = planoEn(f);
  const pl = portada ? PORTADA : PLANOS[i];
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : TREN_CUADROS;
  const k0 = portada ? 1 : (f - a) / Math.max(1, b - a);
  const k = pl.rapido ? empuje(k0, 3) : k0;
  const pos = pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3;
  const mira = pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3;
  mundo.f = f;
    const s = pl.sacude ? pl.sacude(f) : 0;
  if (s) { pos[0] += s * Math.sin(f * 1.3); pos[1] += s * Math.sin(f * 1.7 + 1); mira[0] += s * 1.5 * Math.sin(f * 1.1 + 2); } // ≈ 6 Hz: sacude sin vibrar cuadro a cuadro
  cam.position.set(...pos);
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.03; cam.far = 320; cam.updateProjectionMatrix();
  cam.lookAt(...mira);
  cam.updateMatrixWorld();
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  scene.background = new THREE.Color("#0a0f1c");
  scene.fog = new THREE.Fog("#0c1220", 9, 40);
  mundo.reiniciar(cam);
  pl.hacer({ f, k: k0, m: mundo });
  mundo.luces(f, pl);
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
  const reglas: [number, number, string][] = [[77, 87, "10 MINUTOS DESPUÉS"], [101, 116, "REGLA Nº 1"], [116, 124, "REGLA Nº 2"], [124, 141, "REGLA Nº 3"], [154, 160, "10:00 PM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "DÍA 3 · 9:15 PM · ESTACIÓN CENTRAL";
  if (f >= inicioPlano(2)) return null;
  const n = Math.round(Math.min(1, (f + 6) / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(205) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 36, padding: "12px 26px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
      {boton("ABRIR LA PUERTA", "#2f63d2", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("DEJARLA AFUERA", "#c8263a", 4)}
    </div>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.03, far: 320 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Tren: React.FC = () => {
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
// Portada: la mamá en la ventanilla de la puerta, de noche, con su lámpara.
export const TrenPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 1.1, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", bottom: 0, width: "100%", height: 620, background: "linear-gradient(#05070c00, #05070cee 50%)" }} />
      <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center" }}>
        {linea("DESPUÉS DE LA SIRENA,", "#ffffff", 84)}
        {linea("NADIE SUBE.", "#ffffff", 104)}
        {linea("NI TU MAMÁ", "#ffd23a", 112)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void hablaGestos;
