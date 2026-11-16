// «El faro» — animación completa. Zombies. Gancho con acción desde el cuadro 0, en orden y sin adelantos
// (guía §1; modelo aprobado: «La ambulancia»): ya vas corriendo por el muelle cuando empieza. Mismo composer,
// tarjetas, capas de texto y acabado aprobado (§8.9: personajes ref7, lugares gastados, LUT frío, SIN puntitos).
// Un solo mundo: el muelle (z ≈ 0), el mar y la isla con el faro (z ≈ 72); adentro del faro, la escalera y arriba el
// cuarto de la lámpara. Cada plano empieza 2 cuadros antes de su palabra.
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
import { empuje, tiembla } from "../comun/movimiento";
import { CHOQUE, CUARTO, ESC_I, ISLA, LAN, LANCHA0, MUELLE, REGLAS, REGLA_Y, TORRE, crearEscenario, enPared } from "./faro";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const FARO_CUADROS = Math.ceil(78.5 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes (todos ref7)
const TU: Aspecto = { piel: "#d2a882", pelo: "#1e1612", ropa: "#3a4a6a", ropaInterior: "#d8d2c4", pantalon: "#2a2e38", zapatos: "#1a1614", peinado: "revuelto", prenda: "chamarra", estilo: "ref7", semilla: 1301 };
const CHEMA: Aspecto = { piel: "#a87a5a", pelo: "#d8d4cc", ropa: "#6a4a3a", ropaInterior: "#d8d0bc", pantalon: "#34383e", zapatos: "#2a2018", peinado: "recogido", prenda: "camisa", gorra: "#2a3a5a", bigote: true, arrugas: true, estilo: "ref7", semilla: 1303 };
const ELIAS: Aspecto = { piel: "#c49a7a", pelo: "#3a2a1e", ropa: "#d8a82a", ropaInterior: "#4a4a44", pantalon: "#2e3238", zapatos: "#1a1614", peinado: "revuelto", prenda: "chamarra", cuello: "capucha", barba: "candado", estilo: "ref7", semilla: 1305 };
const zombi = (ropa: string, pantalon: string, pelo: string, peinado: Aspecto["peinado"], piel: string, n: number, extra: Partial<Aspecto> = {}): Aspecto => ({ piel, pelo, ropa, ropaInterior: "#3a3a36", pantalon, zapatos: "#2a2622", peinado, estilo: "ref7", semilla: 1340 + n, zombi: n + 40, ...extra });
const CARTAS = {
  tu: [TU, 1.72], chema: [CHEMA, 1.66], elias: [ELIAS, 1.78],
  ahogado: [zombi("#3a4a4a", "#2a2e34", "#1a1816", "largo", "#8e9aa0", 0, { mojado: true, prenda: "camisa" }), 1.74],
  z1: [zombi("#4a6450", "#3a3e48", "#2a2420", "revuelto", "#9a9fa8", 1, { prenda: "camisa", gorra: "#8a3a2a" }), 1.7],
  z2: [zombi("#7a3e3a", "#2e3238", "#2a2226", "largo", "#a39aa8", 2, { mandil: "#a8a090" }), 1.62],
  z3: [zombi("#3a4a6a", "#4a4238", "#1e1c1c", "recogido", "#8e9a9c", 3, { prenda: "chamarra" }), 1.74],
  z4: [zombi("#6a6478", "#34383e", "#4a4440", "mono", "#a8a6a0", 4), 1.64],
  z5: [zombi("#8a7440", "#2a2e38", "#2a2420", "rizado", "#9098a8", 5, { sombrero: "#6a5a3a" }), 1.68],
  z6: [zombi("#5a5a5e", "#2a2e38", "#3a3430", "revuelto", "#a0a4a0", 6, { prenda: "chamarra", barba: "sombra" }), 1.72],
} as const;
type Quien = keyof typeof CARTAS;
const ALTO = (q: Quien) => CARTAS[q][1];
const ZS: Quien[] = ["z1", "z2", "z3", "z4", "z5", "z6"];
const LUNA: Partial<Pose> = { luzX: -1, borde: "#a8c0ff" };
const CALIDA: Partial<Pose> = { luzX: 1, borde: "#ffd7a0" }; // la lámpara de Elías / la del faro
const OSCURO: Partial<Pose> = { luzX: -1, borde: "#7a94d8" }; // de noche sin lámpara: solo la luna por la ventana

type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Lugar = "afuera" | "torre" | "cuarto";
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; lugar: Lugar; enLancha?: boolean; sacude?: (f: number) => number; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const golpeCam = (f: number, desde: number, fuerza: number, dura = 14) => (f >= desde && f < desde + dura ? fuerza * (1 - (f - desde) / dura) : 0);
const MIEDO = (f: number, k = 0.4): Partial<Pose> => ({ ojos: 1.1, pupila: 0.2, ojeras: 0.4, cejasMiedo: 0.8, ...tiembla(f, k) });
const ZOMBI = (f: number, n: number): Partial<Pose> => ({ ojosVacios: true, ojeras: 1, parpadeo: false, boca: "abierta", bocaAbre: 0.6 + 0.4 * Math.sin(f * 0.35 + n), cejasAlto: -0.3, cabezaX: 0.06 * Math.sin(f * 0.3 + n * 2) });
const CORRE = (f: number, n: number, v = 0.85): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v + n)), Math.max(0, -Math.sin(f * v + n))], brazoIzq: [1.0 + 0.5 * Math.sin(f * v + n), 0.6], brazoDer: [1.0 - 0.5 * Math.sin(f * v + n), 0.6] });
const brinco = (f: number, n: number, v = 0.85) => 0.06 * Math.abs(Math.sin(f * v + n));

// ------------------------------------------------------------------ la lancha: amarrada, sale disparada y pega en las rocas
const SALTA = () => fw(13), ARRANCA = () => fw(40) + 3, PEGA = () => fw(52), GOLPE_REMO = () => fw(34) + 3;
const FINAL: V3 = [CHOQUE.x, 0, CHOQUE.z - LAN.proa + 0.3];
/** posición y giros de la lancha (y = altura del agua bajo ella; cabeceo y ladeo por las olas) */
const lanchaEn = (f: number) => {
  const t = f / FPS;
  const u = Math.min(1, Math.max(0, (f - ARRANCA()) / (PEGA() - ARRANCA())));
  const s = u < 0.12 ? (u * u) / 0.24 : u - 0.06; const av = s / 0.94;
  const x = lerp(LANCHA0.x, FINAL[0], av), z = lerp(LANCHA0.z, FINAL[2], av);
  const ola = 0.025 + 0.13 * suave(0.3, 0.9, av); // las olas crecen cerca de la isla
  if (f >= PEGA()) { // encallada: la proa arriba de la piedra, ladeada
    const g = suave(PEGA(), PEGA() + 6, f);
    return { x, y: 0.05 + 0.25 * g + 0.03 * Math.sin(t * 1.4), z, yaw: 0.12 * g, pitch: -0.14 * g, roll: 0.2 * g + 0.02 * Math.sin(t * 1.7) };
  }
  return { x, y: 0.02 + ola * 0.6 * Math.sin(t * 2.1), z, yaw: 0.04 * Math.sin(t * 0.7) * av, pitch: ola * 0.5 * Math.sin(t * 2.1 + 1) - 0.06 * suave(0, 0.2, u) * (1 - suave(0.2, 0.5, u)), roll: ola * 0.8 * Math.sin(t * 1.6 + 0.5) };
};
const LAN_M = new THREE.Matrix4();
/** de coordenadas de la lancha (piso = 0.12) a coordenadas del mundo */
const L = (p: V3): V3 => { const v = new THREE.Vector3(...p).applyMatrix4(LAN_M); return [v.x, v.y, v.z]; };
const SENTADO = (q: Quien, x: number, z: number): V3 => [x, 0.42 + 0.012 - 0.197 * ALTO(q), z]; // en una banca de la lancha

// ------------------------------------------------------------------ el muelle: tú corres, los zombies detrás
const tuZ = (f: number) => lerp(-17.5, -5.4, Math.min(1, f / SALTA()));
const zombiMuelle = (f: number, i: number): V3 => {
  const xs = [1.0, -0.6, 0.3, -0.9, 0.7, -0.2], v = 2.55 + (i % 3) * 0.12;
  const z = Math.min(-0.9 - (i % 3) * 0.9 - (i > 2 ? 0.6 : 0), -25.5 - i * 1.6 + v * f / FPS);
  return [xs[i], MUELLE.piso, z];
};
const PUNTA = (i: number): V3 => [[-0.7, 0.2, 1.05, -0.2, 0.75, -1.0][i], MUELLE.piso, [-0.6, -0.9, -1.7, -1.8, -2.6, -2.3][i]]; // en la orilla de la punta, viendo la lancha irse

// ------------------------------------------------------------------ el faro
const TORRE_P = (th: number, r: number, y = 0): V3 => enPared(th, r, y);
const REGLA = (r: number, dist: number, fov: number, dy = 0): Cam => { const y = REGLA_Y[r] + dy, rr = TORRE.r0 - (TORRE.r0 - TORRE.r1) * (y / TORRE.alto) - TORRE.rIn; return c(TORRE_P(REGLAS.th, rr - dist, y + 0.05), TORRE_P(REGLAS.th, rr, y), fov); };
/** cuarto de la lámpara: punto a radio r y ángulo θ, a la altura y sobre su piso */
const CU = (th: number, r: number, y = 0): V3 => [ISLA.x + r * Math.sin(th), CUARTO.y + y, ISLA.z + r * Math.cos(th)];
const TH = { chema: 2.2, elias: 2.65, tu: 3.15, ahogado: -0.4 }; // los tres juntos, viendo hacia la ventana de la luna (θ ≈ −0.4)
const R_CU = 1.9, R_AH = 2.25;
const CARA_CU = (q: Quien): V3 => { const p = CU(TH[q as keyof typeof TH], R_CU); return [p[0], p[1] + ALTO(q) * 0.83, p[2]]; };
/** cámara de cerca a la cara de alguien en el cuarto (desde el centro del cuarto, un poco de lado) */
/** cámara de cerca a la cara de alguien en el cuarto: desde su cara hacia el centro, girada `lado` rad */
const CERCA_CU = (q: Quien, dist: number, fov: number, lado = 0.35, bajo = 0): Cam => {
  const cara = CARA_CU(q), d = new THREE.Vector3(ISLA.x - cara[0], 0, ISLA.z - cara[2]).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), lado);
  return c([cara[0] + d.x * dist, cara[1] + 0.04 - bajo * 0.5, cara[2] + d.z * dist], [cara[0], cara[1] - 0.1 - bajo, cara[2]], fov);
};
/** Chema y Elías juntos (para el encendedor) */
const DOS = (): Cam => c(CU(2.42, 0.45, 1.55), CU(2.42, 1.9, 1.0), 68);
/** los tres, desde el otro lado del cuarto (la lente queda arriba, el pedestal a un lado) */
const AMPLIO = (dth = 0, fov = 66): Cam => c(CU(0.75 + dth, 2.3, 1.7), CU(2.7, 1.5, 1.05), fov);

const PLANOS: Plano[] = [
  // 0 · Imagina que corres por un muelle  (de frente: corres hacia la cámara; atrás el muelle, los faroles y las bodegas)
  { w: 0, lugar: "afuera", foco: 2.6, cInf: 7, sacude: () => 0.012, ini: c([0.45, 1.85, -12.6], [0.15, 1.55, -18], 50), fin: c([0.45, 1.85, -10.6], [0.15, 1.55, -15.5], 50), hacer: ({ f, m }) => { m.corre(f); m.zombisMuelle(f, 3); } },
  // 1 · y los zombies vienen detrás de ti.  (de lado, bajo: tú adelante y los zombies corriendo atrás)
  { w: 6, lugar: "afuera", foco: 5, cInf: 6, sacude: () => 0.008, ini: c([-3.6, 1.6, -9.6], [0.2, 1.5, -15.5], 46), fin: c([-3.6, 1.6, -8.2], [0.2, 1.5, -13.0], 46), hacer: ({ f, m }) => { m.corre(f); m.zombisMuelle(f, 6); } },
  // 2 · Saltas a la lancha de don Chema.  (desde el agua, de lado: brincas del muelle a la lancha; Chema en el motor)
  { w: 13, lugar: "afuera", foco: 4.4, cInf: 7, ini: c([6.2, 1.55, -1.2], [1.2, 1.0, -5.0], 48), fin: c([6.0, 1.5, -1.5], [1.4, 0.95, -4.8], 46), hacer: ({ f, m }) => { m.salta(f); m.chema(f, "jala"); m.zombisMuelle(f, 4); } },
  // 3 · Jala el motor... nada.  (de cerca: Chema jala el cordón; el motor no arranca)
  { w: 20, lugar: "afuera", enLancha: true, foco: 1.3, cInf: 8, ini: c([1.3, 1.65, -3.9], [0.4, 1.05, -1.4], 48), fin: c([1.25, 1.6, -3.75], [0.4, 1.05, -1.4], 46), hacer: ({ f, m }) => { m.chema(f, "jala"); m.tuLancha(f, "agachado"); m.zombisMuelle(f, 6); } },
  // 4 · Una mano se agarra de la orilla.  (desde la lancha: un zombie se agacha en la punta y se agarra de la borda)
  { w: 24, lugar: "afuera", enLancha: true, foco: 1.6, cInf: 8, sacude: (f) => golpeCam(f, fw(27) + 2, 0.03, 10), ini: c([0.6, 1.75, 1.1], [-1.35, 1.35, -0.25], 50), fin: c([0.55, 1.7, 0.95], [-1.35, 1.3, -0.25], 48), hacer: ({ f, m }) => { m.agarra(f); m.tuLancha(f, "agachado"); } },
  // 5 · Don Chema le pega con el remo.  (de lado, desde atrás de la lancha: Chema se levanta y le da con el remo)
  { w: 31, lugar: "afuera", enLancha: true, foco: 2.0, cInf: 8, sacude: (f) => golpeCam(f, GOLPE_REMO(), 0.04, 12), ini: c([1.05, 1.55, -3.0], [-0.8, 1.1, 0.1], 50), fin: c([1.0, 1.5, -2.85], [-0.8, 1.1, 0.1], 48), hacer: ({ f, m }) => { m.remazo(f); m.tuLancha(f, "agachado"); } },
  // 6 · El motor arranca  (de cerca al motor: el cordón, el humo y la hélice girando)
  { w: 38, lugar: "afuera", enLancha: true, foco: 1.1, cInf: 8, sacude: (f) => 0.004 + golpeCam(f, ARRANCA(), 0.03, 10), ini: c([1.5, 1.45, -3.6], [0.1, 0.95, -1.9], 48), fin: c([1.45, 1.4, -3.5], [0.1, 0.95, -1.9], 46), hacer: ({ f, m }) => { m.chema(f, "arranca"); } },
  // 7 · y salen disparados al mar.  (desde la punta del muelle, detrás de los zombies: la lancha se va)
  { w: 41, lugar: "afuera", foco: 6, cInf: 6, ini: c([-0.3, 4.4, -8.8], [2.8, 0.0, 8.0], 50), fin: c([-0.3, 4.35, -8.5], [2.8, 0.0, 11.0], 50), hacer: ({ f, m }) => { m.punta(f); m.enLanchaLejos(f); } },
  // 8 · Las olas los empujan  (detrás de la lancha, en el mar: Chema en el timón, tú; adelante la isla con el faro)
  { w: 46, lugar: "afuera", enLancha: true, foco: 3, cInf: 6, sacude: () => 0.008, ini: c([0.0, 1.9, -4.6], [0.0, 1.6, 6.0], 50), fin: c([0.0, 1.85, -4.4], [0.0, 1.7, 6.0], 50), hacer: ({ f, m }) => { m.navegan(f); } },
  // 9 · contra las rocas de una isla.  (de lado, en el agua: una ola avienta la lancha contra las piedras)
  { w: 50, lugar: "afuera", foco: 6, cInf: 6, sacude: (f) => 0.006 + golpeCam(f, PEGA(), 0.08, 16), ini: c([9.5, 1.4, 52.5], [CHOQUE.x, 0.9, 56.5], 48), fin: c([9.2, 1.4, 53.2], [CHOQUE.x, 1.0, 57.2], 46), hacer: ({ f, m }) => { m.navegan(f); m.ola(f); m.luz(CHOQUE.x + 3, 3.5, CHOQUE.z - 2.5, 9, "#c8d8ff"); } },
  // 10 · Arriba, un faro encendido.  (desde las rocas, hacia arriba: el faro, la luz girando)
  { w: 56, lugar: "afuera", foco: 14, cInf: 5, ini: c([CHOQUE.x - 1.5, 1.4, CHOQUE.z - 1.0], [ISLA.x, 13, ISLA.z], 52), fin: c([CHOQUE.x - 1.6, 1.3, CHOQUE.z - 1.4], [ISLA.x, 15, ISLA.z], 50), hacer: ({ f, m }) => { m.navegan(f); m.encallados(f); } },
  // 11 · Elías, el farero, baja corriendo con una lámpara,  (al pie de la escalera de piedra: baja hacia nosotros)
  { w: 60, lugar: "afuera", foco: 3, cInf: 7, ini: c([0.9, 1.4, CHOQUE.z - 0.6], [0.5, 2.6, CHOQUE.z + 4.5], 50), fin: c([0.95, 1.35, CHOQUE.z - 0.9], [0.5, 2.0, CHOQUE.z + 3.0], 50), hacer: ({ f, m }) => { m.navegan(f); m.eliasBaja(f); m.encallados(f, true); } },
  // 12 · los mete y atranca la puerta.  (adentro: la puerta se cierra y Elías deja caer la tranca)
  { w: 68, lugar: "torre", foco: 1.8, cInf: 7, sacude: (f) => golpeCam(f, fw(71) + 8, 0.03, 10), ini: c([0.95, ISLA.alto + 1.55, ISLA.z + 0.6], [-0.1, ISLA.alto + 1.05, ISLA.z - 2.3], 54), fin: c([0.9, ISLA.alto + 1.5, ISLA.z + 0.45], [-0.1, ISLA.alto + 1.0, ISLA.z - 2.3], 52), hacer: ({ f, k, m }) => { m.atranca(f, k); } },
  // 13 · En la pared de la escalera hay tres reglas pintadas.  (la lámpara alumbra la pared; la cámara sube)
  { w: 74, lugar: "torre", foco: 2.2, cInf: 6, ini: c([-0.2, ISLA.alto + 1.4, ISLA.z - 1.2], [0, ISLA.alto + 1.3, ISLA.z + 2.3], 56), fin: c([-0.2, ISLA.alto + 1.6, ISLA.z - 1.0], [0, ISLA.alto + 2.2, ISLA.z + 2.3], 58), hacer: ({ f, m }) => { m.adentro(f, true); } },
  // 14 · Regla número uno:  15 · Regla número dos:  16 · Regla número tres:
  { w: 84, lugar: "torre", foco: 1.0, cInf: 9, ini: REGLA(0, 2.0, 46), fin: REGLA(0, 1.85, 44), hacer: ({ f, m }) => { m.adentro(f, false); } },
  { w: 94, lugar: "torre", foco: 1.0, cInf: 9, ini: REGLA(1, 2.0, 46), fin: REGLA(1, 1.85, 44), hacer: ({ f, m }) => { m.adentro(f, false); } },
  { w: 107, lugar: "torre", foco: 1.1, cInf: 9, ini: REGLA(2, 2.05, 56, 0.05), fin: REGLA(2, 1.9, 54, 0.05), hacer: ({ f, m }) => { m.adentro(f, false); } },
  // 17 · Si sobra uno, no digas nada.  (tu cara con la luz de la lámpara)
  { w: 121, lugar: "torre", foco: 1.0, cInf: 8, ini: c([0.2, ISLA.alto + 1.55, ISLA.z + 1.25], [0.7, ISLA.alto + 1.3, ISLA.z - 0.6], 44), fin: c([0.25, ISLA.alto + 1.55, ISLA.z + 1.05], [0.7, ISLA.alto + 1.3, ISLA.z - 0.6], 42), hacer: ({ f, m }) => { m.adentro(f, false, true); } },
  // 18 · Arriba son tres: tú, don Chema y Elías.  (el cuarto de la lámpara, los tres, la lámpara prendida)
  { w: 127, lugar: "cuarto", foco: 2.2, cInf: 7, ini: AMPLIO(0, 68), fin: AMPLIO(0.12, 64), hacer: ({ f, m }) => { m.arriba(f, true); } },
  // 19 · A medianoche  (afuera: el faro de noche, la luz girando)
  { w: 135, lugar: "afuera", foco: 20, cInf: 5, ini: c([-16, 5.5, 48], [ISLA.x, 16, ISLA.z], 44), fin: c([-15.5, 5.6, 49.5], [ISLA.x, 16.5, ISLA.z], 43), hacer: ({ f, m }) => { m.encallados(f, true, true); } },
  // 20 · oyes que alguien nada hacia la isla.  (desde el balcón, hacia abajo: alguien nada en la luz de la luna)
  { w: 137, lugar: "afuera", foco: 14, cInf: 6, ini: c([ISLA.x - 1.2, CUARTO.y + 1.5, ISLA.z - 2.9], [-4.2, 0.4, 48.6], 26), fin: c([ISLA.x - 1.2, CUARTO.y + 1.5, ISLA.z - 2.9], [-4.2, 0.4, 49.6], 22), hacer: ({ f, m }) => { m.nada(f); m.encallados(f, true, true); } },
  // 21 · Nadie se mueve.  (los tres, quietos, mirando hacia la ventana)
  { w: 144, lugar: "cuarto", foco: 1.6, cInf: 7, ini: AMPLIO(0.25, 52), fin: AMPLIO(0.3, 48), hacer: ({ f, m }) => { m.arriba(f, true, true); } },
  // 22 · Luego, la lámpara parpadea...  (la lámpara de cerca: se prende y se apaga)
  { w: 147, lugar: "cuarto", foco: 1.3, cInf: 8, ini: c(CU(2.5, 1.7, 1.75), CU(0, 0, 2.4), 46), fin: c(CU(2.55, 1.55, 1.75), CU(0, 0, 2.4), 44), hacer: ({ f, m }) => { m.arriba(f, true, true); } },
  // 23 · y se apaga.  (el cuarto entero se queda a oscuras)
  { w: 151, lugar: "cuarto", foco: 2.2, cInf: 7, sacude: (f) => golpeCam(f, fw(153), 0.01, 8), ini: c(CU(0.6, 2.35, 1.25), CU(2.7, 1.2, 1.7), 72), fin: c(CU(0.62, 2.3, 1.2), CU(2.7, 1.2, 1.7), 70), hacer: ({ f, m }) => { m.arriba(f, true, true); } },
  // 24 · En la oscuridad cuentas.  (tu cara, casi a oscuras)
  { w: 154, lugar: "cuarto", foco: 1.0, cInf: 8, ini: CERCA_CU("tu", 1.6, 46, 0.5), fin: CERCA_CU("tu", 1.5, 44, 0.5), hacer: ({ f, m }) => { m.arriba(f, false, true); } },
  // 25 · Uno, don Chema.  26 · Dos, Elías.  27 · Tres, tú.
  { w: 158, lugar: "cuarto", foco: 0.9, cInf: 8, ini: CERCA_CU("chema", 1.6, 46, -0.5), fin: CERCA_CU("chema", 1.5, 44, -0.5), hacer: ({ f, m }) => { m.arriba(f, false, true); } },
  { w: 161, lugar: "cuarto", foco: 0.9, cInf: 8, ini: CERCA_CU("elias", 1.6, 46, 0.5), fin: CERCA_CU("elias", 1.5, 44, 0.5), hacer: ({ f, m }) => { m.arriba(f, false, true); } },
  { w: 163, lugar: "cuarto", foco: 0.9, cInf: 8, ini: CERCA_CU("tu", 1.5, 46, 0.5), fin: CERCA_CU("tu", 1.4, 44, 0.5), hacer: ({ f, m }) => { m.arriba(f, false, true); } },
  // 28 · Cuatro.  (se ve a alguien más, junto a la ventana, contra la luna)
  { w: 165, lugar: "cuarto", foco: 2.6, cInf: 7, ini: c(CU(1.0, 1.7, 1.55), CU(-0.4, 2.25, 1.0), 52), fin: c(CU(0.95, 1.5, 1.5), CU(-0.4, 2.25, 1.0), 48), hacer: ({ f, m }) => { m.arriba(f, false, true); m.cuarto(f); } },
  // 29 · Junto a la ventana hay alguien parado,  (más cerca: la silueta, chorreando)
  { w: 166, lugar: "cuarto", foco: 1.6, cInf: 8, ini: c(CU(0.6, 0.75, 1.4), CU(-0.4, 2.25, 0.95), 54), fin: c(CU(0.62, 0.85, 1.38), CU(-0.4, 2.25, 0.95), 50), hacer: ({ f, m }) => { m.arriba(f, false, true); m.cuarto(f); } },
  // 30 · chorreando agua.  (abajo: las gotas caen al charco)
  { w: 173, lugar: "cuarto", foco: 0.8, cInf: 9, ini: c(CU(-0.05, 1.35, 0.55), CU(-0.4, 2.25, 0.15), 46), fin: c(CU(-0.07, 1.42, 0.5), CU(-0.4, 2.25, 0.12), 44), hacer: ({ f, m }) => { m.arriba(f, false, true); m.cuarto(f); } },
  // 31 · Don Chema saca su encendedor.
  { w: 175, lugar: "cuarto", foco: 0.9, cInf: 8, ini: CERCA_CU("chema", 1.6, 48, -0.5), fin: CERCA_CU("chema", 1.5, 46, -0.5), hacer: ({ f, m }) => { m.arriba(f, false, true); m.cuarto(f); } },
  // 32 · Elías le agarra la mano y niega con la cabeza.
  { w: 180, lugar: "cuarto", foco: 1.2, cInf: 8, ini: DOS(), fin: { ...DOS(), fov: 46 }, hacer: ({ f, m }) => { m.arriba(f, false, true); m.cuarto(f); } },
  // 33 · El encendedor hace clic...  (de muy cerca: la chispa)
  { w: 190, lugar: "cuarto", foco: 0.35, cInf: 9, ini: CERCA_CU("chema", 1.1, 38, -0.5, 0.3), fin: CERCA_CU("chema", 1.0, 36, -0.5, 0.3), hacer: ({ f, m }) => { m.arriba(f, false, true); m.cuarto(f); } },
  // 34 · ¿Le ves la cara...  (la silueta empieza a voltear)
  { w: 194, lugar: "cuarto", foco: 1.6, cInf: 8, ini: c(CU(0.55, 0.95, 1.4), CU(-0.4, 2.25, 1.2), 48), fin: c(CU(0.55, 1.05, 1.4), CU(-0.4, 2.25, 1.25), 44), hacer: ({ f, m }) => { m.arriba(f, false, true); m.cuarto(f); } },
  // 35 · o no dices nada?  (tu cara)
  { w: 198, lugar: "cuarto", foco: 1.0, cInf: 8, ini: CERCA_CU("tu", 1.5, 44, 0.5), fin: CERCA_CU("tu", 1.4, 42, 0.5), hacer: ({ f, m }) => { m.arriba(f, false, true); m.cuarto(f); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };
const APAGA = () => fw(153), PARPADEA = () => fw(150);
/** la lámpara del faro: 1 prendida, 0 apagada (parpadea antes de apagarse) */
const lamparaEn = (f: number) => {
  if (f < PARPADEA()) return 1;
  if (f >= APAGA()) return 0;
  const t = f - PARPADEA(); const corte = [3, 4, 9, 11, 16, 17, 18, 24, 26, 27, 30, 31, 32, 33];
  return corte.some((x) => t >= x * 1.2 && t < x * 1.2 + 1.2) ? 0.08 : 1;
};

// ------------------------------------------------------------------ mundo (estado por cuadro)
class Mundo {
  h = crearEscenario();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  f = 0;
  private cam!: THREE.PerspectiveCamera;
  constructor() { for (const c of Object.values(this.cartas)) { this.h.raiz.add(c.grupo); c.sombraLarga.visible = false; } }
  reiniciar(cam: THREE.PerspectiveCamera) {
    this.cam = cam;
    for (const c of Object.values(this.cartas)) { c.grupo.visible = false; c.contacto.visible = true; c.grupo.rotation.set(0, 0, 0); }
    const h = this.h;
    h.remoMano.visible = false; h.encendedor.visible = false; h.lamparaE.visible = false; h.luzLamE.intensity = 0; h.luzEnc.intensity = 0; h.chispa.material.opacity = 0;
    h.mSalp.opacity = 0; h.ondas.forEach((o) => ((o.material as THREE.MeshBasicMaterial).opacity = 0));
    h.charco.visible = false; h.gotas.forEach((g) => (g.visible = false));
    h.luzExtra.intensity = 0; h.luzExtra2.intensity = 0;
    h.puerta.rotation.y = 1.3; h.tranca.visible = false;
    h.lancha.remoA.visible = true; h.lancha.cordon.scale.y = 1; h.lancha.cordon.position.y = 0.5; h.lancha.mango.position.y = 1; h.lancha.jalon.position.set(0.15, 0.3, -0.38); h.lancha.jalon.rotation.set(0, 0, 0);
  }
  /** tarjeta que mira a la cámara; `mira` (±x, ±z): hacia dónde ve la persona (si la cámara queda detrás, de espaldas) */
  ver(quien: Quien, pos: V3, pose: Partial<Pose>, mira?: [number, number], giro = 0) {
    const c = this.cartas[quien], cp = this.cam.position;
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.set(0, Math.atan2(cp.x - pos[0], cp.z - pos[2]), giro);
    const espalda = mira ? (cp.x - pos[0]) * mira[0] + (cp.z - pos[2]) * mira[1] < 0 : false;
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[0] * 3), ...pose, ...(espalda ? { vista: "espalda" as const } : {}) });
  }
  /** lo mismo, en coordenadas de la lancha */
  verL(quien: Quien, p: V3, pose: Partial<Pose>, mira?: [number, number], giro = 0) { this.ver(quien, L(p), pose, mira, giro); this.cartas[quien].contacto.visible = false; }

  // ---------------- el muelle
  corre(f: number) { if (f >= SALTA()) return; this.ver("tu", [0.25, MUELLE.piso + brinco(f, 0, 1.0), tuZ(f)], { ...LUNA, ...CORRE(f, 0, 1.0), ...MIEDO(f, 0.3), boca: "abierta", bocaAbre: 0.8, sudor: 0.6 }, [0, 1], 0.05 * Math.sin(f * 0.5)); }
  zombisMuelle(f: number, n: number) {
    for (let i = 0; i < n; i++) {
      if (i === 0 && f >= fw(24) - 6) continue; // el primero se agacha en la punta (lo dibuja `agarra`)
      const p = zombiMuelle(f, i), llego = p[2] > -25.5 - i * 1.6 + 2.6 * f / FPS - 0.01 ? 0 : 1;
      this.ver(ZS[i], [p[0], p[1] + (llego ? 0 : brinco(f, i)), p[2]], { ...LUNA, ...ZOMBI(f, i), ...(llego ? { brazoIzq: [2.4 + 0.2 * Math.sin(f * 0.4 + i), 0.3], brazoDer: [2.4 - 0.2 * Math.sin(f * 0.4 + i), 0.3] } : CORRE(f, i * 1.7)) }, [0, 1], 0.08 * Math.sin(f * 0.42 + i * 2));
    }
  }
  /** brincas del muelle a la lancha y te agachas en la banca de enmedio */
  salta(f: number) {
    const u = suave(SALTA() - 2, SALTA() + 14, f);
    if (u <= 0) { this.corre(f); return; }
    if (u >= 1) { this.tuLancha(f, "agachado"); return; }
    const a: V3 = [0.25, MUELLE.piso, tuZ(SALTA())], b = L([0.2, LAN.piso, 0.55]);
    const p: V3 = [lerp(a[0], b[0], u), lerp(a[1], b[1], u) + 0.9 * Math.sin(u * Math.PI), lerp(a[2], b[2], u)];
    this.ver("tu", p, { ...LUNA, ...MIEDO(f, 0.3), boca: "grito", brazoIzq: [2.2, 0.4], brazoDer: [2.0, 0.4], piernas: [0.7, 0.2] }, [1, 0], -0.15 * Math.sin(u * Math.PI));
    this.cartas.tu.contacto.visible = false;
  }
  /** tú en la lancha: agachado junto a la banca de enmedio, o sentado mirando adelante */
  tuLancha(f: number, como: "agachado" | "sentado") {
    if (como === "agachado") this.verL("tu", [0.25, LAN.piso, 0.55], { ...LUNA, ...MIEDO(f, 0.5), agacha: 0.45, boca: "dientes", mirarX: -0.7, sudor: 0.7, brazoIzq: [0.9, 0.6], brazoDer: [0.6, 0.4] }, [-1, -0.3]);
    else this.verL("tu", SENTADO("tu", 0.3, 0.05), { ...LUNA, sentado: 1, ...MIEDO(f, 0.6), boca: "dientes", mirarY: 0.1, sudor: 0.8 }, [0, 1]);
  }
  /** don Chema: jala el cordón (nada), luego arranca y lleva el timón */
  chema(f: number, que: "jala" | "arranca" | "timon") {
    const lan = this.h.lancha;
    if (que === "timon") { this.verL("chema", SENTADO("chema", 0.3, -1.55), { ...LUNA, sentado: 1, ...MIEDO(f, 0.4), boca: "dientes", brazoIzq: [1.1, 0.6], brazoDer: [0.5, 0.3], mirarY: 0.1 }, [0, 1]); return; }
    // cada jalón: el mango sale 0.8 m hacia la mano y regresa
    const T = que === "jala" ? [fw(20) + 4, fw(22) + 4] : [fw(38) + 2], d = T.reduce((a, t) => Math.max(a, f >= t && f < t + 12 ? Math.sin((f - t) / 12 * Math.PI) : 0), 0);
    lan.cordon.scale.y = 1 + d * 0.8; lan.cordon.position.y = 0.5 * (1 + d * 0.8); lan.mango.position.y = 1 + d * 0.8;
    lan.jalon.rotation.set(-0.6, 0, -0.5);
    const arranco = f >= ARRANCA();
    this.verL("chema", [0.55, LAN.piso, -1.75], { ...LUNA, ...MIEDO(f, 0.4), boca: arranco ? "grito" : "dientes", bocaAbre: 0.7, sudor: 0.8, mirarX: -0.5, brazoDer: [1.2 + 1.1 * d, 0.2], brazoIzq: [0.6, 0.6], cuerpoX: 0.12 * d, agacha: 0.15 }, [0, -1]);
  }
  /** «una mano se agarra de la orilla»: el primer zombie llega a la punta, se agacha y se agarra de la borda */
  agarra(f: number) {
    const k = suave(fw(25), fw(27) + 4, f), p = zombiMuelle(f, 0);
    const pos: V3 = [lerp(p[0], 1.1, k), MUELLE.piso, lerp(Math.min(p[2], -4.6), -4.4, k)];
    this.ver("z1", pos, { ...LUNA, ...ZOMBI(f, 1), boca: "dientes", agacha: 0.55 * k, brazoIzq: [lerp(2.4, 1.0, k), 0.2], brazoDer: [lerp(2.4, 1.2, k), 0.2], cuerpoX: 0.2 * k }, [1, 0]);
    this.zombisMuelle(f, 6);
  }
  /** «le pega con el remo»: Chema se para con el remo, le da y el zombie sale volando hacia el muelle */
  remazo(f: number) {
    const h = this.h, t = f - GOLPE_REMO();
    const sube = suave(fw(31), GOLPE_REMO() - 4, f), golpe = suave(GOLPE_REMO() - 4, GOLPE_REMO(), f);
    h.lancha.remoA.visible = false; h.remoMano.visible = true;
    const mano = L([0.1, LAN.piso + 1.25, -0.6]);
    h.remoMano.position.set(...mano); h.remoMano.rotation.set(0, 0, 0);
    h.remoMano.rotateY(Math.PI / 2 + 0.2); h.remoMano.rotateX(lerp(0.3, -0.9, sube) + golpe * 1.8);
    this.verL("chema", [0.15, LAN.piso, -0.9], { ...LUNA, ...MIEDO(f, 0.2), boca: "grito", bocaAbre: 0.8, mirarX: -0.8, brazoIzq: [lerp(1.2, 2.8, sube) - golpe * 1.4, 0.2], brazoDer: [lerp(1.2, 2.8, sube) - golpe * 1.4, 0.2], cuerpoX: -0.18 * golpe }, [-1, 0]);
    // el zombie: agachado agarrado de la borda hasta el golpe; luego sale volando hacia atrás y cae al muelle
    const v = Math.max(0, t) / FPS;
    if (t < 0) this.ver("z1", [1.1, MUELLE.piso, -4.4], { ...LUNA, ...ZOMBI(f, 1), boca: "dientes", agacha: 0.55, brazoIzq: [1.0, 0.2], brazoDer: [1.2, 0.2], cuerpoX: 0.2 }, [1, 0]);
    else this.ver("z1", [1.1 - Math.min(2.2, v * 6), MUELLE.piso + Math.max(0, 1.0 * v * 4 - 9.8 * v * v), -4.4 - Math.min(0.6, v)], { ...LUNA, ...ZOMBI(f, 1), boca: "grito", ojosVacios: true, brazoIzq: [2.6, 0.2], brazoDer: [0.4, 0.6], piernas: [0.6, 0.3] }, [1, 0], Math.min(1.5, v * 5));
    this.zombisMuelle(f, 6);
    if (t >= 0 && t < 3) this.luz(...L([0.0, 1.2, -0.3]), 2.5, "#e8eeff");
  }
  /** desde la punta: los zombies se quedan en la orilla con los brazos estirados */
  punta(f: number) { for (let i = 0; i < 6; i++) { const p = PUNTA(i); this.ver(ZS[i], [p[0], p[1], p[2]], { ...LUNA, ...ZOMBI(f, i), boca: i % 2 ? "dientes" : "abierta", brazoIzq: [2.4 + 0.3 * Math.sin(f * 0.4 + i), 0.3], brazoDer: [2.4 - 0.3 * Math.sin(f * 0.37 + i), 0.3], cuerpoX: 0.05 * Math.sin(f * 0.5 + i) }, [0, 1], 0.04 * Math.sin(f * 0.3 + i)); } }
  enLanchaLejos(f: number) { this.chema(f, "timon"); this.tuLancha(f, "sentado"); }
  navegan(f: number) { this.chema(f, "timon"); this.tuLancha(f, "sentado"); }
  /** «contra las rocas»: la ola revienta en las piedras */
  ola(f: number) {
    const t = f - PEGA() + 3; if (t < 0 || t > 24) return;
    const h = this.h; h.salpicadura.position.set(CHOQUE.x + 0.3, 1.2 + t * 0.06, CHOQUE.z + 0.4); h.salpicadura.scale.set(3 + t * 0.15, 3.4 + t * 0.15, 1); h.mSalp.opacity = 0.9 * (1 - t / 24);
  }
  /** encallados: tú y Chema bajando de la lancha a las piedras; con `arriba`, ya están adentro (no se dibujan) */
  encallados(f: number, mirando = false, vacios = false) {
    if (vacios) return;
    this.ver("tu", L([-0.25, LAN.piso, 1.4]), { ...LUNA, ...MIEDO(f, 0.4), boca: "o", mirarY: mirando ? 0.1 : 0.5, sudor: 0.7 }, mirando ? [0, 1] : [0, 1]);
    this.cartas.tu.contacto.visible = false;
    this.verL("chema", [0.35, LAN.piso, 0.4], { ...LUNA, ...MIEDO(f, 0.3), boca: "dientes", mirarY: 0.4, brazoIzq: [0.6, 0.6] }, [0, 1]);
  }
  /** «Elías baja corriendo con una lámpara»: por la escalera de piedra, hacia la orilla */
  eliasBaja(f: number) {
    const u = Math.min(1, Math.max(0, (f - fw(60) + 6) / (fw(67) - fw(60) + 10)));
    const z = lerp(CHOQUE.z + 6.4, ESC_I.z0, u), kz = (z - ESC_I.z0) / ESC_I.paso; // pisa cada escalón (sin flotar entre uno y otro)
    const y = kz > 8.5 ? ISLA.alto : ESC_I.y0 + Math.min(8, Math.max(0, Math.round(kz))) * ESC_I.sube;
    const p: V3 = [0.6, y + brinco(f, 3, 0.9), z];
    this.ver("elias", p, { ...CALIDA, ...CORRE(f, 1, 0.9), brazoDer: [1.5, 0.3], boca: "abierta", bocaAbre: habla(f, 63, 67), mirarX: 0.2, cejasMiedo: 0.4 }, [0, -1]);
    this.lampara([p[0] - 0.42, p[1] + 1.0, p[2] - 0.12], 3);
  }
  lampara(p: V3, i: number) { const h = this.h; h.lamparaE.visible = true; h.lamparaE.position.set(...p); h.luzLamE.intensity = i; }
  // ---------------- adentro del faro
  /** «los mete y atranca la puerta»: la puerta se cierra; Elías levanta la tranca y la deja caer en sus soportes */
  atranca(f: number, k: number) {
    const h = this.h, cierra = suave(fw(68), fw(69) + 8, f), cae = suave(fw(71), fw(71) + 8, f);
    h.puerta.rotation.y = lerp(1.3, 0, empuje(cierra, 2));
    h.tranca.visible = true; h.tranca.position.set(0, lerp(1.75, 1.08, cae), -TORRE.r0 + TORRE.rIn + 0.13); h.tranca.rotation.z = 0.25 * (1 - cae);
    const fa = ISLA.alto, z0 = ISLA.z;
    this.ver("elias", [0.15, fa, z0 - 1.6], { ...CALIDA, ...MIEDO(f, 0.2), boca: "dientes", brazoIzq: [lerp(2.4, 1.6, cae), 0.2], brazoDer: [lerp(2.4, 1.6, cae), 0.2], mirarY: 0.2 }, [0, -1]);
    this.ver("chema", [-1.0, fa, z0 - 0.6], { ...CALIDA, ...MIEDO(f, 0.5), boca: "o", mirarX: 0.6, agacha: 0.25, sudor: 0.8, brazoIzq: [0.8, 0.8] }, [0.4, -1]);
    this.ver("tu", [-0.3, fa, z0 - 0.15], { ...CALIDA, ...MIEDO(f, 0.6), boca: "abierta", bocaAbre: 0.4 + 0.3 * Math.sin(f * 0.8), mirarX: -0.3, sudor: 0.9 }, [0, -1]);
    this.lampara([-1.4, fa + 0.47, z0 - 0.75], 3.5); // en el banco
    void k;
  }
  /** adentro, con la lámpara de Elías alumbrando la pared de las reglas */
  adentro(f: number, todos: boolean, caraTu = false) {
    const fa = ISLA.alto, z0 = ISLA.z;
    this.h.puerta.rotation.y = 0; this.h.tranca.visible = true; this.h.tranca.position.set(0, 1.08, -TORRE.r0 + TORRE.rIn + 0.13); this.h.tranca.rotation.z = 0;
    if (todos) {
      this.ver("elias", [0.65, fa, z0 + 0.6], { ...CALIDA, brazoDer: [2.3, 0.2], mirarY: 0.4, boca: "linea" }, [0, 1]);
      this.ver("tu", [-0.55, fa, z0 + 0.1], { ...CALIDA, ...MIEDO(f, 0.3), boca: "o", mirarY: 0.4 }, [0, 1]);
    }
    if (caraTu) this.ver("tu", [0.7, fa, z0 - 0.6], { ...CALIDA, ...MIEDO(f, 0.5), boca: "linea", mirarX: 0.2, mirarY: 0.25, sudor: 0.8 }, [0, 1]);
    const yL = todos ? 1.0 + 0.6 * suave(fw(74), fw(83), f) : 1.9;
    this.lampara(todos ? [0.35, fa + 1.15 + 0.6 * suave(fw(74), fw(83), f), z0 + 0.7] : [0.25, fa + yL, z0 + 0.9], 4.5);
  }
  // ---------------- el cuarto de la lámpara
  /** los tres en el cuarto: `prendida` = con la lámpara; `quietos`: tiesos, viendo hacia la ventana de la luna */
  arriba(f: number, prendida: boolean, quietos = false) {
    const on = lamparaEn(f) > 0.5, L0 = on ? CALIDA : OSCURO;
    const miedo = (q: Quien) => (quietos ? { ...MIEDO(f, on ? 0.15 : 0.5), boca: "linea" as const, parpadeo: false, respira: 0.2, mirarX: q === "tu" ? -0.8 : 0.7 } : { mirarX: q === "tu" ? -0.5 : 0.4 });
    const cuenta = (q: Quien, w: number) => (f >= fw(w) - 2 && f < fw(w) + 20 ? { ojos: 1.12, pupila: 0.18 } : {});
    this.ver("tu", CU(TH.tu, R_CU), { ...L0, ...miedo("tu"), ...cuenta("tu", 163), sudor: on ? 0.5 : 0.9, ...(f >= fw(198) - 2 ? { lagrimas: 0.4, boca: "dientes" } : {}) });
    // Chema: saca el encendedor (desde «saca») y Elías le agarra la mano (desde «agarra»)
    const saca = suave(fw(177), fw(179), f), agarra = suave(fw(182), fw(183) + 4, f), niega = f >= fw(186) - 2 && f < fw(190) ? Math.sin((f - fw(186)) * 0.5) : 0;
    this.ver("chema", CU(TH.chema, R_CU), { ...L0, ...miedo("chema"), ...cuenta("chema", 158), brazoDer: [lerp(0.2, 1.7, saca), 0.4], ...(saca > 0 ? { mirarX: 0.2, mirarY: -0.2 } : {}) });
    this.ver("elias", CU(TH.elias, R_CU), { ...L0, ...miedo("elias"), ...cuenta("elias", 161), brazoIzq: [lerp(0.2, 1.6, agarra), 0.1], cabezaX: 0.15 * niega, giro: 0.5 * niega, ...(agarra > 0 ? { boca: "dientes" } : {}) });
    if (saca > 0) { // el encendedor en la mano de Chema (y la chispa al hacer clic)
      const h = this.h, pc = new THREE.Vector3(...CU(TH.chema, R_CU)), cp = this.cam.position, hacia = cp.clone().sub(pc).setY(0).normalize(), der = new THREE.Vector3(hacia.z, 0, -hacia.x);
      const mano = pc.clone().addScaledVector(hacia, 0.12).addScaledVector(der, -0.1).setY(CUARTO.y + lerp(0.6, 0.95, saca));
      h.encendedor.visible = true; h.encendedor.position.copy(mano); h.encendedor.lookAt(cp); h.encendedor.scale.setScalar(1.6);
      const clic = f - fw(193) - 2; if (clic >= 0 && clic < 4) { h.chispa.material.opacity = 1 - clic / 4; h.chispa.scale.setScalar(0.5); h.luzEnc.intensity = 2.5 * (1 - clic / 4); }
    }
    void prendida;
  }
  /** el cuarto: alguien más, junto a la ventana, chorreando agua (el charco crece) */
  cuarto(f: number) {
    const h = this.h, p = CU(TH.ahogado, R_AH), voltea = suave(fw(196), fw(201), f);
    this.ver("ahogado", p, { ...OSCURO, ...ZOMBI(f, 0), boca: "linea", bocaAbre: 0, ojosVacios: true, vista: voltea > 0.5 ? "frente" : "espalda", giro: voltea > 0.5 ? lerp(-0.8, -0.3, voltea) : 0, brazoIzq: [0.1, -0.05], brazoDer: [0.1, -0.05], respira: 0.1 });
    h.charco.visible = true; const cr = 0.25 + 0.2 * suave(fw(165), fw(190), f); h.charco.scale.set(cr / 0.4, cr / 0.4, 1); h.charco.position.set(p[0] - ISLA.x, 0.012, p[2] - ISLA.z);
    h.gotas.forEach((g, i) => { const per = 18 + (i % 3) * 5, t = ((f + i * 7) % per) / per, x0 = (ruido(i) - 0.5) * 0.36; g.visible = true; g.position.set(p[0] - ISLA.x + x0, lerp(0.15 + ruido(i + 4) * 0.9, 0.02, t * t), p[2] - ISLA.z + 0.04); });
  }
  /** «alguien nada hacia la isla»: cabeza y hombros fuera del agua, brazadas, ondas */
  nada(f: number) {
    const z = 48 + (f - fw(137)) / FPS * 0.9, x = -4.2 + 0.1 * Math.sin(f * 0.1), brazo = Math.sin(f * 0.22);
    this.ver("ahogado", [x, -ALTO("ahogado") * 0.42 + 0.04 * Math.sin(f * 0.22), z], { ...LUNA, ...ZOMBI(f, 0), brazoIzq: [1.6 + 1.2 * brazo, 0.2], brazoDer: [1.6 - 1.2 * brazo, 0.2] }, [0, 1]);
    this.cartas.ahogado.contacto.visible = false;
    this.h.ondas.forEach((o, i) => { const t = ((f + i * 14) % 42) / 42; o.position.set(x, 0.03, z); o.scale.setScalar(0.4 + t * 1.6); (o.material as THREE.MeshBasicMaterial).opacity = 0.6 * (1 - t); });
  }
  luz(x: number, y: number, z: number, i: number, color = "#ffc890") { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; l.color.set(color); }

  luces(f: number, pl: Plano) {
    const h = this.h, Lg = pl.lugar, t = f / FPS;
    h.animarAgua(t);
    const lan = h.lancha, b = lanchaEn(f);
    lan.g.position.set(b.x, b.y, b.z); lan.g.rotation.set(b.pitch, b.yaw, b.roll, "YXZ");
    const corre = f >= ARRANCA() && f < PEGA();
    lan.helice.rotation.z = corre ? f * 1.7 : 0;
    const vel = corre ? Math.min(1, (f - ARRANCA()) / 20) : 0;
    lan.mEsp.opacity = 0.75 * vel; lan.mSal.opacity = 0.55 * vel * (0.7 + 0.3 * Math.sin(f * 0.9));
    lan.estela.scale.y = 0.4 + 0.6 * vel; lan.estela.position.z = LAN.popa - 6.2 * (0.4 + 0.6 * vel);
    const hu = f - ARRANCA(); lan.humo.material.opacity = hu >= 0 && hu < 30 ? 0.7 * (1 - hu / 30) : 0; lan.humo.position.y = LAN.borda + 0.4 + Math.max(0, hu) * 0.02; lan.humo.scale.setScalar(0.5 + Math.max(0, hu) * 0.05);
    // la cuerda de amarre: de la proa a la bita mientras está amarrada
    h.cuerdaAmarre.visible = f < ARRANCA();
    if (h.cuerdaAmarre.visible) { const a = new THREE.Vector3(...L([0, LAN.borda, LAN.proa - 0.3])), bb = new THREE.Vector3(MUELLE.x - 0.25, MUELLE.piso + 0.3, -2.0); h.cuerdaAmarre.position.copy(a).add(bb).multiplyScalar(0.5); h.cuerdaAmarre.scale.y = a.distanceTo(bb) / 1.3; h.cuerdaAmarre.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), bb.clone().sub(a).normalize()); }
    // la lámpara del faro: gira; se apaga a medianoche
    const on = lamparaEn(f);
    h.haces.rotation.y = f * 0.045; h.haces.visible = Lg === "afuera" && on > 0.5;
    h.foco.visible = on > 0.5; h.halo.visible = on > 0.5; h.mLenteOn.emissiveIntensity = on > 0.5 ? 0.9 : 0.02;
    h.mLenteOn.color.set(on > 0.5 ? "#f8e8c0" : "#5a6470");
    const cuarto = Lg === "cuarto", torre = Lg === "torre";
    h.luzLampara.intensity = on > 0.5 ? (cuarto ? 5 : 12) : 0;
    h.luzLuna.intensity = cuarto ? (on > 0.5 ? 0.4 : 1.5) : 0;
    h.amb.intensity = torre ? 0.14 : cuarto ? (on > 0.5 ? 0.3 : 0.1) : 0.5;
    h.hemi.intensity = torre ? 0.12 : cuarto ? (on > 0.5 ? 0.3 : 0.14) : 0.7;
    h.luna.intensity = torre ? 0 : cuarto ? (on > 0.5 ? 0.6 : 0.45) : 1.5;
    h.muelle.visible = !torre; h.vidrios.visible = true;
    h.luzMuelle.intensity = Lg === "afuera" ? 8 : 0;
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
const PORTADA_I = 29; // la silueta junto a la ventana
const PORTADA_F = () => fw(170);
const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? PORTADA_F() : f0;
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
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : FARO_CUADROS;
  const k = Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a)));
  mundo.f = f;
  // la lancha primero (las cámaras «en la lancha» se mueven con ella)
  const lb = lanchaEn(f), lg = mundo.h.lancha.g;
  lg.position.set(lb.x, lb.y, lb.z); lg.rotation.set(lb.pitch, lb.yaw, lb.roll, "YXZ"); lg.updateMatrixWorld(true); LAN_M.copy(lg.matrixWorld);
  let pos = pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3;
  let mira = pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3;
  if (pl.enLancha) { // la cámara va con la lancha, pero sin todo el bamboleo (para que no maree)
    const sinGiro = new THREE.Matrix4().compose(lg.position, new THREE.Quaternion().setFromEuler(new THREE.Euler(lb.pitch * 0.4, lb.yaw, lb.roll * 0.4, "YXZ")), new THREE.Vector3(1, 1, 1));
    const tr = (p: V3): V3 => { const v = new THREE.Vector3(...p).applyMatrix4(sinGiro); return [v.x, v.y, v.z]; };
    pos = tr(pos); mira = tr(mira);
  }
  const s = pl.sacude ? pl.sacude(f) : 0;
  if (s) { pos[0] += s * Math.sin(f * 1.3); pos[1] += s * Math.sin(f * 1.7 + 1); mira[0] += s * 1.5 * Math.sin(f * 1.1 + 2); } // ≈ 6 Hz: sacude sin vibrar cuadro a cuadro
  cam.position.set(...pos);
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.03; cam.far = 600; cam.updateProjectionMatrix();
  cam.lookAt(...mira);
  cam.updateMatrixWorld();
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  scene.background = new THREE.Color("#0a0f1c");
  scene.fog = pl.lugar === "torre" ? null : new THREE.Fog("#101827", 22, 120);
  mundo.reiniciar(cam);
  pl.hacer({ f, k, m: mundo });
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
  const reglas: [number, number, string][] = [[84, 94, "REGLA Nº 1"], [94, 107, "REGLA Nº 2"], [107, 121, "REGLA Nº 3"], [135, 144, "12:00 AM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "DÍA 3 · 6:50 PM · MUELLE SAN TELMO";
  if (f >= inicioPlano(3)) return null;
  const n = Math.round(Math.min(1, (f + 6) / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(194) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 38, padding: "12px 26px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)", whiteSpace: "nowrap" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
      {boton("VERLE LA CARA", "#2f63d2", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("NO DECIR NADA", "#c8263a", 4)}
    </div>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.03, far: 600 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Faro: React.FC = () => {
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
export const FaroPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 1.1, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", bottom: 0, width: "100%", height: 620, background: "linear-gradient(#05070c00, #05070cee 50%)" }} />
      <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center" }}>
        {linea("ÉRAMOS TRES", "#ffffff", 104)}
        {linea("EN EL FARO…", "#ffffff", 104)}
        {linea("CONTÉ CUATRO", "#ffd23a", 116)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void MUELLE;
