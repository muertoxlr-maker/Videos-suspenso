// «La ambulancia» — animación completa. Zombies. Gancho con acción desde el cuadro 0, en orden y sin adelantos
// (guía §1: «gancho con acción»): la historia empieza ya huyendo en la ambulancia. Mismo composer, tarjetas, capas de
// texto y acabado aprobado (§8.9: personajes ref7, lugares gastados, LUT frío, SIN capa de puntitos encima).
// La ambulancia no se mueve: corre la avenida (`avance`). En el mercado sí se mueve ella (llega y se estaciona).
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
import { POSE, Tarjeta, lerp, parpadea, ruido, suave } from "../turno3/comun";
import { empuje, hablaGestos, tiembla } from "../comun/movimiento";
import { AMB, AZOTEA, BANCA, CHOFER, ESCALERA, MERC, PARED_REGLAS, crearEscenario } from "./ambulancia";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const AMBULANCIA_CUADROS = Math.ceil(74.91 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes (todos ref7)
const TU: Aspecto = { piel: "#d6ae8c", pelo: "#2a1c16", ropa: "#2f4f7a", ropaInterior: "#e8e6e0", pantalon: "#263248", zapatos: "#1c1c20", peinado: "revuelto", cuello: "v", prenda: "uniforme", insignia: { tipo: "gafete" }, barba: "sombra", estilo: "ref7", semilla: 1001 };
const BETO: Aspecto = { piel: "#dcb490", pelo: "#5a3a22", ropa: "#c8482e", ropaInterior: "#f0e6d0", pantalon: "#3a4a6a", zapatos: "#e8e4dc", peinado: "rizado", cuello: "redondo", estilo: "ref7", semilla: 1003 };
const BETO_F: Aspecto = { ...BETO, piel: "#cdb7a2" }; // con fiebre: más pálido
const GUARDIA: Aspecto = { piel: "#b98a68", pelo: "#1e1a18", ropa: "#3e4a3a", ropaInterior: "#2a2a2a", pantalon: "#2e3238", zapatos: "#1a1a1a", peinado: "recogido", gorra: "#2a3a2e", prenda: "chamarra", barba: "candado", arrugas: true, estilo: "ref7", semilla: 1005 };
const SENORA: Aspecto = { piel: "#c99a78", pelo: "#5a5a5e", ropa: "#6a4a6a", ropaInterior: "#e0d8c8", pantalon: "#3a3440", zapatos: "#2a2224", peinado: "trenza", rebozo: "#8a5a3a", arrugas: true, estilo: "ref7", semilla: 1007 };
const SENOR: Aspecto = { piel: "#c49470", pelo: "#3a3a3c", ropa: "#7a6a4a", ropaInterior: "#e8e0d0", pantalon: "#4a4238", zapatos: "#2a2018", peinado: "recogido", sombrero: "#c9b48a", bigote: true, prenda: "camisa", arrugas: true, estilo: "ref7", semilla: 1009 };
const JOVEN: Aspecto = { piel: "#d2a482", pelo: "#1a1414", ropa: "#3a6a5a", ropaInterior: "#2a2a34", pantalon: "#2a3446", zapatos: "#d8d4cc", peinado: "largo", cuello: "capucha", estilo: "ref7", semilla: 1011 };
const zombi = (ropa: string, pantalon: string, pelo: string, peinado: Aspecto["peinado"], piel: string, semilla: number, extra: Partial<Aspecto> = {}): Aspecto => ({ piel, pelo, ropa, ropaInterior: "#3a3a36", pantalon, zapatos: "#2a2622", peinado, estilo: "ref7", semilla, ...extra });
const CARTAS = {
  tu: [TU, 1.62], beto: [BETO, 1.15], betoF: [BETO_F, 1.15], guardia: [GUARDIA, 1.76], senora: [SENORA, 1.52], senor: [SENOR, 1.66], joven: [JOVEN, 1.6],
  z1: [zombi("#56687a", "#3a3e48", "#2a2420", "revuelto", "#9a9fa8", 1021, { prenda: "camisa", zombi: 1 }), 1.68],
  z2: [zombi("#7a3e3a", "#2e3238", "#2a2226", "largo", "#a39aa8", 1023, { zombi: 2 }), 1.58],
  z3: [zombi("#4a6450", "#4a4238", "#1e1c1c", "recogido", "#8e9a9c", 1025, { prenda: "chamarra", gorra: "#7a2a2a", zombi: 3 }), 1.74],
  z4: [zombi("#6a6478", "#34383e", "#4a4440", "mono", "#a8a6a0", 1027, { cuello: "redondo", rebozo: "#5a6a4a", zombi: 4 }), 1.62],
  z5: [zombi("#8a7440", "#2a2e38", "#2a2420", "rizado", "#9098a8", 1029, { mandil: "#b8b0a0", sombrero: "#a89a78", zombi: 5 }), 1.7],
} as const;
type Quien = keyof typeof CARTAS;
const ALTO = (q: Quien) => CARTAS[q][1];
const ZS: Quien[] = ["z1", "z2", "z3", "z4", "z5"];
const LUNA: Partial<Pose> = { luzX: -1, borde: "#a8c0ff" };
const CALIDA: Partial<Pose> = { luzX: 1, borde: "#ffc888" }; // linternas de la azotea
const FRIA: Partial<Pose> = { luzX: -1, borde: "#c8d8ff" }; // plafón de la ambulancia

type V3 = [number, number, number];
const A = AMB, AZ = AZOTEA;
const CHOFER_P: V3 = [CHOFER.x, CHOFER.y, CHOFER.z];
const CHOFER_CARA: V3 = [CHOFER.x, CHOFER.y + 1.62 * 0.83, CHOFER.z];
const BETO_BANCA: V3 = [BANCA.x - 0.08, A.piso + 0.12, BANCA.z]; // sentado en la banca (la tarjeta sube para que la cadera quede en el cojín)
const BETO_CARA: V3 = [BETO_BANCA[0], BETO_BANCA[1] + 1.15 * 0.83 - 0.06, BETO_BANCA[2]];
const AMBU_X = 1.35; // estacionada frente al mercado
// en la azotea: sentados en los huacales contra el pretil del fondo
const LUG: V3 = [-5.6, AZ, MERC.z1 - 0.64];
const TU_S: V3 = [LUG[0] - 0.42, AZ, LUG[2]], BETO_S: V3 = [LUG[0] + 0.36, AZ + 0.11, LUG[2]];
const TU_S_CARA: V3 = [TU_S[0], AZ + 1.26, TU_S[2]], BETO_S_CARA: V3 = [BETO_S[0], AZ + 1.0, BETO_S[2]];

// ------------------------------------------------------------------ planos
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Lugar = "calle" | "mercado" | "azotea";
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; lugar: Lugar; rapido?: boolean; corte?: boolean; sacude?: (f: number) => number; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const golpeCam = (f: number, desde: number, fuerza: number, dura = 14) => (f >= desde && f < desde + dura ? fuerza * (1 - (f - desde) / dura) : 0);
const MIEDO = (f: number, k = 0.4): Partial<Pose> => ({ ojos: 1.1, pupila: 0.2, ojeras: 0.6, cejasMiedo: 0.8, ...tiembla(f, k) });
const ZOMBI = (f: number, n: number): Partial<Pose> => ({ ojosVacios: true, ojeras: 1, parpadeo: false, boca: "abierta", bocaAbre: 0.6 + 0.4 * Math.sin(f * 0.35 + n), cejasAlto: -0.3, cabezaX: 0.06 * Math.sin(f * 0.3 + n * 2) });
const CORRE = (f: number, n: number, v = 0.85): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v + n)), Math.max(0, -Math.sin(f * v + n))], brazoIzq: [1.5 + 0.25 * Math.sin(f * v + n), 0.3], brazoDer: [1.5 - 0.25 * Math.sin(f * v + n), 0.3] });
const brinco = (f: number, n: number, v = 0.85) => 0.07 * Math.abs(Math.sin(f * v + n));

// la ambulancia en la avenida: velocidad (m por cuadro) → metros recorridos
const FRENA = () => fw(38), ACELERA = () => fw(52);
const VEL = (f: number) => {
  const v0 = 17 / FPS, lento = 2.2 / FPS;
  if (f < FRENA()) return v0;
  if (f < FRENA() + 10) return lerp(v0, lento, ((f - FRENA()) / 10) ** 0.6);
  if (f < ACELERA()) return lento;
  return lerp(lento, v0, Math.min(1, (f - ACELERA()) / 24));
};
const AVANCE: number[] = [];
const avance = (f: number) => { const n = Math.max(0, Math.floor(f)); while (AVANCE.length <= n) AVANCE.push((AVANCE[AVANCE.length - 1] ?? 20) + VEL(AVANCE.length)); return AVANCE[n]; };
/** cabeceo del chasis: se clava al frenar y se levanta al acelerar */
const cabeceo = (f: number) => (f >= FRENA() && f < FRENA() + 26 ? 0.05 * Math.sin(Math.min(1, (f - FRENA()) / 5) * Math.PI / 2) * Math.exp(-Math.max(0, f - FRENA() - 5) / 9) : f >= ACELERA() && f < ACELERA() + 30 ? -0.025 * Math.sin((f - ACELERA()) / 30 * Math.PI) : 0);

/** tú al volante (visto por el parabrisas) */
const MANEJA = (m: Mundo, f: number, pose: Partial<Pose> = {}) => m.ver("tu", CHOFER_P, { ...LUNA, ...MIEDO(f, 0.3), boca: "dientes", sudor: 0.6, brazoIzq: [0.5, -0.9], brazoDer: [0.5, -0.9], ...pose }, [0, 1]);
/** zombies que persiguen a la ambulancia por la avenida (detrás y a los lados) */
const PERSIGUEN = (m: Mundo, f: number, lejos = 0, cuantos = 5) => {
  const L: [number, number][] = [[-2.3, -3.2], [2.2, -4.6], [-3.2, -6.5], [3.3, -2.6], [-1.9, -8.5]];
  L.slice(0, cuantos).forEach(([x, z], i) => m.ver(ZS[i], [x + 0.25 * Math.sin(f * 0.05 + i), brinco(f, i), z - lejos + 0.5 * Math.sin(f * 0.07 + i * 2)], { ...LUNA, ...ZOMBI(f, i), ...CORRE(f, i * 1.7) }, [0, 1], 0.13 * Math.sin(f * 0.42 + i * 2)));
};
/** el pie de la escalera con los zombies que se van juntando */
const AL_PIE = (m: Mundo, f: number, k: number, alto = 2.6) => {
  const L: [number, number][] = [[-1.5, 0.7], [-1.5, 1.75], [-1.15, 0.15], [-1.25, 2.35]];
  L.forEach(([x, z], i) => { const llega = Math.min(1, k * 1.6 + 0.25 - i * 0.12); if (llega <= 0) return; m.ver(ZS[i], [x + (1 - llega) * 1.2, brinco(f, i, 0.5) * 0.5, z + (1 - llega) * (i % 2 ? 3 : -3)], { ...LUNA, ...ZOMBI(f, i), brazoIzq: [alto + 0.15 * Math.sin(f * 0.4 + i), 0.15], brazoDer: [alto - 0.15 * Math.sin(f * 0.33 + i), 0.15], mirarY: -0.8, piernas: [Math.max(0, Math.sin(f * 0.4 + i)) * 0.4, 0] }, [1, 1]); });
};
/** los dos sentados contra el pretil, con la cobija */
const SENTADOS = (m: Mundo, f: number, tu: Partial<Pose> = {}, beto: Partial<Pose> = {}, fiebre = false) => {
  m.cobija = true;
  m.ver("tu", TU_S, { ...CALIDA, sentado: 1, brazoIzq: [0.2, 0.3], brazoDer: [0.2, 0.3], ...tu }, [0, -1]);
  // recargarse: se mueve y se inclina TODA la tarjeta hacia ti (antes se corría el dibujo dentro de la tarjeta y la cabeza
  // se salía de la orilla: quedaba cortada en línea recta)
  const recarga = Math.max(0, (beto.cuerpoX ?? 0) + (beto.cabezaX ?? 0));
  const { cuerpoX: _cx, cabezaX: _hx, ...bp } = beto; void _cx; void _hx;
  m.ver(fiebre ? "betoF" : "beto", [BETO_S[0] - recarga * 0.32, BETO_S[1], BETO_S[2]], { ...CALIDA, sentado: 1, giro: -0.25, ...(fiebre ? { ojeras: 1, sudor: 1, ...tiembla(f, 0.5) } : {}), ...bp }, [0, -1], -recarga * 0.38);
};
const REGLAS_CAM = (dist: number, y: number, fov: number, dx = 0): Cam => c([PARED_REGLAS.x - 0.55 + dx, AZ + y + 0.1, PARED_REGLAS.z + dist], [PARED_REGLAS.x - 0.55 + dx, AZ + y, PARED_REGLAS.z], fov);
/** los dos sentados, de frente */
const DOS = (dist: number, fov: number): Cam => c([-5.63, AZ + 1.08, LUG[2] - dist], [-5.63, AZ + 0.9, LUG[2]], fov);
/** una cara de cerca (la cara queda arriba del subtítulo) */
const CERCA = (q: V3, dist: number, fov: number): Cam => c([q[0] - 0.08, q[1] + 0.02, q[2] - dist], [q[0], q[1] - 0.13, q[2]], fov);
const ABAJO = (dz: number, fov: number): Cam => c([MERC.x1 - 0.5, AZ + 2.3, 1.2 + dz], [MERC.x1 + 2.2, 0.6, 1.2 + dz * 0.4], fov);

const PLANOS: Plano[] = [
  // 0 · Imagina que manejas una ambulancia  (viene de frente, a toda velocidad; los zombies corren detrás)
  { w: 0, lugar: "calle", foco: 7, cInf: 7, sacude: () => 0.012, ini: c([-2.1, 1.0, 8.2], [0.15, 1.75, 1.5], 50), fin: c([-1.9, 1.1, 6.6], [0.1, 1.75, 1.5], 48), hacer: ({ f, m }) => { MANEJA(m, f); PERSIGUEN(m, f); } },
  // 1 · y la ciudad cayó hace dos horas  (desde arriba y atrás: la avenida, el coche ardiendo, los que la persiguen)
  { w: 5, lugar: "calle", foco: 12, cInf: 6, ini: c([2.6, 6.2, -15], [0, 1.2, 4], 52), fin: c([2.2, 5.4, -13.5], [0, 1.2, 5], 50), hacer: ({ f, m }) => { PERSIGUEN(m, f, 0.5); } },
  // 2 · Vas a toda velocidad por la avenida  (tú, por el parabrisas)
  { w: 12, lugar: "calle", foco: 3.2, cInf: 7, sacude: () => 0.008, ini: c([0.62, 1.86, 4.9], CHOFER_CARA, 32), fin: c([0.58, 1.84, 4.5], CHOFER_CARA, 30), hacer: ({ f, m }) => { MANEJA(m, f, { mirarX: 0.25 * Math.sin(f * 0.12), boca: "dientes" }); } },
  // 3 · Atrás llevas a tu hermanito Beto  (adentro: Beto en la banca, junto a la camilla)
  { w: 19, lugar: "calle", corte: true, foco: 1.6, cInf: 7, sacude: () => 0.006, ini: c([-0.9, 1.85, -0.35], [0.45, 1.5, -1.4], 56), fin: c([-0.85, 1.8, -0.65], [0.45, 1.5, -1.4], 52), hacer: ({ f, m }) => { m.adentro = true; m.ver("beto", BETO_BANCA, { ...FRIA, sentado: 1, ...MIEDO(f, 0.5), boca: "linea", abraza: "#3a6a4a", mirarX: -0.3, hombros: 0.5 }, [-1, 0]); } },
  // 4 · de ocho años  (su cara)
  { w: 25, lugar: "calle", corte: true, foco: 1.0, cInf: 8, sacude: () => 0.006, ini: c([-0.5, 1.62, -1.15], BETO_CARA, 40), fin: c([-0.42, 1.6, -1.2], BETO_CARA, 37), hacer: ({ f, m }) => { m.adentro = true; m.ver("beto", BETO_BANCA, { ...FRIA, sentado: 1, ...MIEDO(f, 0.6), boca: "triste", abraza: "#3a6a4a", mirarX: 0.2, mirarY: 0.3, hombros: 0.6, lagrimas: 0.3 }, [-1, 0]); } },
  // 5 · Los zombies golpean los costados  (por fuera: corren pegados y le pegan a la lámina)
  { w: 28, lugar: "calle", foco: 5, cInf: 7, sacude: (f) => 0.015 + 0.02 * Math.abs(Math.sin(f * 0.5)), ini: c([-3.4, 1.35, 5.6], [-1.3, 1.55, -0.6], 46), fin: c([-3.1, 1.3, 4.6], [-1.3, 1.55, -0.6], 44), hacer: ({ f, m }) => {
    m.golpes = true;
    [[-1.78, -2.4], [-1.82, -0.9], [-1.78, 0.6]].forEach(([x, z], i) => m.ver(ZS[i], [x, brinco(f, i), z], { ...LUNA, ...ZOMBI(f, i), piernas: [Math.max(0, Math.sin(f * 0.85 + i)), Math.max(0, -Math.sin(f * 0.85 + i))], brazoIzq: [2.2 + 0.5 * Math.sin(f * 0.6 + i * 2), 0.4], brazoDer: [2.2 - 0.5 * Math.sin(f * 0.6 + i * 2), 0.4], giro: -0.5 }, [0.4, 1], -0.1 + 0.08 * Math.sin(f * 0.42 + i * 2)));
    m.ver("z4", [-3.4 + 0.2 * Math.sin(f * 0.1), brinco(f, 4), -5.5], { ...LUNA, ...ZOMBI(f, 4), ...CORRE(f, 4) }, [0, 1]);
  } },
  // 6 · Uno se trepa al cofre  (desde tu asiento: aparece su cara contra el parabrisas)
  { w: 33, lugar: "calle", foco: 1.6, cInf: 7, sacude: () => 0.012, ini: c([CHOFER.x, 1.82, 1.2], [0.25, 1.85, 3.0], 62), fin: c([CHOFER.x, 1.82, 1.32], [0.25, 1.88, 3.0], 58), hacer: ({ f, k, m }) => { m.enCofre(f, Math.min(1, k * 2.2)); } },
  // 7 · Frenas de golpe...  (por fuera: el zombie en el cofre, tú gritando; la ambulancia se clava)
  { w: 38, lugar: "calle", foco: 4, cInf: 7, sacude: (f) => golpeCam(f, FRENA(), 0.07, 14), ini: c([-2.9, 1.0, 6.4], [0.1, 1.55, 2.2], 46), fin: c([-2.6, 1.0, 5.9], [0.1, 1.55, 2.2], 44), hacer: ({ f, m }) => { m.enCofre(f, 1); MANEJA(m, f, { boca: "grito", ojos: 1.15, brazoIzq: [0.9, -1.2], brazoDer: [0.9, -1.2] }); } },
  // 8 · y sale volando  (de lado: el zombie vuela hacia adelante y rueda)
  { w: 41, lugar: "calle", foco: 5, cInf: 7, rapido: true, ini: c([-5.4, 1.5, 5.0], [0.1, 1.9, 4.0], 56), fin: c([-5.4, 1.4, 7.0], [0.1, 0.8, 9.5], 54), hacer: ({ f, m }) => { m.vuela(f); } },
  // 9 · Otro rompe la ventana de atrás  (adentro, mirando a las puertas: la cara en el vidrio roto)
  { w: 44, lugar: "calle", corte: true, foco: 1.6, cInf: 7, sacude: (f) => golpeCam(f, fw(45), 0.05, 12), ini: c([0.2, 1.9, -1.55], [-0.5, 2.05, A.atras], 60), fin: c([0.12, 1.92, -1.85], [-0.5, 2.08, A.atras], 56), hacer: ({ f, m }) => { m.adentro = true; m.ventana(f); } },
  // 10 · Beto grita
  { w: 50, lugar: "calle", corte: true, foco: 1.0, cInf: 8, sacude: () => 0.012, ini: c([-0.5, 1.6, -1.1], BETO_CARA, 38), fin: c([-0.4, 1.58, -1.2], BETO_CARA, 34), hacer: ({ f, m }) => { m.adentro = true; m.ver("beto", BETO_BANCA, { ...FRIA, sentado: 1, ...MIEDO(f, 1), boca: "grito", ojos: 1.18, lagrimas: 0.8, mirarX: 0.7, brazoIzq: [1.6, -1.0], brazoDer: [1.6, -1.0], hombros: 0.8 }, [-1, 0]); } },
  // 11 · Aceleras.  (por atrás: la ambulancia se va; el de la ventana se cae y los demás se quedan)
  { w: 52, lugar: "calle", foco: 5, cInf: 7, rapido: true, ini: c([-1.9, 0.75, -6.4], [0, 1.5, -3.3], 52), fin: c([-1.9, 0.8, -6.4], [0.2, 1.4, 2], 50), hacer: ({ f, m }) => { m.seVa(f); } },
  // 12 · Adelante, el mercado.  (llegas: la fachada con su letrero y la gente arriba)
  { w: 53, lugar: "mercado", foco: 12, cInf: 6, ini: c([8.2, 4.6, -3.5], [-2.0, 3.3, 3.4], 52), fin: c([7.6, 4.4, -2.6], [-2.0, 3.3, 3.4], 50), hacer: ({ f, k, m }) => { m.ambuZ = lerp(-26, 0, empuje(k, 2.2)); m.gente(f, 0); } },
  // 13 · En la azotea hay gente con linternas  (desde abajo)
  { w: 56, lugar: "mercado", foco: 6, cInf: 7, ini: c([6.8, 1.5, 3.8], [-2.2, 6.0, 1.6], 44), fin: c([6.3, 1.6, 3.6], [-2.2, 6.0, 1.6], 42), hacer: ({ f, m }) => { m.gente(f, 1); } },
  // 14 · Te avientan una escalera  (baja pegada a la pared)
  { w: 63, lugar: "mercado", foco: 5, cInf: 7, ini: c([-0.75, 1.5, -4.8], [-1.85, 3.0, 1.2], 50), fin: c([-0.75, 1.45, -4.4], [-1.85, 2.3, 1.2], 48), hacer: ({ f, k, m }) => { m.escaleraY = lerp(5.4, 0, empuje(k * 1.25, 2)); m.gente(f, 0); m.ver("z1", [0.3, brinco(f, 1), -16 + k * 5], { ...LUNA, ...ZOMBI(f, 1), ...CORRE(f, 1) }, [0, 1]); m.ver("z3", [-1.0, brinco(f, 3), -19 + k * 5], { ...LUNA, ...ZOMBI(f, 3), ...CORRE(f, 3) }, [0, 1]); } },
  // 15 · Cargas a Beto y subes  (tú en la escalera con Beto en la espalda; abajo llegan)
  { w: 67, lugar: "mercado", foco: 4.5, cInf: 7, ini: c([0.6, 1.9, 4.4], [-1.6, 1.9, 1.2], 48), fin: c([0.6, 2.5, 4.2], [-1.6, 2.6, 1.2], 46), hacer: ({ f, k, m }) => { m.sube(f, lerp(0.15, 1.7, k)); AL_PIE(m, f, k * 0.6 - 0.2, 1.6); } },
  // 16 · Los zombies agarran tu bota
  { w: 72, lugar: "mercado", foco: 2.4, cInf: 7, sacude: () => 0.01, ini: c([0.05, 1.3, 4.1], [-1.5, 1.3, 1.25], 52), fin: c([0.0, 1.3, 3.9], [-1.5, 1.35, 1.25], 50), hacer: ({ f, m }) => { m.sube(f, 1.42 - 0.05 * Math.abs(Math.sin(f * 0.5))); AL_PIE(m, f, 1, 2.2); } },
  // 17 · Pateas.
  { w: 77, lugar: "mercado", foco: 2.4, cInf: 7, sacude: (f) => golpeCam(f, fw(77) + 3, 0.06, 12), ini: c([0.0, 1.3, 3.9], [-1.5, 1.35, 1.25], 50), fin: c([0.05, 1.55, 4.0], [-1.5, 1.8, 1.25], 50), hacer: ({ f, k, m }) => { m.sube(f, 1.42 + Math.max(0, k - 0.35) * 1.6, f >= fw(77) + 1 && f < fw(77) + 7); AL_PIE(m, f, 1, 2.2); m.pateado(f, fw(77) + 3); } },
  // 18 · Arriba, jalan la escalera.  (en la azotea: la suben entre dos; ustedes ya están arriba)
  { w: 78, lugar: "azotea", foco: 4, cInf: 7, ini: c([-4.9, AZ + 1.6, 5.4], [-2.7, AZ + 1.15, 1.5], 50), fin: c([-4.7, AZ + 1.55, 5.1], [-2.7, AZ + 1.15, 1.5], 48), hacer: ({ f, k, m }) => { m.jalan(f, k); } },
  // 19 · En la pared, tres reglas pintadas.
  { w: 82, lugar: "azotea", foco: 8, cInf: 6, ini: REGLAS_CAM(9.4, 1.3, 40), fin: REGLAS_CAM(8.4, 1.3, 40), hacer: ({ m }) => { m.escaleraArriba = true; } },
  // 20 · Regla número uno: de noche, nadie hace ruido.
  { w: 88, lugar: "azotea", foco: 6, cInf: 6, ini: REGLAS_CAM(7.0, 1.62, 40, -0.42), fin: REGLAS_CAM(6.6, 1.62, 40, -0.42), hacer: ({ m }) => { m.escaleraArriba = true; } },
  // 21 · El ruido los junta.  (abajo: la calle llena, mirando hacia arriba)
  { w: 96, lugar: "azotea", foco: 7, cInf: 6, ini: ABAJO(-0.6, 56), fin: ABAJO(0.4, 54), hacer: ({ m }) => { m.escaleraArriba = true; m.multitud = 1; } },
  // 22 · Regla número dos:
  { w: 100, lugar: "azotea", foco: 6, cInf: 6, ini: REGLAS_CAM(7.0, 1.1, 40, -0.42), fin: REGLAS_CAM(6.6, 1.1, 40, -0.42), hacer: ({ m }) => { m.escaleraArriba = true; } },
  // 23 · la escalera se sube y no se baja por nadie.  (la escalera acostada junto al pretil, amarrada)
  { w: 103, lugar: "azotea", foco: 3.5, cInf: 7, ini: c([-5.4, AZ + 1.5, 3.4], [-2.9, AZ + 0.15, 0.6], 46), fin: c([-5.1, AZ + 1.4, 3.0], [-2.9, AZ + 0.15, 0.4], 44), hacer: ({ f, m }) => { m.escaleraArriba = true; } },
  // 24 · Regla número tres:
  { w: 113, lugar: "azotea", foco: 6, cInf: 6, ini: REGLAS_CAM(7.0, 0.55, 40, -0.42), fin: REGLAS_CAM(6.6, 0.55, 40, -0.42), hacer: ({ m }) => { m.escaleraArriba = true; } },
  // 25 · el que tenga fiebre, duerme amarrado.  (el catre con las cuerdas)
  { w: 116, lugar: "azotea", foco: 2.6, cInf: 7, ini: c([-6.5, AZ + 1.45, 0.3], [-4.6, AZ + 0.42, -2.0], 44), fin: c([-6.2, AZ + 1.3, 0.0], [-4.6, AZ + 0.42, -2.0], 41), hacer: ({ m }) => { m.escaleraArriba = true; m.luz(-5.4, AZ + 1.1, -0.9, 2.2); } },
  // 26 · Te dan una cobija.
  { w: 122, lugar: "azotea", foco: 1.9, cInf: 7, ini: c([-5.5, AZ + 1.42, 7.6], [-6.25, AZ + 1.1, 5.9], 46), fin: c([-5.55, AZ + 1.4, 7.4], [-6.25, AZ + 1.1, 5.9], 44), hacer: ({ f, m }) => { m.escaleraArriba = true; m.ver("senora", [-6.3, AZ, 5.8], { ...CALIDA, mirarX: 0.2, mirarY: 0.15, boca: "amable", cejasMiedo: 0.4, brazoIzq: [0.7, -1.3], brazoDer: [0.7, -1.3], respira: 0.5 + 0.5 * Math.sin(f * 0.1) }, [0.3, 1]); m.daCobija([-6.22, AZ + 0.72, 6.02]); } },
  // 27 · Beto se acurruca contigo.
  { w: 126, lugar: "azotea", foco: 4.2, cInf: 7, ini: DOS(4.5, 44), fin: DOS(4.2, 44), hacer: ({ f, m }) => { m.escaleraArriba = true; SENTADOS(m, f, { mirarX: -0.5, mirarY: -0.3, boca: "linea", cejasMiedo: 0.4, respira: 0.5 + 0.5 * Math.sin(f * 0.1) }, { parpadeo: f > fw(128), boca: "linea", cuerpoX: 0.25, cabezaX: 0.15 }); } },
  // 28 · Abajo, cientos de manos rascan la pared.
  { w: 130, lugar: "azotea", foco: 6, cInf: 6, sacude: () => 0.006, ini: ABAJO(0.8, 50), fin: ABAJO(-0.3, 46), hacer: ({ m }) => { m.escaleraArriba = true; m.multitud = 2; } },
  // 29 · A media noche, Beto te despierta.
  { w: 137, lugar: "azotea", foco: 4.0, cInf: 7, ini: DOS(4.2, 42), fin: DOS(4.0, 42), hacer: ({ f, m }) => { m.noche = true; const des = f >= fw(142); SENTADOS(m, f, des ? { mirarX: -0.6, mirarY: -0.2, ojos: 1.05, cejasAlto: 0.3, boca: "linea" } : { parpadeo: true, cabezaX: -0.1, boca: "linea", respira: 0.5 + 0.5 * Math.sin(f * 0.1) }, { mirarX: 0.6, mirarY: 0.4, boca: "triste", cuerpoX: 0.15 }, true); } },
  // 30 · «Tengo frío».
  { w: 143, lugar: "azotea", foco: 1.6, cInf: 8, ini: CERCA(BETO_S_CARA, 1.9, 36), fin: CERCA(BETO_S_CARA, 1.7, 34), hacer: ({ f, m }) => { m.noche = true; SENTADOS(m, f, {}, { mirarX: 0.5, mirarY: 0.4, boca: "abierta", bocaAbre: habla(f, 143, 144), cejasMiedo: 0.7, hombros: 0.8, ...tiembla(f, 0.9) }, true); m.soloBeto(); } },
  // 31 · Le tocas la frente.
  { w: 145, lugar: "azotea", foco: 3.8, cInf: 7, ini: DOS(4.0, 42), fin: DOS(3.8, 42), hacer: ({ f, k, m }) => { m.noche = true; SENTADOS(m, f, { mirarX: -0.7, mirarY: -0.2, cejasMiedo: 0.5, boca: "linea", cuerpoX: -0.2 }, { mirarX: 0.5, mirarY: 0.4, boca: "triste", hombros: 0.7 }, true); m.tocar(empuje(k * 2.2, 2)); } },
  // 32 · Está ardiendo.
  { w: 149, lugar: "azotea", foco: 1.8, cInf: 8, ini: CERCA(TU_S_CARA, 2.2, 36), fin: CERCA(TU_S_CARA, 1.95, 34), hacer: ({ f, m }) => { m.noche = true; SENTADOS(m, f, { ...MIEDO(f, 0.5), mirarX: -0.5, mirarY: -0.2, boca: "o", sudor: 1, cejasMiedo: 1 }, {}, true); m.soloTu(); } },
  // 33 · Un guardia pasa con su linterna, revisando uno por uno.  (ustedes de espaldas, al frente; él alumbra a los que duermen)
  { w: 151, lugar: "azotea", foco: 7, cInf: 7, ini: c([-9.0, AZ + 2.1, 12.8], [-9.1, AZ + 0.9, 5.2], 40), fin: c([-9.0, AZ + 2.0, 12.2], [-9.1, AZ + 0.9, 5.2], 40), hacer: ({ f, k, m }) => { m.noche = true; SENTADOS(m, f, {}, {}, true); m.cobija = false; m.ronda(f, k); } },
  // 34 · Beto te aprieta la mano.
  { w: 161, lugar: "azotea", foco: 3.8, cInf: 7, ini: DOS(3.9, 42), fin: DOS(3.7, 42), hacer: ({ f, m }) => { m.noche = true; SENTADOS(m, f, { ...MIEDO(f, 0.3), mirarX: 0.7, mirarY: 0.1, boca: "linea", sudor: 0.8 }, { mirarX: 0.6, mirarY: 0.5, boca: "triste", lagrimas: 0.6, cuerpoX: 0.3, cabezaX: 0.15 }, true); m.haz(f, 0.25); } },
  // 35 · «No me amarres. Por favor».
  { w: 166, lugar: "azotea", foco: 1.5, cInf: 8, ini: CERCA(BETO_S_CARA, 1.75, 34), fin: CERCA(BETO_S_CARA, 1.55, 32), hacer: ({ f, m }) => { m.noche = true; SENTADOS(m, f, {}, { mirarX: 0.5, mirarY: 0.5, boca: "abierta", bocaAbre: Math.max(habla(f, 166, 168), habla(f, 169, 170)), lagrimas: 1, cejasMiedo: 1, hombros: 0.8, ...tiembla(f, 0.7) }, true); m.soloBeto(); m.haz(f, 0.4); } },
  // 36 · ¿Le dices al guardia...
  { w: 171, lugar: "azotea", foco: 1.8, cInf: 8, ini: CERCA(TU_S_CARA, 2.1, 35), fin: CERCA(TU_S_CARA, 1.9, 33), hacer: ({ f, k, m }) => { m.noche = true; SENTADOS(m, f, { ...MIEDO(f, 0.6), mirarX: lerp(-0.5, 0.8, suave(0.2, 0.6, k)), boca: "linea", sudor: 1, cejasMiedo: 1 }, {}, true); m.soloTu(); m.haz(f, 0.6); } },
  // 37 · o lo escondes bajo la cobija?
  { w: 175, lugar: "azotea", foco: 3.8, cInf: 7, ini: DOS(3.8, 42), fin: DOS(4.2, 42), hacer: ({ f, k, m }) => { m.noche = true; m.cobijaSube = 0.06 * suave(0.1, 0.5, k); SENTADOS(m, f, { ...MIEDO(f, 0.6), mirarX: 0.8, boca: "linea", sudor: 1, brazoIzq: [1.1, -0.6] }, { mirarX: 0.7, mirarY: 0.2, boca: "linea", hombros: 1, ojos: 1.1, cuerpoX: 0.3, cabezaX: 0.15 }, true); m.haz(f, 0.6 + 0.4 * k); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

// ------------------------------------------------------------------ mundo (estado por cuadro)
class Mundo {
  h = crearEscenario();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  f = 0;
  adentro = false; golpes = false; cobija = false; cobijaSube = 0; noche = false; multitud = 0; escaleraArriba = false; escaleraY = 0; ambuZ = 0;
  private cam!: THREE.PerspectiveCamera;
  // tu mano en la frente de Beto: manga (barra con contorno) y mano redonda, delante de las tarjetas
  toque = (() => {
    const g = new THREE.Group(), tinta = new THREE.MeshBasicMaterial({ color: "#141012" });
    const manga = new THREE.Group(); manga.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 0.075), tinta), Object.assign(new THREE.Mesh(new THREE.PlaneGeometry(1, 0.045), new THREE.MeshBasicMaterial({ color: "#2a4468" })), { renderOrder: 1 }));
    manga.children[1].position.z = 0.003;
    const mano = new THREE.Group(); mano.add(new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), tinta), new THREE.Mesh(new THREE.CircleGeometry(0.068, 20), new THREE.MeshBasicMaterial({ color: "#8f7460" })));
    mano.children[1].position.z = 0.003;
    g.add(manga, mano); g.traverse((o) => o.layers.set(NOINK)); g.visible = false; this.h.raiz.add(g);
    return { g, manga, mano };
  })();
  /** k 0 … 1: la mano sale de tu hombro y llega a la frente de Beto (las tarjetas miran a −z) */
  tocar(k: number) {
    const z = LUG[2] - 0.05, o = new THREE.Vector3(TU_S[0] + 0.27, AZ + 0.8, z), d = new THREE.Vector3(BETO_S[0] - 0.02, BETO_S_CARA[1] - 0.02, z), m = o.clone().lerp(d, k);
    const t = this.toque; t.g.visible = true; t.g.rotation.y = Math.PI; t.g.position.set(0, 0, 0);
    t.mano.position.set(-m.x, m.y, -m.z); const c = o.clone().add(m).multiplyScalar(0.5), l = m.clone().sub(o);
    t.manga.position.set(-c.x, c.y, -c.z + 0.004); t.manga.scale.set(Math.max(0.01, l.length()), 1, 1); t.manga.rotation.z = Math.atan2(l.y, -l.x);
  }
  constructor() { for (const c of Object.values(this.cartas)) { this.h.raiz.add(c.grupo); c.sombraLarga.visible = false; } }
  reiniciar(cam: THREE.PerspectiveCamera) {
    this.cam = cam;
    for (const c of Object.values(this.cartas)) { c.grupo.visible = false; c.contacto.visible = true; c.grupo.rotation.set(0, 0, 0); }
    const h = this.h;
    h.luzExtra.intensity = 0; h.luzExtra2.intensity = 0; h.luzLinterna.intensity = 0; h.haces.forEach((x) => (x.visible = false));
    this.adentro = false; this.golpes = false; this.cobija = false; this.cobijaSube = 0; this.noche = false; this.multitud = 0; this.escaleraArriba = false; this.escaleraY = 0; this.ambuZ = 0;
    this.toque.g.visible = false;
    h.cobijaDoblada.visible = false; h.vidrioRoto.visible = false; h.vidrioTrasDer.visible = true;
  }
  luz(x: number, y: number, z: number, i: number, color = "#ffc890") { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; l.color.set(color); }
  /** tarjeta que mira a la cámara; `mira` (±x, ±z): hacia dónde ve la persona (si la cámara queda detrás, de espaldas); `giro`: la tarjeta rueda en su plano */
  ver(quien: Quien, pos: V3, pose: Partial<Pose>, mira?: [number, number], giro = 0) {
    const c = this.cartas[quien], cp = this.cam.position;
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.set(0, Math.atan2(cp.x - pos[0], cp.z - pos[2]), giro);
    const espalda = mira ? (cp.x - pos[0]) * mira[0] + (cp.z - pos[2]) * mira[1] < 0 : false;
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[0] * 3), ...pose, ...(espalda ? { vista: "espalda" as const } : {}) });
    if (pos[1] > 0.3 && pos[1] < AZ - 0.1) c.contacto.visible = false;
  }
  /** el zombie que se trepa al cofre: sube desde el frente (k 0 … 1); el cofre le tapa las piernas */
  enCofre(f: number, k: number) {
    this.ver("z3", [0.1, lerp(-0.6, 0.62, empuje(k, 2)), 2.82], { ...LUNA, ...ZOMBI(f, 3), boca: "dientes", brazoIzq: [2.3 + 0.2 * Math.sin(f * 0.5), 0.5], brazoDer: [2.3 - 0.2 * Math.sin(f * 0.6), 0.5], mirarX: 0.3, cabezaX: 0.1 * Math.sin(f * 0.4) }, [0, -1]);
    this.cartas.z3.contacto.visible = false;
  }
  /** «y sale volando»: del cofre hacia adelante, en arco, rodando; cae y rueda por el asfalto */
  vuela(f: number) {
    const t = Math.max(0, f - (fw(41) - 2)), u = Math.min(1, t / 15), rueda = Math.max(0, t - 15);
    const z = 2.82 + u * 5.6 + Math.min(1.2, rueda * 0.09), y = u < 1 ? 0.62 + 3.4 * u * (1 - u) - 0.27 * u : 0.35;
    this.ver("z3", [0.1, y, z], { ...LUNA, ...ZOMBI(f, 3), boca: "grito", brazoIzq: [2.2, 0.2], brazoDer: [1.2, 0.6], piernas: [0.8, 0.2] }, [0, -1], -u * (Math.PI * 2.5));
    this.cartas.z3.contacto.visible = false;
  }
  /** la cara en la ventana rota de atrás (el vidrio se rompe en «rompe») */
  ventana(f: number) {
    const roto = f >= fw(45), k = Math.min(1, Math.max(0, (f - fw(44) + 2) / 10));
    this.h.vidrioRoto.visible = roto; this.h.vidrioTrasDer.visible = !roto;
    this.ver("z2", [-A.x / 2 + 0.04, lerp(0.1, 0.78, empuje(k, 2)) + 0.03 * Math.sin(f * 0.6), A.atras - 0.14], { ...FRIA, ...ZOMBI(f, 2), boca: roto ? "grito" : "dientes", brazoIzq: [2.5, 0.3], brazoDer: [2.5, 0.3], cabezaX: roto ? 0.1 * Math.sin(f * 0.7) : 0 }, [0, 1]);
    this.cartas.z2.contacto.visible = false;
  }
  /** «Aceleras»: el de la ventana se suelta y queda tirado; los demás se quedan atrás */
  seVa(f: number) {
    const t = Math.max(0, f - (fw(52) - 2)), atras = avance(f) - avance(fw(52) - 2);
    this.h.vidrioRoto.visible = true; this.h.vidrioTrasDer.visible = false;
    this.ver("z2", [-0.5, Math.max(-0.3, 0.6 - t * 0.12), A.atras - 0.3 - atras], { ...LUNA, ...ZOMBI(f, 2), brazoIzq: [2.4, 0.3], brazoDer: [1.6, 0.5] }, [0, 1], Math.min(1.45, t * 0.16));
    this.cartas.z2.contacto.visible = false;
    this.ver("z1", [-2.6, brinco(f, 1), -2.6 - atras * 0.8], { ...LUNA, ...ZOMBI(f, 1), ...CORRE(f, 1) }, [0, 1]);
    this.ver("z4", [1.9, brinco(f, 4), -4.4 - atras * 0.8], { ...LUNA, ...ZOMBI(f, 4), ...CORRE(f, 4) }, [0, 1]);
  }
  /** la gente de la azotea asomada al pretil con linternas (modo 1: apuntan hacia abajo) */
  gente(f: number, modo: number) {
    const L: [Quien, number][] = [["guardia", ESCALERA.z + 0.95], ["joven", ESCALERA.z - 1.0], ["senor", ESCALERA.z + 2.6]];
    L.forEach(([q, z], i) => {
      this.ver(q, [MERC.x1 - 0.36, AZ, z], { ...CALIDA, mirarX: 0.4, mirarY: -0.7, boca: i === 0 ? "abierta" : "linea", bocaAbre: 0.5 + 0.5 * Math.sin(f * 0.5), cejasMiedo: 0.5, brazoDer: [1.3, -0.5], brazoIzq: i === 1 ? [2.4 + 0.2 * Math.sin(f * 0.4), 0.2] : [0.3, -0.4] }, [1, 0]);
      if (modo > 0) this.apunta(this.h.haces[i], [MERC.x1 - 0.25, AZ + 1.15, z + 0.3], [0.2 + 0.5 * Math.sin(f * 0.07 + i * 2), 0, z - 0.5 + i * 0.6], 1);
    });
    if (modo > 0) { const l = this.h.luzLinterna; l.position.set(MERC.x1 - 0.2, AZ + 1.2, ESCALERA.z + 1.2); l.target.position.set(0.3, 0, ESCALERA.z + 0.5 * Math.sin(f * 0.07)); l.intensity = 16; }
  }
  /** tú subiendo la escalera con Beto en la espalda (y = altura de tus pies); `patea`: levantas una pierna */
  sube(f: number, y: number, patea = false) {
    const paso = Math.sin(f * 0.45);
    this.ver("tu", [ESCALERA.x + 0.22, y, ESCALERA.z], { ...LUNA, brazoIzq: [2.5 + 0.3 * paso, 0.2], brazoDer: [2.5 - 0.3 * paso, 0.2], piernas: patea ? [1, 0] : [Math.max(0, paso) * 0.6, Math.max(0, -paso) * 0.6] }, [-1, 0]);
    this.ver("beto", [ESCALERA.x + 0.36, y + 0.62, ESCALERA.z + 0.02], { ...LUNA, brazoIzq: [2.2, 0.9], brazoDer: [2.2, 0.9], piernas: [0.6, 0.6], hombros: 0.6 }, [-1, 0]);
    this.cartas.tu.contacto.visible = false; this.cartas.beto.contacto.visible = false;
  }
  /** «Pateas»: el que te agarraba (z1) cae hacia atrás */
  pateado(f: number, desde: number) {
    const t = f - desde; if (t < 0) return;
    const u = Math.min(1, t / 9);
    this.ver("z1", [-1.25 + u * 0.9, -u * 0.25, 0.55 - u * 0.4], { ...LUNA, ...ZOMBI(f, 1), boca: "grito", brazoIzq: [2.2, 0.6], brazoDer: [1.5, 0.8], mirarY: -0.5 }, [-0.3, 1], -u * 1.2);
  }
  /** «jalan la escalera»: guardia y joven la suben; tú y Beto ya en la azotea, agachados, recuperando el aire */
  jalan(f: number, k: number) {
    this.escaleraY = lerp(0.4, 3.2, k);
    const t = Math.sin(f * 0.5);
    this.ver("guardia", [MERC.x1 - 0.75, AZ, ESCALERA.z + 0.75], { ...CALIDA, brazoIzq: [1.9 + 0.3 * t, -0.3], brazoDer: [1.9 + 0.3 * t, -0.3], agacha: 0.3 + 0.2 * t, boca: "dientes" }, [1, -0.3]);
    this.ver("joven", [MERC.x1 - 0.75, AZ, ESCALERA.z - 0.75], { ...CALIDA, brazoIzq: [1.9 - 0.3 * t, -0.3], brazoDer: [1.9 - 0.3 * t, -0.3], agacha: 0.3 - 0.2 * t, boca: "dientes" }, [1, 0.3]);
    this.ver("tu", [-4.7, AZ, 2.3], { ...CALIDA, ...MIEDO(f, 0.3), boca: "abierta", bocaAbre: 0.5 + 0.5 * Math.sin(f * 0.4), agacha: 0.6, sudor: 1, mirarX: -0.6, hombros: 0.4, respira: 0.5 + 0.5 * Math.sin(f * 0.4) }, [0.5, 1]);
    this.ver("beto", [-5.15, AZ, 3.1], { ...CALIDA, ...MIEDO(f, 0.5), boca: "triste", lagrimas: 0.5, mirarX: -0.7, brazoDer: [0.9, 0.3] }, [0.5, 1]);
  }
  daCobija(p: V3) { const c = this.h.cobijaDoblada; c.visible = true; c.position.set(p[0], p[1] - AZ, p[2]); c.rotation.y = 0.3; }
  soloBeto() { this.cartas.tu.grupo.visible = false; }
  soloTu() { this.cartas.beto.grupo.visible = false; this.cartas.betoF.grupo.visible = false; }
  /** la luz de la linterna del guardia que se acerca (0 … 1) desde su lado (−x) */
  haz(f: number, k: number) { const l = this.h.luzExtra2; l.position.set(LUG[0] - 2.6 + k * 0.8, AZ + 1.2, LUG[2] - 1.2); l.color.set("#fff0c8"); l.intensity = 2.2 * k * (0.9 + 0.1 * Math.sin(f * 0.15)); }
  /** el guardia camina junto a los catres alumbrando a los que duermen, uno por uno */
  ronda(f: number, k: number) {
    const R0: V3 = [-9.1, AZ, 5.2];
    (["senora", "senor", "joven"] as Quien[]).forEach((q, i) => this.ver(q, [R0[0] - 1.5 + i * 1.5, AZ + 0.02, R0[2] + 0.05], { ...CALIDA, sentado: 1, parpadeo: true, boca: "linea", cabezaX: i % 2 ? 0.12 : -0.1, hombros: 0.4, respira: 0.5 + 0.5 * Math.sin(f * 0.07 + i) }, [0, 1]));
    const gx = lerp(-11.3, -7.9, k), paso = Math.sin(f * 0.35);
    this.ver("guardia", [gx, AZ + 0.02 * Math.abs(paso), 7.0], { ...CALIDA, boca: "linea", brazoIzq: [1.25, -0.2], piernas: [Math.max(0, paso) * 0.5, Math.max(0, -paso) * 0.5] }, [0, -1]);
    const l = this.h.luzLinterna, obj = lerp(-10.9, -7.5, k);
    l.position.set(gx + 0.3, AZ + 1.15, 6.9); l.target.position.set(obj, AZ + 0.9, 5.2); l.intensity = 7;
    this.apunta(this.h.haces[0], [gx + 0.3, AZ + 1.15, 6.9], [obj, AZ + 0.9, 5.2], 0.5);
  }
  /** coloca un haz de linterna (plano con degradado) del origen al destino, de cara a la cámara */
  apunta(hz: THREE.Mesh, o: V3, d: V3, ancho: number) {
    const O = new THREE.Vector3(...o), D = new THREE.Vector3(...d).sub(O), largo = D.length(); D.normalize();
    const y = D.clone().negate(), aCam = this.cam.position.clone().sub(O), z = aCam.sub(D.clone().multiplyScalar(aCam.dot(D))).normalize(), x = new THREE.Vector3().crossVectors(y, z);
    hz.visible = true; hz.position.copy(O); hz.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z)); hz.scale.set(ancho, largo / 6.5, 1);
  }
  luces(f: number, pl: Plano) {
    const h = this.h, calle = pl.lugar === "calle";
    h.calle.visible = calle; h.mercado.visible = !calle;
    // la ambulancia
    const av = calle ? avance(f) : 0;
    if (calle) h.avanzar(av);
    h.fuego.animar(f / FPS);
    h.ambu.position.set(calle ? 0 : AMBU_X, 0, calle ? 0 : this.ambuZ);
    const rueda = calle ? av : this.ambuZ;
    h.llantas.forEach((g) => (g.rotation.x = rueda / 0.46));
    h.chasis.rotation.x = calle ? cabeceo(f) : 0;
    h.chasis.rotation.z = calle ? (this.golpes ? 0.012 * Math.sin(f * 0.9) : 0.004 * Math.sin(f * 0.37)) : 0;
    h.chasis.position.y = calle ? 0.012 * Math.sin(f * 0.6) : 0;
    // torreta: rojo y azul se alternan con una onda suave (no estroboscópica)
    const on = pl.lugar !== "azotea";
    const r = on ? Math.max(0, Math.sin(f * 0.28)) ** 2 : 0, a = on ? Math.max(0, -Math.sin(f * 0.28)) ** 2 : 0;
    (h.tRoja.material as THREE.MeshBasicMaterial).color.setRGB(0.25 + 0.75 * r, 0.05 + 0.1 * r, 0.05 + 0.08 * r);
    (h.tAzul.material as THREE.MeshBasicMaterial).color.setRGB(0.05 + 0.1 * a, 0.1 + 0.2 * a, 0.3 + 0.7 * a);
    h.haloR.material.opacity = 0.65 * r; h.haloA.material.opacity = 0.65 * a; h.luzR.intensity = 2.2 * r; h.luzA.intensity = 2.2 * a;
    h.luzCaja.intensity = this.adentro ? 1.7 : 0.5; h.luzFaros.intensity = on ? 9 : 0;
    // corte: las paredes de la caja entre la cámara y el interior se esconden
    const cp = this.cam.position.clone().sub(h.ambu.position);
    for (const { g, p, n } of h.paredes) g.visible = pl.corte ? cp.clone().sub(p).dot(n) > -0.02 : true;
    if (pl.corte) { h.gCab.visible = cp.z < A.medio; } else h.gCab.visible = true;
    // mercado y azotea
    h.escalera.visible = !calle;
    if (this.escaleraArriba) { h.escalera.rotation.set(Math.PI / 2, Math.PI / 2, 0); h.escalera.position.set(MERC.x1 - 0.75, AZ + 0.05, -2.9); }
    else { h.escalera.rotation.set(0, 0, 0); h.escalera.position.set(ESCALERA.x, this.escaleraY, ESCALERA.z); }
    h.cobija.visible = this.cobija; h.cobija.position.y = this.cobijaSube;
    h.multitud.visible = this.multitud > 0;
    h.filas.forEach((s, i) => { s.rotation.z = -0.5 + 0.03 * Math.sin(f * 0.13 + i * 1.3); s.position.y = -1.3 - i * 0.04 + (this.multitud > 1 ? 0.1 : 0.05) * Math.sin(f * (this.multitud > 1 ? 0.3 : 0.14) + i * 2.1); });
    const noche = this.noche ? 0.45 : 1;
    h.luzAz1.intensity = 3.2 * noche; h.luzAz2.intensity = 2.6 * noche; h.luzAz3.intensity = 1.6 * noche;
    h.amb.intensity = pl.lugar === "azotea" ? (this.noche ? 0.3 : 0.4) : 0.5; h.hemi.intensity = pl.lugar === "azotea" ? (this.noche ? 0.4 : 0.55) : 0.7;
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
const PORTADA: Plano = PLANOS[6]; // «Uno se trepa al cofre»: la cara del zombie contra el parabrisas

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

  const i = planoEn(f);
  const pl = portada ? PORTADA : PLANOS[i];
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : AMBULANCIA_CUADROS;
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
  scene.fog = pl.lugar === "calle" ? new THREE.Fog("#101827", 16, 85) : new THREE.Fog("#101827", 12, 70);
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
  const reglas: [number, number, string][] = [[88, 100, "REGLA Nº 1"], [100, 113, "REGLA Nº 2"], [113, 122, "REGLA Nº 3"], [137, 143, "MEDIA NOCHE"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "DÍA 1 · 9:40 PM · AVENIDA CENTRAL";
  if (f >= inicioPlano(3)) return null;
  const n = Math.round(Math.min(1, (f + 6) / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(171) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 40, padding: "12px 30px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
      {boton("DECIRLE", "#2f63d2", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("ESCONDERLO", "#c8263a", 4)}
    </div>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.03, far: 320 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Ambulancia: React.FC = () => {
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
// Portada: el zombie en el cofre y tú gritando al volante (la acción del inicio); el título abajo, sin tapar caras.
export const AmbulanciaPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 1.1, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", bottom: 0, width: "100%", height: 620, background: "linear-gradient(#05070c00, #05070cee 50%)" }} />
      <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center" }}>
        {linea("SI TIENE FIEBRE,", "#ffffff", 100)}
        {linea("DUERME", "#ffffff", 100)}
        {linea("AMARRADO", "#ffd23a", 112)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void hablaGestos; void suave; void ALTO; void BETO_CARA;
