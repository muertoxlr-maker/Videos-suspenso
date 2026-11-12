// «El camión escolar» — animación completa. Mismo composer, tarjetas y capas de texto que «Velorio» (estándar §8 +
// §8.8), con la regla §8.6d (objetos que se entiendan). Lo nuevo: el camión se queda quieto y la carretera corre en z;
// lluvia (líneas fuera del camión, gotas en los vidrios, limpiaparabrisas); la puerta de dos hojas que SE ABRE; el
// espejo de atrás que refleja de verdad (render a textura) y se empaña; niños sentados en sus bancas (la cadera sobre
// el cojín, los pies colgando delante). Cada plano empieza 2 cuadros antes de su palabra.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction, BloomEffect, BrightnessContrastEffect, EffectComposer, EffectPass, HueSaturationEffect, RenderPass,
  ToneMappingEffect, ToneMappingMode, VignetteEffect,
} from "postprocessing";
import { InkPass, NOINK } from "../alejandro/ink";
import { LensBlur } from "../alejandro/lensblur";
import { Aspecto, Pose } from "../prueba_pasillo/personaje";
import { POSE, Tarjeta, lerp, parpadea, ruido, suave } from "../turno3/comun";
import { empuje, hablaGestos, tiembla } from "../comun/movimiento";
import { ASIENTO_X, ASIENTO_Y, BUS, CHOFER, ESPEJO, FILAS, PARADAS, crearEscenario } from "./camion";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const CAMION_CUADROS = Math.ceil(77.27 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes
const TU: Aspecto = { piel: "#c69a78", pelo: "#1d1512", ropa: "#2c4a7a", ropaInterior: "#e6e0d0", pantalon: "#2a2a30", zapatos: "#141012", peinado: "revuelto", prenda: "chamarra", gorra: "#1e2a44", barba: "sombra", semilla: 701 };
const SOFI: Aspecto = { piel: "#d8b090", pelo: "#2a1a12", coletas: "#e04a7a", ropa: "#f0ece2", ropaInterior: "#f0ece2", pantalon: "#2a3a6a", zapatos: "#1a1614", peinado: "mono", prenda: "uniforme", mochila: "#e8b81c", semilla: 703 };
const SOFI_SIN: Aspecto = { ...SOFI, mochila: undefined };
const VIEJO: Aspecto = { piel: "#b88a66", pelo: "#e6e2da", ropa: "#6a5a48", ropaInterior: "#e6e0d0", pantalon: "#3a342e", zapatos: "#141012", peinado: "recogido", prenda: "chamarra", gorra: "#5a5a50", bigote: true, arrugas: true, semilla: 705 };
const N23: Aspecto = { piel: "#1a1c22", pelo: "#0e0f12", ropa: "#15171c", ropaInterior: "#15171c", pantalon: "#0e0f12", zapatos: "#0b0c0f", peinado: "mono", cuello: "capucha", mojado: true, semilla: 707 };
const PIELES = ["#d8b496", "#c49a7a", "#a87a5a", "#8e6346", "#d2ae8e", "#b88a66"], PELOS = ["#1d1512", "#3a2a1e", "#141012", "#5a3a22"];
const PEINADOS: Aspecto["peinado"][] = ["revuelto", "trenza", "mono", "largo", "rizado", "recogido"];
const MOCHILAS = ["#c43a2c", "#2f6fb0", "#3a9a5a", "#8a4ab0", "#e07a20", "#2aa0a0", "#d04a8a"];
const NINO = (i: number, mojado = false): Aspecto => ({
  piel: PIELES[i % PIELES.length], pelo: PELOS[(i * 3) % PELOS.length], ropa: i % 3 === 0 ? "#7a2a3a" : "#f0ece2", ropaInterior: "#f0ece2", pantalon: "#2a3a6a", zapatos: "#1a1614",
  peinado: PEINADOS[(i * 5) % PEINADOS.length], prenda: i % 3 === 0 ? undefined : "uniforme", mochila: MOCHILAS[i % MOCHILAS.length], lentes: i === 4 || i === 11, mojado, semilla: 720 + i,
});
const AMARILLO = "#f0c21c";

// ------------------------------------------------------------------ planos
type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Clima = "dia" | "recuerdo" | "lluvia";
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; rapido?: boolean; clima: Clima; ruta: [number, number]; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);

// lugares: asientos (la cadera sobre el cojín: la cadera de la tarjeta queda a 0.197 de su alto), parada, puesto del chofer
const ALTOS = { tu: 1.68, sofi: 1.2, viejo: 1.66, n23: 1.16 } as const;
const sentadoEn = (lado: number, fila: number, alto: number): V3 => [lado * ASIENTO_X, ASIENTO_Y + 0.012 - 0.197 * alto, FILAS[fila] + 0.18];
const SOFI_POS = sentadoEn(1, 0, ALTOS.sofi);
const N23_POS = sentadoEn(1, 9, ALTOS.n23); // último asiento, del lado de la puerta (se ve por el pasillo, detrás del chofer)
const TU_POS: V3 = [CHOFER.x, 0.47 + 0.012 - 0.197 * ALTOS.tu, CHOFER.z + 0.15];
const BANQUETA = BUS.suelo + 0.11;
const PARADA_S = (k: number) => PARADAS[k] - 5; // camino recorrido cuando el poste queda 5 m adelante del camión (junto a la puerta)
const ASIENTOS_NINOS: [number, number][] = [[-1, 1], [1, 1], [-1, 2], [1, 2], [-1, 3], [1, 3], [-1, 4], [1, 4], [-1, 5], [1, 5], [-1, 6], [1, 6], [-1, 7], [1, 8]];
const ALTO_NINO = (i: number) => 1.18 + ((i * 7) % 5) * 0.03;
const ESPERAN: V3[] = [[2.45, BANQUETA, 4.3], [2.75, BANQUETA, 5.6]];
const TU2_POS: V3 = [2.45, BANQUETA, 8.5], VIEJO_POS: V3 = [2.55, BANQUETA, 9.65]; // el recuerdo: frente al cofre, en la banqueta
const CERCA_CHOFER = (dz = 0, fov = 46): Cam => c([-0.5, 1.33, 5.95 - dz], [-0.7, 1.15, 4.0], fov); // por fuera del parabrisas, a ~2 m (§8.5)
const CERCA_SOFI = (dz = 0, fov = 44): Cam => c([0.3, 1.45, 4.5 - dz], [0.68, 0.93, 2.68], fov); // por encima de la mampara, a ~1.9 m // niños que esperan junto al poste

const MANOS_VOLANTE: Partial<Pose> = { brazoIzq: [0.3, 1.35], brazoDer: [0.3, 1.35] };
const CHOFER_P: Partial<Pose> = { sentado: 1, ...MANOS_VOLANTE };

const PLANOS: Plano[] = [
  // 1 · Imagina que manejas el camión
  { w: 0, foco: 9, cInf: 4, clima: "dia", ruta: [0, 9], ini: c([4.2, 0.35, 14.5], [0.2, 0.6, 3.0], 50), fin: c([3.7, 0.45, 12.8], [0.2, 0.6, 3.0], 50),
    hacer: ({ f, m }) => { m.chofer(f, {}); m.ninos(f); m.ver("sofi", SOFI_POS, { sentado: 1 }); } },
  // 2 · escolar número siete
  { w: 4, foco: 2.6, cInf: 7, clima: "dia", ruta: [24, 9], ini: c([3.7, 0.95, 5.6], [1.25, 0.75, 2.2], 44), fin: c([3.4, 0.85, 4.6], [1.25, 0.7, 2.4], 42),
    hacer: ({ f, m }) => { m.chofer(f, {}); m.ninos(f); m.ver("sofi", SOFI_POS, { sentado: 1 }); } },
  // 3 · de tu pueblo.
  { w: 8, foco: 14, cInf: 3, clima: "dia", ruta: [44, 9], ini: c([-3.6, 6.5, 23], [0, -0.2, 2], 52), fin: c([-3.4, 6.1, 20.5], [0, -0.2, 2], 52),
    hacer: ({ f, m }) => { m.chofer(f, {}); } },
  // 4 · Veintidós niños,
  { w: 11, foco: 3.0, cInf: 6, clima: "dia", ruta: [60, 9], ini: c([0.1, 1.72, 3.35], [0, 0.8, -5], 62), fin: c([0.1, 1.7, 3.05], [0, 0.8, -5], 60),
    hacer: ({ f, m }) => { m.ninos(f, { mirarY: -0.1 }); } },
  // 5 · catorce paradas,
  { w: 13, foco: 6.5, cInf: 5, clima: "dia", ruta: [PARADA_S(0), 0], ini: c([3.5, 0.55, 11.5], [1.4, 0.4, 3.6], 48), fin: c([3.4, 0.55, 10.8], [1.4, 0.4, 3.6], 48),
    hacer: ({ f, k, m }) => { m.puerta(suave(0.15, 0.55, k)); m.esperan(f, false); m.chofer(f, {}); } },
  // 6 · y tu hija Sofi
  { w: 15, foco: 1.2, cInf: 9, clima: "dia", ruta: [70, 9], ini: CERCA_SOFI(0, 46), fin: CERCA_SOFI(0.15, 42),
    hacer: ({ f, m }) => { m.ver("sofi", SOFI_POS, { sentado: 1, boca: "amable", mirarX: -0.4, mirarY: -0.1, brazoIzq: [0.35, 1.1], brazoDer: [0.35, 1.1] }); m.ninos(f); } },
  // 7 · siempre en el primer asiento.
  { w: 19, foco: 1.6, cInf: 8, clima: "dia", ruta: [80, 9], ini: c([-0.3, 1.78, 4.6], [0.5, 0.8, 2.2], 56), fin: c([-0.28, 1.76, 4.5], [0.5, 0.8, 2.2], 54),
    hacer: ({ f, m }) => { m.ver("sofi", SOFI_POS, { sentado: 1, mirarX: 0.3, mirarY: -0.3, boca: "amable" }); m.ninos(f); } },
  // 8 · Tu primer día, el chofer viejo  (recuerdo: sol, camión parado en la parada)
  { w: 24, foco: 2.4, cInf: 7, clima: "recuerdo", ruta: [PARADA_S(0), 0], ini: c([-1.4, 0.55, 14.2], [2.3, 0.35, 8.9], 48), fin: c([-1.2, 0.55, 13.6], [2.3, 0.35, 8.9], 48),
    hacer: ({ f, m }) => { m.puerta(1); m.ver("tu2", TU2_POS, { mirarX: 0.5, boca: "amable" }, undefined, [-1, 0]); m.ver("viejo", VIEJO_POS, { mirarX: -0.5, boca: "linea" }, undefined, [-1, 0]); } },
  // 9 · te dio una hoja doblada:
  { w: 31, foco: 1.6, cInf: 8, clima: "recuerdo", ruta: [PARADA_S(0), 0], ini: c([0.2, 0.45, 11.8], [2.45, 0.3, 9.05], 42), fin: c([0.35, 0.45, 11.5], [2.45, 0.3, 9.05], 40),
    hacer: ({ f, k, m }) => { const a = suave(0.1, 0.5, k); m.puerta(1); m.ver("tu2", TU2_POS, { mirarX: 0.5, brazoIzq: [lerp(0.08, 0.7, a), -0.1] }, undefined, [-1, 0]); m.ver("viejo", VIEJO_POS, { mirarX: -0.5, sostiene: "hoja", brazoDer: [lerp(0.08, 0.95, a), -0.25] }, undefined, [-1, 0]); } },
  // 10 · «Si quieres seguir manejando,
  { w: 35, foco: 1.25, cInf: 9, clima: "recuerdo", ruta: [PARADA_S(0), 0], rapido: true, ini: c([0.6, 0.55, 11.2], [2.55, 0.45, 9.65], 44), fin: c([0.7, 0.53, 11.0], [2.55, 0.45, 9.65], 42),
    hacer: ({ f, m }) => { m.puerta(1); m.ver("viejo", VIEJO_POS, { mirarX: -0.6, cejasMiedo: 0.4, boca: "abierta", bocaAbre: habla(f, 35, 40), ...hablaGestos(f, 5, 0.5), sostiene: "hoja", brazoDer: [0.95, -0.25] }, undefined, [-1, 0]); } },
  // 11 · cumple esto».  (la hoja, ya pegada en el tablero)
  { w: 39, foco: 0.42, cInf: 10, clima: "dia", ruta: [90, 0], ini: c([-0.16, 1.32, 4.32], [-0.18, 0.96, 4.6], 34), fin: c([-0.17, 1.28, 4.36], [-0.18, 0.96, 4.6], 32),
    hacer: () => {} },
  // 12 · Regla número uno: cuenta a los niños
  { w: 41, foco: 1.6, cInf: 8, clima: "dia", ruta: [PARADA_S(0), 0], ini: c([0.1, 1.4, 2.95], [2.4, 0.15, 4.6], 52), fin: c([0.15, 1.38, 3.05], [2.4, 0.15, 4.6], 50),
    hacer: ({ f, k, m }) => { m.puerta(suave(0.05, 0.4, k)); m.esperan(f, false); m.chofer(f, { mirarX: 0.8 }); } },
  // 13 · cada vez que abres la puerta.
  { w: 48, foco: 0.85, cInf: 9, clima: "dia", ruta: [PARADA_S(0), 0], ini: c([-0.15, 1.36, 6.15], [-0.6, 1.1, 4.0], 52), fin: c([-0.18, 1.35, 6.0], [-0.6, 1.1, 4.0], 50),
    hacer: ({ f, k, m }) => { m.puerta(1); const n = Math.floor(k * 4); m.chofer(f, { mirarX: 0.6 - 0.15 * n, mirarY: 0.2, brazoIzq: [0.3, 1.35], brazoDer: [1.5, -0.2 + 0.08 * n], boca: "abierta", bocaAbre: 0.3 + 0.3 * Math.abs(Math.sin(f * 0.5)) }); } },
  // 14 · Si sobra uno, no lo digas en voz alta.
  { w: 54, foco: 0.7, cInf: 9, clima: "dia", ruta: [100, 9], ini: CERCA_CHOFER(0, 46), fin: CERCA_CHOFER(0.12, 44),
    hacer: ({ f, m }) => { m.chofer(f, { mirarX: 0.7, cejasMiedo: 0.6, boca: "linea", ...tiembla(f, 0.25) }); } },
  // 15 · Regla número dos: … no mires el espejo de atrás.
  { w: 63, foco: 0.55, cInf: 10, clima: "dia", ruta: [110, 9], ini: c([-0.62, 1.42, 4.0], [ESPEJO.x, ESPEJO.y - 0.05, ESPEJO.z], 40), fin: c([-0.55, 1.45, 4.1], [ESPEJO.x, ESPEJO.y - 0.03, ESPEJO.z], 36),
    hacer: ({ m }) => { m.espejoVivo = true; } },
  // 16 · Lo que va atrás quiere que lo veas.
  { w: 77, foco: 4, cInf: 5, clima: "dia", ruta: [120, 9], ini: c([0, 1.45, 2.7], [0, 1.0, -5.5], 50), fin: c([0, 1.4, 0.8], [0, 1.0, -5.5], 50),
    hacer: () => {} },
  // 17 · Regla número tres: si alguien te pide bajar en el puente viejo, no te detengas.
  { w: 85, foco: 20, cInf: 3, clima: "dia", ruta: [272, 0], ini: c([0.9, 1.35, 9.5], [0.3, 1.0, 38], 50), fin: c([0.85, 1.32, 11], [0.3, 1.0, 38], 48),
    hacer: () => {} },
  // 18 · Ahí no vive nadie desde hace cuarenta años.
  { w: 100, foco: 12, cInf: 4, clima: "dia", ruta: [272, 0], ini: c([1.2, 1.1, 63], [7.5, 0.9, 74], 42), fin: c([1.3, 1.1, 64.5], [7.5, 0.9, 74], 40),
    hacer: () => {} },
  // 19 · Hoy llueve.
  { w: 108, foco: 9, cInf: 4, clima: "lluvia", ruta: [100, 8], ini: c([-0.35, 1.45, 4.25], [-0.2, 0.9, 20], 56), fin: c([-0.35, 1.45, 4.35], [-0.2, 0.9, 20], 54),
    hacer: ({ f, m }) => { m.chofer(f, {}); } },
  // 20 · A las dos y media cuentas: veintidós.
  { w: 110, foco: 3.0, cInf: 6, clima: "lluvia", ruta: [118, 8], ini: c([0.1, 1.72, 3.35], [0, 0.8, -5], 62), fin: c([0.1, 1.7, 3.05], [0, 0.8, -5], 60),
    hacer: ({ f, m }) => { m.ninos(f, { mirarY: -0.1 }); } },
  // 21 · En la siguiente parada
  { w: 117, foco: 6.5, cInf: 5, clima: "lluvia", ruta: [PARADA_S(1), 0], ini: c([3.6, 0.7, 11.5], [1.4, 0.45, 3.6], 48), fin: c([3.5, 0.68, 10.8], [1.4, 0.45, 3.6], 48),
    hacer: ({ f, k, m }) => { m.puerta(suave(0.2, 0.6, k)); m.esperan(f, true); m.chofer(f, {}); } },
  // 22 · cuentas otra vez: veintitrés.
  { w: 121, foco: 3.0, cInf: 6, clima: "lluvia", ruta: [PARADA_S(1), 0], ini: c([0.1, 1.72, 3.25], [0, 0.8, -5], 60), fin: c([0.06, 1.68, 2.6], [0.1, 0.8, -5], 56),
    hacer: ({ f, m }) => { m.ninos(f, { mirarY: -0.1 }, 2); m.ver("n23", N23_POS, { sentado: 1, ojosVacios: true, parpadeo: false, mirarY: 0.2 }); } },
  // 23 · No dices nada.
  { w: 125, foco: 0.7, cInf: 9, clima: "lluvia", ruta: [160, 8], rapido: true, ini: CERCA_CHOFER(0, 46), fin: CERCA_CHOFER(0.2, 40),
    hacer: ({ f, m }) => { m.chofer(f, { mirarX: 0.2, ojos: 1.08, pupila: 0.24, cejasMiedo: 0.8, boca: "linea", sudor: 0.6, ...tiembla(f, 0.4) }); } },
  // 24 · Catorce paradas después,
  { w: 128, foco: 9, cInf: 4, clima: "lluvia", ruta: [200, 9], ini: c([4.2, 0.4, 14.5], [0.2, 0.6, 3.0], 50), fin: c([3.8, 0.5, 13], [0.2, 0.6, 3.0], 50),
    hacer: ({ f, m }) => { m.chofer(f, {}); m.ver("sofi", SOFI_POS, { sentado: 1, ...DUERME(f) }); } },
  // 25 · el camión queda vacío.
  { w: 131, foco: 3.0, cInf: 6, clima: "lluvia", ruta: [215, 9], ini: c([0.1, 1.6, 3.35], [0, 0.85, -5], 62), fin: c([0.1, 1.58, 3.0], [0, 0.85, -5], 60),
    hacer: () => {} },
  // 26 · Solo Sofi, adelante, dormida,
  { w: 135, foco: 1.6, cInf: 8, clima: "lluvia", ruta: [222, 9], ini: c([0.35, 1.58, 4.55], [0.35, 0.85, 0.5], 58), fin: c([0.35, 1.56, 4.45], [0.35, 0.85, 0.5], 56),
    hacer: ({ f, m }) => { m.ver("sofi", SOFI_POS, { sentado: 1, ...DUERME(f), abraza: AMARILLO }); } },
  // 27 · abrazando su mochila amarilla.
  { w: 139, foco: 1.15, cInf: 9, clima: "lluvia", ruta: [228, 9], ini: CERCA_SOFI(0, 44), fin: CERCA_SOFI(0.2, 38),
    hacer: ({ f, m }) => { m.ver("sofi", SOFI_POS, { sentado: 1, ...DUERME(f), abraza: AMARILLO }); } },
  // 28 · El espejo de atrás se empaña solo.
  { w: 143, foco: 0.55, cInf: 10, clima: "lluvia", ruta: [235, 9], ini: c([-0.62, 1.42, 4.0], [ESPEJO.x, ESPEJO.y - 0.05, ESPEJO.z], 38), fin: c([-0.52, 1.46, 4.15], [ESPEJO.x, ESPEJO.y - 0.03, ESPEJO.z], 32),
    hacer: ({ f, k, m }) => { m.espejoVivo = true; m.vaho(suave(0.15, 0.85, k) * 0.88); m.ver("n23", N23_POS, { sentado: 1, ojosVacios: true, parpadeo: false, abraza: AMARILLO, mirarY: 0.2 }); m.ver("sofi", SOFI_POS, { sentado: 1, ...DUERME(f), abraza: AMARILLO }); } },
  // 29 · Desde el último asiento, una vocecita:
  { w: 150, foco: 5, cInf: 5, clima: "lluvia", ruta: [242, 9], ini: c([0, 1.45, 2.6], [0.55, 0.85, -4.5], 46), fin: c([0, 1.42, 0.9], [0.55, 0.85, -4.5], 44),
    hacer: ({ f, m }) => { m.ver("n23", N23_POS, { sentado: 1, ojosVacios: true, parpadeo: false, abraza: AMARILLO, mirarY: 0.2 }); m.parpadeoLuz = true; } },
  // 30 · «Papá, ¿me bajas en el puente? Ya llegamos».
  { w: 156, foco: 0.7, cInf: 9, clima: "lluvia", ruta: [248, 7], ini: CERCA_CHOFER(0, 46), fin: CERCA_CHOFER(0.1, 44),
    hacer: ({ f, m }) => { m.chofer(f, { mirarX: 0.0, ojos: 1.12, pupila: 0.2, cejasMiedo: 1, boca: "linea", sudor: 0.8, hombros: 0.4 }); } },
  // 31 · Es la voz de Sofi.
  { w: 164, foco: 0.62, cInf: 9, clima: "lluvia", ruta: [252, 6], rapido: true, ini: CERCA_CHOFER(0.05, 42), fin: CERCA_CHOFER(0.3, 36),
    hacer: ({ f, m }) => { m.chofer(f, { mirarX: 0.1, ojos: 1.15, pupila: 0.18, cejasMiedo: 1, boca: "o", sudor: 1, hombros: 0.6, ...tiembla(f, 0.7) }); } },
  // 32 · Miras el primer asiento.
  { w: 169, foco: 0.85, cInf: 9, clima: "lluvia", ruta: [255, 6], ini: c([-0.15, 1.36, 6.1], [-0.6, 1.12, 4.0], 48), fin: c([-0.17, 1.35, 6.0], [-0.6, 1.12, 4.0], 46),
    hacer: ({ f, k, m }) => { const g = suave(0.1, 0.5, k); m.chofer(f, { giro: -0.75 * g, mirarX: -0.9 * g, ojos: 1.12, pupila: 0.2, cejasMiedo: 1, boca: "linea", sudor: 1 }); } },
  // 33 · Sofi sigue dormida…
  { w: 173, foco: 1.15, cInf: 9, clima: "lluvia", ruta: [258, 6], ini: CERCA_SOFI(0, 44), fin: CERCA_SOFI(0.1, 42),
    hacer: ({ f, m }) => { m.ver("sofi", SOFI_POS, { sentado: 1, ...DUERME(f), brazoIzq: [0.35, 1.25], brazoDer: [0.35, 1.25] }, SOFI_SIN); } },
  // 34 · pero la mochila amarilla ya no está.
  { w: 176, foco: 0.9, cInf: 9, clima: "lluvia", ruta: [261, 6], rapido: true, ini: CERCA_SOFI(0.1, 40), fin: CERCA_SOFI(0.35, 32),
    hacer: ({ f, m }) => { m.ver("sofi", SOFI_POS, { sentado: 1, ...DUERME(f), brazoIzq: [0.35, 1.25], brazoDer: [0.35, 1.25] }, SOFI_SIN); } },
  // 35 · El puente aparece entre la lluvia.
  { w: 183, foco: 12, cInf: 4, clima: "lluvia", ruta: [250, 7], ini: c([-0.35, 1.45, 4.3], [-0.6, 1.0, 30], 54), fin: c([-0.35, 1.45, 4.4], [-0.6, 1.1, 30], 50),
    hacer: ({ f, m }) => { m.chofer(f, {}); } },
  // 36 · ¿Te detienes... o sigues manejando?
  { w: 189, foco: 0.9, cInf: 8, clima: "lluvia", ruta: [264, 6], ini: c([-0.6, 1.45, 6.7], [-0.25, 1.05, 1.5], 52), fin: c([-0.6, 1.43, 6.4], [-0.25, 1.05, 1.5], 50),
    hacer: ({ f, m }) => { m.chofer(f, { mirarX: 0.3, ojos: 1.15, pupila: 0.18, cejasMiedo: 1, boca: "linea", sudor: 1, hombros: 0.7, ...tiembla(f, 0.5) }); m.ver("n23", N23_POS, { sentado: 1, ojosVacios: true, parpadeo: false, abraza: AMARILLO }); m.ver("sofi", SOFI_POS, { sentado: 1, ...DUERME(f), brazoIzq: [0.35, 1.25], brazoDer: [0.35, 1.25] }, SOFI_SIN); } },
];
const DUERME = (f: number): Partial<Pose> => ({ parpadeo: true, mirarY: 0.6, cabezaX: 0.07, hombros: 0.3, respira: 0.5 + 0.5 * Math.sin(f * 0.05), boca: "linea" });
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

// ------------------------------------------------------------------ mundo (estado por cuadro)
type Quien = "tu" | "tu2" | "sofi" | "viejo" | "n23" | `k${number}` | `e${number}`;
const CLIMAS: Record<Clima, { fondo: string; niebla: [number, number]; amb: number; hemi: number; sol: number; solColor: string; interior: number; faros: boolean; lluvia: boolean }> = {
  dia: { fondo: "#aab4bc", niebla: [35, 170], amb: 0.32, hemi: 0.95, sol: 1.1, solColor: "#fff4e0", interior: 0, faros: false, lluvia: false },
  recuerdo: { fondo: "#d8c8a8", niebla: [40, 190], amb: 0.36, hemi: 1.0, sol: 1.6, solColor: "#ffe2b0", interior: 0, faros: false, lluvia: false },
  lluvia: { fondo: "#3c4854", niebla: [14, 110], amb: 0.2, hemi: 0.42, sol: 0.35, solColor: "#c8d4e0", interior: 0.9, faros: true, lluvia: true },
};

class Mundo {
  h = crearEscenario();
  cartas = new Map<string, Tarjeta>();
  f = 0;
  espejoVivo = false;
  parpadeoLuz = false;
  limpiasQuietas = false;
  private camPos = new THREE.Vector3();
  private carta(q: string, a: Aspecto, alto: number) {
    const k = q + "|" + (a.mochila ?? "-");
    let t = this.cartas.get(k);
    if (!t) { t = new Tarjeta(a, alto); t.sombraLarga.visible = false; this.h.raiz.add(t.grupo); this.cartas.set(k, t); }
    return t;
  }
  reiniciar(cam: THREE.Camera) {
    this.camPos.copy(cam.position);
    for (const t of this.cartas.values()) t.grupo.visible = false;
    this.h.luzExtra.intensity = 0;
    this.espejoVivo = false; this.parpadeoLuz = false; this.limpiasQuietas = false;
    this.vaho(0); this.puerta(0);
  }
  ver(q: Quien, pos: V3, pose: Partial<Pose>, aspecto?: Aspecto, haciaDonde?: [number, number]) {
    const base = q === "tu" || q === "tu2" ? [TU, ALTOS.tu] : q === "sofi" ? [SOFI, ALTOS.sofi] : q === "viejo" ? [VIEJO, ALTOS.viejo] : q === "n23" ? [N23, ALTOS.n23]
      : q.startsWith("k") ? [NINO(+q.slice(1)), ALTO_NINO(+q.slice(1))] : [NINO(+q.slice(1) + 30, this.clima === "lluvia"), ALTO_NINO(+q.slice(1) + 3)];
    const t = this.carta(q, aspecto ?? (base[0] as Aspecto), base[1] as number);
    t.grupo.visible = true; t.grupo.position.set(...pos);
    t.contacto.visible = pos[1] <= BANQUETA + 0.01; // sentados: sin sombra en el piso (los pies cuelgan)
    t.grupo.rotation.y = Math.atan2(this.camPos.x - pos[0], this.camPos.z - pos[2]);
    const mira = haciaDonde ?? [0, 1]; // adentro miran al frente; afuera, según el plano
    const espalda = (this.camPos.x - pos[0]) * mira[0] + (this.camPos.z - pos[2]) * mira[1] < 0;
    t.dibujar({ ...POSE, parpadeo: parpadea(this.f, q.length * 7 + pos[2] * 3), luzX: -1, ...this.luzPose(), ...pose, ...(espalda ? { vista: "espalda" as const } : {}) });
  }
  clima: Clima = "dia";
  luzPose(): Partial<Pose> { return this.clima === "lluvia" ? { borde: "#ffe8c0" } : {}; }
  chofer(f: number, pose: Partial<Pose>) { if (this.camPos.z > BUS.frente && this.camPos.z < BUS.nariz + 1.5) this.limpiasQuietas = true; this.ver("tu", TU_POS, { ...CHOFER_P, respira: 0.5 + 0.5 * Math.sin(f * 0.07), ...pose }); }
  ninos(f: number, pose: Partial<Pose> = {}, desde = 0) {
    ASIENTOS_NINOS.forEach(([lado, fila], i) => {
      if (i < desde) return;
      const alto = ALTO_NINO(i);
      this.ver(`k${i}`, sentadoEn(lado, fila, alto), { sentado: 1, respira: 0.5 + 0.5 * Math.sin(f * 0.08 + i), mirarX: (ruido(i) - 0.5) * 0.8, boca: i % 4 === 0 ? "amable" : "linea", ...pose });
    });
  }
  esperan(f: number, mojados: boolean) { ESPERAN.forEach((p, i) => this.ver(`e${i}`, p, { mirarX: -0.6, respira: 0.5 + 0.5 * Math.sin(f * 0.1 + i), ...(mojados ? { hombros: 0.4, cejasMiedo: 0.3 } : {}) }, undefined, [0, 1])); }
  puerta(a: number) { const [h1, h2] = this.h.bus.hojas; h1.rotation.y = -1.3 * a; h2.rotation.y = 1.3 * a; }
  vaho(a: number) { (this.h.bus.vaho.material as THREE.MeshBasicMaterial).opacity = a; }
  ambiente(f: number, clima: Clima, s: number, v: number, scene: THREE.Scene) {
    this.clima = clima;
    const C = CLIMAS[clima], h = this.h;
    scene.background = new THREE.Color(C.fondo);
    scene.fog = new THREE.Fog(C.fondo, C.niebla[0], C.niebla[1]);
    h.amb.intensity = C.amb; h.hemi.intensity = C.hemi; h.sol.intensity = C.sol; h.sol.color.set(C.solColor);
    const tit = this.parpadeoLuz ? (ruido(Math.floor(f / 3)) > 0.82 ? 0.25 : 1) : 1; // las luces de adentro titilan
    h.bus.luzInt.forEach((l) => (l.intensity = C.interior * tit));
    h.bus.lucesTecho.forEach((l) => (l.visible = C.interior > 0 && tit > 0.5));
    h.bus.luzFaros.intensity = C.faros ? 6 : 0;
    h.bus.faros.forEach((o) => { if (o instanceof THREE.Sprite) o.material.opacity = C.faros ? 0.55 : 0; });
    h.lluvia.lineas.visible = C.lluvia; if (C.lluvia) h.lluvia.mover(f);
    h.bus.mGotas.opacity = C.lluvia ? 0.7 : 0; h.bus.mGotasPara.opacity = C.lluvia ? (this.limpiasQuietas ? 0.1 : 0.4) : 0; // por fuera del parabrisas, apenas (la cara se ve clara)
    (h.bus.mGotas.map as THREE.Texture).offset.y = C.lluvia ? -f * 0.004 : 0; (h.bus.mGotasPara.map as THREE.Texture).offset.y = C.lluvia ? -f * 0.002 : 0;
    // limpiaparabrisas: barren solo con lluvia
    const barre = C.lluvia && !this.limpiasQuietas; // en los acercamientos al chofer se quedan abajo (no le pasan por la cara)
    h.bus.limpias.forEach((l, i) => (l.rotation.z = barre ? 1.4 - 1.25 * Math.abs(Math.sin(f * 0.11 + i * 0.15)) : 1.45));
    // la carretera corre; las llantas giran
    h.carretera.g.position.z = -s;
    h.bus.llantas.forEach((ll) => (ll.rotation.x = s / 0.5));
    const fuera = Math.abs(this.camPos.x) > 2.3 || this.camPos.z > BUS.nariz + 1.1 || this.camPos.z < BUS.atras - 1; // la cámara va en la calle, no en el camión
    h.bus.g.position.y = v > 0 && fuera ? 0.006 * Math.sin(f * 0.35) : 0; // se mece un poquito al andar (visto desde fuera)
    for (const t of this.cartas.values()) if (t.grupo.visible && t.grupo.position.x < 1.6) t.grupo.position.y += h.bus.g.position.y;
  }
}

// ------------------------------------------------------------------ escena 3D
const PORTADA_C = c([-0.5, 1.47, 6.5], [-0.3, 0.92, 1.5], 44); // por fuera del parabrisas: el chofer arriba y, al fondo del pasillo, el niño 23; el título va sobre el cofre
const PORTADA: Plano = { ...PLANOS[35], foco: 2.5, cInf: 6, ini: PORTADA_C, fin: PORTADA_C };

const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? fw(192) : f0;
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => new Mundo(), []);
  const espejo = useMemo(() => {
    const rt = new THREE.WebGLRenderTarget(640, 166, { samples: 2 });
    const camE = new THREE.PerspectiveCamera(24, 0.5 / 0.13, 0.05, 40);
    rt.texture.wrapS = THREE.RepeatWrapping; rt.texture.repeat.x = -1; rt.texture.offset.x = 1;
    const mat = mundo.h.bus.cristal.material as THREE.MeshBasicMaterial; mat.map = rt.texture; mat.color.set("#ffffff"); mat.needsUpdate = true;
    return { rt, camE };
  }, [mundo]);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 1.5, distFar: 14 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.0, luminanceThreshold: 0.62, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    sat: new HueSaturationEffect({ saturation: -0.1 }),
    luz: new BrightnessContrastEffect({ brightness: -0.01, contrast: 0.16 }),
    vin: new VignetteEffect({ offset: 0.3, darkness: 0.7 }),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const composer = useMemo(() => {
    const cc = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    cc.addPass(new RenderPass(scene, cam)); cc.addPass(fx.ink);
    cc.addPass(new EffectPass(cam, fx.lens.pre)); cc.addPass(new EffectPass(cam, fx.lens.main));
    cc.addPass(new EffectPass(cam, fx.bloom, fx.tone, fx.sat, fx.luz, fx.vin));
    return cc;
  }, [gl, scene, cam, fx]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size.width, size.height]);
  useFrame(() => {
    if (mundo.espejoVivo) { // lo que se ve en el espejo de atrás: el pasillo hacia la parte de atrás del camión
      const { cristal, vaho } = mundo.h.bus;
      cristal.visible = false; vaho.visible = false;
      espejo.camE.position.set(ESPEJO.x, ESPEJO.y - 0.02, ESPEJO.z - 0.05);
      espejo.camE.lookAt(-0.15, 1.15, BUS.atras); espejo.camE.layers.enableAll();
      gl.setRenderTarget(espejo.rt); gl.clear(); gl.render(scene, espejo.camE); gl.setRenderTarget(null);
      cristal.visible = true; vaho.visible = true;
    }
    composer.render();
  }, 1);

  const i = planoEn(f);
  const pl = portada ? PORTADA : PLANOS[i];
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : CAMION_CUADROS;
  const k0 = portada ? 1 : (f - a) / Math.max(1, b - a);
  const k = pl.rapido ? empuje(k0, 3) : k0;
  cam.position.set(...(pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3));
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.03; cam.far = 220; cam.updateProjectionMatrix();
  cam.lookAt(...(pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3));
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  mundo.f = f;
  mundo.reiniciar(cam);
  mundo.clima = pl.clima;
  pl.hacer({ f, k: k0, m: mundo });
  const s = pl.ruta[0] + pl.ruta[1] * (f - a) / FPS;
  mundo.ambiente(f, pl.clima, s, pl.ruta[1], scene);
  if (portada) mundo.h.bus.mGotasPara.opacity = 0.04; // casi sin gotas: la cara del chofer limpia
  mundo.h.bus.cristal.parent!.visible = !portada; // desde fuera solo se vería la espalda negra del espejo
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
  const reglas: [number, number, string][] = [[24, 39, "TU PRIMER DÍA"], [41, 63, "REGLA Nº 1"], [63, 85, "REGLA Nº 2"], [85, 108, "REGLA Nº 3"], [108, 117, "HOY · 2:30 PM"], [128, 135, "4:40 PM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Cuenta: React.FC<{ f: number }> = ({ f }) => { // «veintidós … veintitrés»: el número grande en pantalla
  const nums: [number, string][] = [[116, "22"], [124, "23"]];
  const n = [...nums].reverse().find(([w]) => f >= fw(w) - 1);
  if (!n || f > fin(n[0]) + 14 || (n[0] === 116 && f >= fw(117) - 2)) return null;
  const k = Math.min(1, (f - fw(n[0]) + 1) / 4);
  return <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 230, color: n[1] === "23" ? "#ffd23a" : "#ffffff", transform: `scale(${1.3 - 0.3 * k})`, opacity: k, ...contornoTexto(14) }}>{n[1]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "LUNES · CAMIÓN ESCOLAR 7 · RUTA DEL PUEBLO";
  if (f >= inicioPlano(2)) return null;
  const n = Math.round(Math.min(1, f / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Recuerdo: React.FC<{ f: number }> = ({ f }) => { // tono de recuerdo (sepia tenue) en «Tu primer día»
  if (f < inicioPlano(7) || f >= inicioPlano(10)) return null;
  return <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(180,130,60,0.10) 40%, rgba(60,36,12,0.45) 100%)", mixBlendMode: "multiply" }} />;
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(189) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 40, padding: "12px 34px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
      {boton("TE DETIENES", "#2f63d2", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("SIGUES", "#c8263a", 4)}
    </div>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.03, far: 220 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Camion: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0a0806" }}>
      <Lienzo3D />
      <Recuerdo f={f} />
      <Rotulo f={f} />
      <Titulo f={f} />
      <Cuenta f={f} />
      <Botones f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
// Portada: tú al volante, aterrado; atrás, en el último asiento, la silueta con la mochila amarilla.
export const CamionPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 1.1, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#0a0806" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", top: 1060, width: "100%", height: 860, background: "linear-gradient(#0a080600, #0a0806ee 40%)" }} />
      <div style={{ position: "absolute", top: 1190, width: "100%", textAlign: "center" }}>
        {linea("SI SOBRA UN NIÑO", "#ffffff", 100)}
        {linea("EN EL CAMIÓN,", "#ffffff", 100)}
        {linea("NO LO DIGAS", "#ffd23a", 130)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
