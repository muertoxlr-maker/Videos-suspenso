// «Mary Celeste» — mini documental de un caso real (1872). Narrador en tercera persona; una frase de gancho y luego
// todo en orden. Mismo composer, tarjetas, capas de texto y acabado aprobado que «Hinterkaifeck» (§8.9: personajes
// ref7, lugares gastados, LUT frío, SIN puntitos). Lugares: el mar (el bergantín por fuera), la cubierta, el camarote
// del capitán, el rancho de los marineros, la bodega, el puerto de Nueva York, el estudio del escritor y un mapa.
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
import { POSE, Tarjeta, lerp, parpadea, suave } from "../turno3/comun";
import { tiembla } from "../comun/movimiento";
import { B, BODEGA, CAMAROTE, ESCOTILLA, ESTUDIO, LITERA, RANCHO, crearEscenario } from "./barco";
import PALABRAS from "./palabras.json";

export const FPS = 30;
const P = ((PALABRAS as unknown as { palabras?: unknown }).palabras ?? PALABRAS) as { txt: string; ini: number; fin: number }[];
export const MARY_CUADROS = Math.ceil((P[P.length - 1].fin + 0.6) * FPS);
const fw = (i: number) => Math.round(P[i].ini * FPS);

// ------------------------------------------------------------------ personajes (todos ref7; marinos de 1872; no se parecen a nadie real)
const MAR = (n: number, ropa: string, extra: Partial<Aspecto>): Aspecto => ({ piel: ["#d4a888", "#c89a78", "#dcb898", "#b88a68", "#e0bc9c", "#c49474", "#d8b090"][n % 7], pelo: ["#3a2a1e", "#5a4a3a", "#2a2018", "#7a5a3a", "#1e1a16", "#8a6a4a", "#4a3a2a"][n % 7], ropa, ropaInterior: "#d8d0bc", pantalon: ["#34302c", "#2e3440", "#3a3530"][n % 3], zapatos: "#2a2018", peinado: "revuelto", prenda: "camisa", estilo: "ref7", semilla: 1520 + n, ...extra });
const BRIGGS: Aspecto = { piel: "#d4aa88", pelo: "#4a3020", ropa: "#1e2a40", ropaInterior: "#e0d8c4", pantalon: "#1e2230", zapatos: "#1a1614", peinado: "revuelto", prenda: "uniforme", gorra: "#1a2030", bigote: true, barba: "candado", estilo: "ref7", semilla: 1501 };
const SARAH: Aspecto = { piel: "#e2c0a0", pelo: "#5a3a22", ropa: "#4a3a5a", ropaInterior: "#e8e0cc", pantalon: "#3a2e40", zapatos: "#2a2018", peinado: "recogido", estilo: "ref7", semilla: 1503 };
const SOPHIA: Aspecto = { piel: "#ecc8a8", pelo: "#a87a4a", ropa: "#7a9ac0", ropaInterior: "#f0e8d8", pantalon: "#e8e0d0", zapatos: "#3a2a20", peinado: "rizado", estilo: "ref7", semilla: 1505 };
const MOREHOUSE: Aspecto = { piel: "#d0a080", pelo: "#3a3028", ropa: "#2a2e2a", ropaInterior: "#d8d0bc", pantalon: "#2a2a28", zapatos: "#1a1614", peinado: "revuelto", prenda: "chamarra", sombrero: "#1e1e1e", bigote: true, arrugas: true, estilo: "ref7", semilla: 1511 };
const DEVEAU: Aspecto = { piel: "#d8b090", pelo: "#2a2018", ropa: "#3a4a5a", ropaInterior: "#d8d0bc", pantalon: "#2e3038", zapatos: "#1a1614", peinado: "revuelto", prenda: "chamarra", gorra: "#2a2e3a", barba: "sombra", estilo: "ref7", semilla: 1513 };
const DOYLE: Aspecto = { piel: "#e0b898", pelo: "#3a2a1e", ropa: "#4a3a2e", ropaInterior: "#e8e0cc", pantalon: "#3a3028", zapatos: "#1a1614", peinado: "revuelto", prenda: "chamarra", bigote: true, estilo: "ref7", semilla: 1531 };
const SOMBRA: Aspecto = { piel: "#16181e", pelo: "#0c0c10", ropa: "#101216", ropaInterior: "#101216", pantalon: "#0c0e12", zapatos: "#08080a", peinado: "revuelto", prenda: "camisa", gorra: "#0c0c10", estilo: "ref7", semilla: 1541 };
const CARTAS = {
  briggs: [BRIGGS, 1.78], sarah: [SARAH, 1.63], sophia: [SOPHIA, 0.92],
  m1: [MAR(0, "#d8d0bc", { gorra: "#3a3a4a" }), 1.76], m2: [MAR(1, "#3a4a6a", { barba: "sombra" }), 1.72], m3: [MAR(2, "#8a3a2a", { sombrero: "#2a2a2a" }), 1.78], m4: [MAR(3, "#c8c0a8", { bigote: true }), 1.7],
  m5: [MAR(4, "#4a5a4a", { gorra: "#5a3a2a" }), 1.74], m6: [MAR(5, "#2a3a5a", { barba: "candado" }), 1.75], m7: [MAR(6, "#6a5a48", { gorra: "#2a2e3a", arrugas: true }), 1.73],
  morehouse: [MOREHOUSE, 1.8], deveau: [DEVEAU, 1.77], d1: [MAR(8, "#5a4a3a", { gorra: "#3a3228", bigote: true }), 1.74], d2: [MAR(9, "#3a4a40", { barba: "sombra" }), 1.72],
  doyle: [DOYLE, 1.86], s1: [SOMBRA, 1.78], s2: [{ ...SOMBRA, semilla: 1543, gorra: undefined }, 1.74], s3: [{ ...SOMBRA, semilla: 1545 }, 1.8],
} as const;
type Quien = keyof typeof CARTAS;
const ALTO = (q: Quien) => CARTAS[q][1];
const DIA: Partial<Pose> = { luzX: -1, borde: "#e8eeff" };
const NOCHE: Partial<Pose> = { luzX: -1, borde: "#a8c0ff" };
const CALIDA: Partial<Pose> = { luzX: 1, borde: "#ffd7a0" };
const SILUETA: Partial<Pose> = { luzX: -1, borde: "#5a6a8a", parpadeo: false };
const MIEDO = (f: number, k = 0.4): Partial<Pose> => ({ ojos: 1.1, pupila: 0.2, ojeras: 0.3, cejasMiedo: 0.8, ...tiembla(f, k) });
const CAMINA = (f: number, n: number, v = 0.35): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v + n)) * 0.6, Math.max(0, -Math.sin(f * v + n)) * 0.6], brazoIzq: [0.25 + 0.2 * Math.sin(f * v + n), 0.3], brazoDer: [0.25 - 0.2 * Math.sin(f * v + n), 0.3] });

type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Lugar = "mar" | "camarote" | "rancho" | "bodega" | "estudio";
type Hora = "dia" | "niebla" | "tarde" | "noche";
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; lugar: Lugar; hora?: Hora; mece?: number; balanceo?: number; viento?: number; mapa?: boolean; ease?: (k: number) => number; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const CA = (x: number, y: number, z: number): V3 => [CAMAROTE.x + x, y, CAMAROTE.z + z];
const RA = (x: number, y: number, z: number): V3 => [RANCHO.x + x, y, RANCHO.z + z];
const BO = (x: number, y: number, z: number): V3 => [BODEGA.x + x, y, BODEGA.z + z];
const ES = (x: number, y: number, z: number): V3 => [ESTUDIO.x + x, y, ESTUDIO.z + z];
const SENTADO = (q: Quien, x: number, z: number, asiento: number): V3 => [x, asiento + 0.012 - 0.197 * ALTO(q), z];
const Y = B.cubierta;
/** el Dei Gratia: lejos, a babor, con la proa hacia el Mary Celeste (+x); punto de su cubierta (coordenadas propias) */
const DG = { x: -140, z: 30, giro: Math.PI / 2 };
const enDG = (x: number, y: number, z: number): V3 => [DG.x + z * Math.sin(DG.giro) + x * Math.cos(DG.giro), y, DG.z + z * Math.cos(DG.giro) - x * Math.sin(DG.giro)];
/** el bote salvavidas de la teoría (detrás de la popa) */
const BOTE = { x: 0.9, z: -29 };

const PLANOS: Plano[] = [
  // 0 · Mary Celeste: el barco fantasma más famoso de la historia.  (el bergantín solo, en la neblina; letrero MARY CELESTE)
  { w: 0, lugar: "mar", hora: "niebla", mece: 1, foco: 40, cInf: 5, ini: c([50, 7, 58], [0, 7, 0], 40), fin: c([44, 6.5, 50], [0, 7, 0], 38), hacer: () => {} },
  // 1 · En 1872 lo encontraron navegando solo en medio del océano...  (desde muy arriba: el barco chiquito en el mar)
  { w: 10, lugar: "mar", hora: "dia", mece: 1, foco: 70, cInf: 4, ini: c([34, 42, -30], [0, 2, 0], 40), fin: c([46, 64, -40], [0, 2, 0], 40), hacer: () => {} },
  // 2 · con todo en su lugar,  (el timón gira solo)
  { w: 20, lugar: "mar", hora: "niebla", balanceo: 1, foco: 1.6, cInf: 7, ini: c([-1.4, 4.1, -14.7], [0.1, 3.2, -11.8], 56), fin: c([-1.2, 4.0, -14.6], [0.1, 3.2, -11.8], 54), hacer: ({ f, m }) => { m.timonSolo(f); } },
  // 3 · y sin nadie a bordo.  (el camarote vacío; la lámpara se mece)
  { w: 25, lugar: "camarote", foco: 2.2, cInf: 7, ini: c(CA(1.9, 1.55, 1.65), CA(-0.8, 0.9, -0.6), 54), fin: c(CA(1.7, 1.5, 1.45), CA(-0.8, 0.9, -0.6), 52), hacer: () => {} },
  // 4 · El 7 de noviembre de 1872, el Mary Celeste salió de Nueva York rumbo a Italia.  (en el muelle, al atardecer)
  { w: 30, lugar: "mar", hora: "tarde", foco: 24, cInf: 5, ini: c([-26, 7, 44], [2, 6, 0], 46), fin: c([-23, 6.5, 39], [2, 6, 0], 44), hacer: ({ m }) => { m.zarpa(); } },
  // 5 · Llevaba mil setecientos barriles de alcohol.  (la bodega llena)
  { w: 46, lugar: "bodega", foco: 3.5, cInf: 6, ini: c(BO(0, 1.6, -4.6), BO(0, 0.7, 3), 56), fin: c(BO(0, 1.5, -3.4), BO(0, 0.7, 3), 54), hacer: ({ m }) => { m.bodegaLlena(); } },
  // 6 · A bordo iban el capitán Benjamin Briggs,
  { w: 52, lugar: "mar", hora: "dia", balanceo: 0.6, foco: 3.6, cInf: 7, ini: c([2.0, 3.8, -1.3], [1.6, 3.3, -5.2], 42), fin: c([1.95, 3.75, -1.9], [1.6, 3.3, -5.2], 40), hacer: ({ f, m }) => { m.zarpa(); m.familia(f, 0); } },
  // 7 · su esposa Sarah, su hija Sophia, de dos años...
  { w: 59, lugar: "mar", hora: "dia", balanceo: 0.6, foco: 4.4, cInf: 7, ini: c([2.0, 3.75, -0.8], [1.8, 3.0, -5.2], 48), fin: c([1.95, 3.7, -1.3], [1.8, 3.0, -5.2], 46), hacer: ({ f, m }) => { m.zarpa(); m.familia(f, 1); } },
  // 8 · y siete marineros.  (en la proa, en fila)
  { w: 68, lugar: "mar", hora: "dia", balanceo: 0.6, foco: 5.2, cInf: 7, ini: c([0.4, 4.2, 13.9], [0, 3.1, 8], 58), fin: c([0.3, 4.1, 13.5], [0, 3.1, 8], 56), hacer: ({ f, m }) => { m.zarpa(); m.marineros(f); } },
  // 9 · Un mes después, otro barco, el Dei Gratia, lo vio a lo lejos,  (el capitán del Dei Gratia, de espaldas, ve al Mary Celeste)
  { w: 71, lugar: "mar", hora: "dia", mece: 1, balanceo: 0.8, foco: 2.6, cInf: 6, ini: c(enDG(-0.9, 4.1, 9.6), [0, 6, 0], 34), fin: c(enDG(-0.8, 4.05, 10.2), [0, 6, 0], 30), hacer: ({ f, m }) => { m.deiGratia(f, "ve"); } },
  // 10 · cerca de las islas Azores.  (mapa: de Nueva York a las Azores; aquí lo encontraron)
  { w: 84, lugar: "mar", hora: "dia", mapa: true, foco: 90, cInf: 4, ini: c([50, 60, -40], [0, 0, 0], 40), fin: c([50, 60, -40], [0, 0, 0], 40), hacer: () => {} },
  // 11 · Algo andaba mal: el Mary Celeste se movía raro, como si nadie lo manejara.  (da vueltas, las velas aletean)
  { w: 92, lugar: "mar", hora: "dia", mece: 1.6, viento: 1.8, foco: 40, cInf: 5, ini: c([-62, 5, 34], [0, 7, 0], 42), fin: c([-56, 5, 30], [0, 7, 0], 40), hacer: ({ f, m }) => { m.raro(f); } },
  // 12 · Lo llamaron.  (un marinero del Dei Gratia grita con los brazos en alto)
  { w: 103, lugar: "mar", hora: "dia", mece: 1, balanceo: 0.8, foco: 2.4, cInf: 6, ini: c(enDG(1.4, 3.95, 8.6), enDG(-0.6, 3.6, 11.4), 46), fin: c(enDG(1.3, 3.9, 8.9), enDG(-0.6, 3.6, 11.4), 44), hacer: ({ f, m }) => { m.raro(f); m.deiGratia(f, "grita"); } },
  // 13 · Nadie respondió.  (el Mary Celeste de cerca, callado)
  { w: 105, lugar: "mar", hora: "dia", mece: 1, foco: 20, cInf: 6, ini: c([-20, 3.2, 15], [0, 5, 2], 44), fin: c([-18, 3.1, 13], [0, 5, 2], 42), hacer: () => {} },
  // 14 · Tres marineros subieron a revisar.  (pasan la borda desde su bote)
  { w: 107, lugar: "mar", hora: "dia", balanceo: 0.6, foco: 3.6, cInf: 7, ini: c([1.4, 4.0, 1.4], [-3.0, 3.1, -1.0], 54), fin: c([1.2, 3.95, 1.2], [-3.0, 3.1, -1.0], 52), hacer: ({ f, m }) => { m.suben(f); } },
  // 15 · No había nadie. Ni vivos...  (los tres en la cubierta vacía, buscando)
  { w: 112, lugar: "mar", hora: "dia", balanceo: 0.6, foco: 5, cInf: 7, ini: c([2.5, 4.0, 1.2], [-0.8, 3.1, -3.4], 54), fin: c([2.4, 3.95, 0.8], [-0.8, 3.1, -3.4], 52), hacer: ({ f, m }) => { m.buscan(f); } },
  // 16 · ni muertos.  (la puerta del camarote se abre: el marinero se asoma; adentro, nadie)
  { w: 117, lugar: "camarote", foco: 3.2, cInf: 7, ini: c(CA(0.0, 1.5, -1.45), CA(1.4, 1.15, 2.0), 54), fin: c(CA(0.1, 1.48, -1.2), CA(1.4, 1.15, 2.0), 52), hacer: ({ f, k, m }) => { m.seAsoma(f, k); } },
  // 17 · Había comida y agua para seis meses.  (los víveres en la bodega)
  { w: 119, lugar: "bodega", foco: 2.6, cInf: 7, ini: c(BO(0.9, 1.5, -2.7), BO(-0.2, 0.6, -5.2), 54), fin: c(BO(0.8, 1.42, -3.1), BO(-0.2, 0.6, -5.2), 52), hacer: ({ m }) => { m.luz(BODEGA.x + 0.3, 1.6, BODEGA.z - 3.6, 4, "#ffc888"); } },
  // 18 · La ropa de los marineros,  (la ropa colgada en el rancho)
  { w: 126, lugar: "rancho", foco: 2.2, cInf: 7, ini: c(RA(0.25, 1.4, -0.7), RA(-0.2, 1.2, 2.2), 54), fin: c(RA(0.05, 1.38, -0.3), RA(-0.2, 1.2, 2.2), 52), hacer: () => {} },
  // 19 · sus pipas,  (la repisa con las pipas)
  { w: 131, lugar: "rancho", foco: 0.75, cInf: 8, ini: c(RA(0.1, 1.7, -1.4), RA(-0.05, 1.5, -2.15), 46), fin: c(RA(0.0, 1.67, -1.55), RA(-0.05, 1.5, -2.15), 44), hacer: () => {} },
  // 20 · sus cosas... todo estaba en su lugar.  (los baúles y las literas; luego el camarote con los juguetes de la niña)
  { w: 133, lugar: "rancho", foco: 2.0, cInf: 7, ini: c(RA(0.3, 1.35, 0.9), RA(-0.9, 0.35, -1.5), 54), fin: c(RA(0.2, 1.3, 0.6), RA(-0.9, 0.35, -1.5), 52), hacer: () => {} },
  { w: 135, lugar: "camarote", foco: 1.6, cInf: 7, ini: c(CA(0.45, 1.2, 0.55), CA(-0.8, 0.35, -1.3), 52), fin: c(CA(0.35, 1.15, 0.35), CA(-0.8, 0.35, -1.3), 50), hacer: () => {} },
  // 21 · Pero faltaban tres cosas:  (el marinero ve los calzos vacíos)
  { w: 140, lugar: "mar", hora: "dia", balanceo: 0.6, foco: 3.2, cInf: 7, ini: c([2.6, 3.9, -0.4], [-0.4, 2.9, -4.4], 50), fin: c([2.5, 3.85, -0.7], [-0.4, 2.9, -4.4], 48), hacer: ({ f, m }) => { m.ver("deveau", [1.1, Y, -2.75], { ...DIA, ...MIEDO(f, 0.15), boca: "linea", mirarY: -0.3, mirarX: -0.5 }); } },
  // 22 · el bote salvavidas,  (los calzos vacíos y las trincas cortadas)
  { w: 144, lugar: "mar", hora: "dia", balanceo: 0.5, foco: 2.2, cInf: 8, ini: c([1.9, 3.7, -2.2], [0, 2.7, -4.2], 46), fin: c([1.7, 3.5, -2.6], [0, 2.7, -4.2], 44), hacer: () => {} },
  // 23 · los instrumentos para navegar...  (la caja del sextante, abierta y vacía)
  { w: 147, lugar: "camarote", foco: 0.7, cInf: 8, ini: c(CA(0.95, 1.4, -0.65), CA(0.7, 0.84, -1.5), 46), fin: c(CA(0.88, 1.32, -0.8), CA(0.7, 0.84, -1.5), 44), hacer: () => {} },
  // 24 · y los papeles del barco.  (los casilleros del escritorio, vacíos)
  { w: 151, lugar: "camarote", foco: 0.9, cInf: 8, ini: c(CA(1.2, 1.3, -0.4), CA(0.91, 1.05, -1.75), 50), fin: c(CA(1.12, 1.27, -0.55), CA(0.91, 1.05, -1.75), 48), hacer: () => {} },
  // 25 · La última anotación era del 25 de noviembre. Todo parecía normal.  (la pizarra del diario)
  { w: 156, lugar: "camarote", foco: 0.45, cInf: 9, ini: c(CA(0.88, 1.35, -0.85), CA(0.91, 0.83, -1.44), 50), fin: c(CA(0.88, 1.3, -0.95), CA(0.91, 0.83, -1.44), 48), hacer: () => {} },
  // 26 · Durante diez días, el barco navegó solo.  (la cámara le da la vuelta)
  { w: 167, lugar: "mar", hora: "niebla", mece: 1, foco: 40, cInf: 5, ini: c([30, 8, -30], [0, 6, 0], 44), fin: c([-12, 8, -42], [0, 6, 0], 44), hacer: () => {} },
  // 27 · En la bodega había casi un metro de agua.
  { w: 174, lugar: "bodega", foco: 3, cInf: 7, ini: c(BO(1.0, 1.45, -1.6), BO(0.4, 0.7, 3.0), 56), fin: c(BO(0.9, 1.4, -0.9), BO(0.4, 0.7, 3.0), 54), hacer: ({ m }) => { m.h.aguaB.visible = true; } },
  // 28 · Nueve barriles de alcohol estaban vacíos.  (los barriles sin tapa, desde arriba)
  { w: 183, lugar: "bodega", foco: 2.2, cInf: 8, ini: c(BO(-0.3, 2.3, 2.5), BO(-0.3, 0.4, 4.4), 50), fin: c(BO(-0.3, 2.2, 2.8), BO(-0.3, 0.4, 4.4), 48), hacer: () => {} },
  // 29 · Y encontraron una espada con manchas que parecían sangre.  (el marinero la ve debajo de la litera)
  { w: 189, lugar: "camarote", foco: 1.6, cInf: 7, ini: c(CA(0.1, 1.05, 1.25), CA(-1.4, 0.1, 0.0), 56), fin: c(CA(0.0, 0.95, 1.15), CA(-1.4, 0.1, 0.0), 54), hacer: ({ f, m }) => { m.ver("deveau", CA(-0.45, 0, 0.5), { ...CALIDA, ...MIEDO(f, 0.3), boca: "o", agacha: 0.6 }, [-1, -0.4]); } },
  // 30 · Los análisis dijeron que no lo era.  (la espada de cerca)
  { w: 198, lugar: "camarote", foco: 0.75, cInf: 8, ini: c(CA(-0.95, 0.55, 0.55), CA(-1.3, 0.03, 0.05), 44), fin: c(CA(-1.0, 0.48, 0.48), CA(-1.3, 0.03, 0.05), 42), hacer: () => {} },
  // 31 · A ninguno de los diez se le volvió a ver.  (el barco se pierde en la neblina)
  { w: 205, lugar: "mar", hora: "niebla", mece: 1, foco: 60, cInf: 4, ini: c([-30, 5, -58], [0, 4, 0], 32), fin: c([-31, 5, -64], [0, 4, 0], 30), hacer: () => {} },
  // 32 · Algunos creen que el alcohol soltó vapores,  (la bodega de noche: vapores verdosos)
  { w: 215, lugar: "bodega", hora: "noche", foco: 3.2, cInf: 7, ini: c(BO(0, 1.4, -2.2), BO(0, 1.0, 3.5), 54), fin: c(BO(0, 1.35, -1.2), BO(0, 1.0, 3.5), 52), hacer: ({ f, m }) => { m.vaporesBodega(f); } },
  // 33 · el capitán temió una explosión...  (Briggs en la escotilla de proa; sale vapor)
  { w: 222, lugar: "mar", hora: "noche", balanceo: 0.8, foco: 3.2, cInf: 7, ini: c([1.7, 3.75, 6.0], [0.2, 3.1, 10.2], 48), fin: c([1.6, 3.7, 6.5], [0.2, 3.1, 10.2], 46), hacer: ({ f, m }) => { m.escotillaVapor(f); } },
  // 34 · y todos subieron al bote, atado al barco con una cuerda.  (el bote junto a la popa, con todos adentro)
  { w: 227, lugar: "mar", hora: "noche", foco: 9, cInf: 6, ini: c([3.2, 3.9, -38.5], [0.6, 2.4, -20], 46), fin: c([2.8, 3.6, -37], [0.6, 2.4, -20], 44), hacer: ({ f, m }) => { m.enElBote(f, 0, false); } },
  // 35 · Si la cuerda se rompió,  (la cuerda tensa... y se rompe)
  { w: 238, lugar: "mar", hora: "noche", foco: 8, cInf: 6, ini: c([-3.2, 2.8, -31], [0.8, 2.2, -20], 44), fin: c([-3.0, 2.7, -30.5], [0.8, 2.2, -20], 42), hacer: ({ f, m }) => { m.enElBote(f, 0, f >= fw(242)); } },
  // 36 · el barco se fue con el viento...  (el barco se aleja; el bote se queda)
  { w: 243, lugar: "mar", hora: "noche", foco: 14, cInf: 6, ini: c([3.0, 2.2, -37], [0, 4, -10], 46), fin: c([3.0, 2.2, -37], [0, 4, -10], 46), hacer: ({ f, k, m }) => { m.enElBote(f, k, true); } },
  // 37 · y ellos se quedaron solos en medio del mar.  (el bote solo, desde arriba)
  { w: 250, lugar: "mar", hora: "noche", foco: 30, cInf: 5, ini: c([6, 6, -38], [BOTE.x, 0, BOTE.z], 44), fin: c([14, 40, -52], [BOTE.x, 0, BOTE.z], 44), hacer: ({ f, m }) => { m.enElBote(f, 1, true); m.h.mc.g.visible = false; } },
  // 38 · Otros hablan de piratas,  (un barco de velas negras se acerca en la noche)
  { w: 259, lugar: "mar", hora: "noche", mece: 1, foco: 40, cInf: 5, ini: c([12, 3.5, -30], [-14, 6, 40], 40), fin: c([12, 3.5, -30], [-14, 6, 40], 38), hacer: ({ k, m }) => { m.piratas(k); } },
  // 39 · de un motín...  (sombras que pelean en la cubierta)
  { w: 263, lugar: "mar", hora: "noche", balanceo: 0.8, foco: 3.6, cInf: 7, ini: c([2.6, 3.7, 3.0], [-0.3, 3.1, -0.6], 50), fin: c([2.5, 3.65, 2.6], [-0.3, 3.1, -0.6], 48), hacer: ({ f, m }) => { m.motin(f); } },
  // 40 · o de algo que salió del agua.  (tentáculos junto al barco)
  { w: 266, lugar: "mar", hora: "noche", mece: 1, foco: 22, cInf: 6, ini: c([-24, 3.2, 20], [-3, 5, 0], 46), fin: c([-22, 3.0, 18], [-3, 5, 0], 44), hacer: ({ k, m }) => { m.monstruo(k); } },
  // 41 · Años después, el escritor Arthur Conan Doyle inventó que encontraron  (el escritor, de noche, escribe)
  { w: 273, lugar: "estudio", foco: 2.0, cInf: 7, ini: c(ES(0.6, 1.45, 1.2), ES(0.1, 1.0, -1.2), 50), fin: c(ES(0.5, 1.4, 0.85), ES(0.1, 1.0, -1.2), 48), hacer: ({ f, m }) => { m.escribe(f, false); } },
  // 42 · el desayuno servido y todavía caliente.  (la leyenda: la mesa servida, con vapor)
  { w: 283, lugar: "camarote", hora: "tarde", foco: 1.5, cInf: 7, ini: c(CA(1.3, 1.35, 1.2), CA(0.35, 0.78, 0.15), 46), fin: c(CA(1.15, 1.27, 1.0), CA(0.35, 0.78, 0.15), 44), hacer: ({ m }) => { m.h.desayuno.visible = true; } },
  // 43 · No era cierto...  (la misma mesa, vacía)
  { w: 289, lugar: "camarote", foco: 1.5, cInf: 7, ini: c(CA(1.15, 1.27, 1.0), CA(0.35, 0.78, 0.15), 44), fin: c(CA(1.1, 1.25, 0.95), CA(0.35, 0.78, 0.15), 44), hacer: () => {} },
  // 44 · pero así lo recuerda casi todo el mundo.  (el escritor sonríe)
  { w: 292, lugar: "estudio", foco: 2.2, cInf: 7, ini: c(ES(-0.6, 1.5, 1.4), ES(0.2, 1.0, -1.2), 50), fin: c(ES(-0.45, 1.45, 1.15), ES(0.2, 1.0, -1.2), 48), hacer: ({ f, m }) => { m.escribe(f, true); } },
  // 45 · Hoy, más de 150 años después,  (el barco en la neblina)
  { w: 300, lugar: "mar", hora: "niebla", mece: 1, foco: 30, cInf: 5, ini: c([24, 2.5, 30], [0, 7, 0], 40), fin: c([20, 2.6, 26], [0, 7, 0], 38), hacer: () => {} },
  // 46 · nadie sabe por qué diez personas abandonaron un barco que no se estaba hundiendo.  (la cubierta vacía; la puerta del camarote entreabierta)
  { w: 306, lugar: "mar", hora: "niebla", balanceo: 0.8, foco: 6, cInf: 7, ini: c([2.3, 4.5, 1.2], [-0.6, 3.2, -6.8], 50), fin: c([1.8, 4.4, -1.0], [-0.6, 3.2, -6.8], 48), hacer: ({ m }) => { m.h.mc.puerta.rotation.y = 0.7; } },
  // 47 · ¿Tú qué crees que pasó?  (el timón gira solo)
  { w: 320, lugar: "mar", hora: "niebla", balanceo: 1, foco: 1.6, cInf: 7, ini: c([1.0, 3.95, -14.7], [0, 3.35, -12.6], 52), fin: c([0.8, 3.9, -14.65], [0, 3.35, -12.6], 50), hacer: ({ f, m }) => { m.timonSolo(f); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

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
    h.luzExtra.intensity = 0; h.luzExtra2.intensity = 0;
    h.mc.g.visible = true; h.mc.g.position.set(0, 0, 0); h.mc.g.rotation.set(0, 0, 0); h.mc.rueda.rotation.z = 0; h.mc.puerta.rotation.y = 0; h.mc.cuerdaRota.visible = true;
    h.otro.g.visible = false; h.pirata.g.visible = false; h.bote.visible = false; h.boteOtro.visible = false; h.puerto.visible = false;
    h.cuerdaBote.clear(); h.tentaculos.g.visible = false; h.vapor.forEach((v) => (v.material.opacity = 0)); h.vapB.forEach((v) => (v.material.opacity = 0));
    h.desayuno.visible = false; h.aguaB.visible = false; h.puertaCam.rotation.y = 0; h.vacios.visible = true;
  }
  /** tarjeta que mira a la cámara; `mira` (±x, ±z): hacia dónde ve la persona (si la cámara queda detrás, de espaldas) */
  ver(quien: Quien, pos: V3, pose: Partial<Pose>, mira?: [number, number], giro = 0) {
    const c = this.cartas[quien], cp = this.cam.position;
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.set(0, Math.atan2(cp.x - pos[0], cp.z - pos[2]), giro);
    const espalda = mira ? (cp.x - pos[0]) * mira[0] + (cp.z - pos[2]) * mira[1] < 0 : false;
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[0] * 3), ...pose, ...(espalda ? { vista: "espalda" as const } : {}) });
  }
  /** punto del piso a `d` m delante de la cámara inicial del plano `w` y `lado` m a la derecha */
  delante(w: number, d: number, lado: number, y: number): V3 { const cc = PLANOS.find((p) => p.w === w)!.ini, qx0 = cc.mira[0] - cc.pos[0], qz0 = cc.mira[2] - cc.pos[2], L = Math.hypot(qx0, qz0), qx = qx0 / L, qz = qz0 / L; return [cc.pos[0] + qx * d - qz * lado, y, cc.pos[2] + qz * d + qx * lado]; }
  luz(x: number, y: number, z: number, i: number, color = "#ffc890") { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; l.color.set(color); }

  // ---------------- afuera
  timonSolo(f: number) { this.h.mc.rueda.rotation.z = 0.9 * Math.sin(f / FPS * 0.55) + 0.25 * Math.sin(f / FPS * 1.7); }
  zarpa() { const h = this.h; h.mc.cuerdaRota.visible = false; h.bote.visible = true; h.bote.position.set(0, Y + 0.85, ESCOTILLA.z); h.bote.rotation.set(0, Math.PI / 2, Math.PI); h.bote.scale.setScalar(0.62); }
  familia(f: number, n: number) {
    this.ver("briggs", [1.35, Y, -5.1], { ...DIA, boca: "linea", mirarX: 0.3, brazoIzq: [0.2, 0.1], brazoDer: [0.2, 0.1], cejasAlto: 0.1 });
    if (n >= 1 && f >= fw(59) - 3) this.ver("sarah", [2.35, Y, -5.5], { ...DIA, boca: "amable", mirarX: -0.3, brazoDer: [0.35, -0.2] });
    if (n >= 1 && f >= fw(62) - 3) this.ver("sophia", [1.9, Y, -4.5], { ...DIA, boca: "sonrisa", mirarY: 0.4, mirarX: -0.4, brazoIzq: [0.9, 0.3] });
  }
  marineros(f: number) {
    (["m1", "m2", "m3", "m4", "m5", "m6", "m7"] as Quien[]).forEach((q, k) => {
      if (f < fw(69) - 3 + k * 2) return;
      this.ver(q, [-1.65 + k * 0.55, Y, 8.0 + (k % 2) * 0.5], { ...DIA, boca: (["linea", "amable", "linea", "sonrisa", "linea", "amable", "linea"] as const)[k], mirarX: (k - 3) * -0.1, brazoIzq: [0.15, 0], brazoDer: [0.15, 0] });
    });
  }
  deiGratia(f: number, que: "ve" | "grita") {
    const h = this.h; h.otro.g.visible = true; h.otro.g.position.set(DG.x, 0, DG.z); h.otro.g.rotation.set(0, DG.giro, 0);
    if (que === "ve") this.ver("morehouse", this.delante(71, 3.2, 0.2, Y), { ...DIA, boca: "o", brazoDer: [2.2, -0.6], mirarY: 0.1 }, [1, 0]);
    else {
      this.ver("deveau", enDG(-0.6, Y, 11.4), { ...DIA, boca: "grito", bocaAbre: 1, brazoIzq: [2.5, 0.4 + 0.3 * Math.sin(f * 0.5)], brazoDer: [2.5, 0.4 - 0.3 * Math.sin(f * 0.5)], giro: 0.6, mirarX: 0.8 });
      this.ver("morehouse", enDG(-1.6, Y, 10.7), { ...DIA, boca: "linea", mirarX: 0.8, giro: 0.5, cejasMiedo: 0.4 });
    }
  }
  raro(f: number) { const t = f / FPS; this.h.mc.g.rotation.y = 0.45 * Math.sin(t * 0.55) + 0.15 * Math.sin(t * 1.3); this.timonSolo(f); }
  suben(f: number) {
    const h = this.h; h.boteOtro.visible = true; h.boteOtro.position.set(-4.7, 0.1, -1.2); h.boteOtro.rotation.set(0, 0, 0);
    const u = suave(fw(107) - 2, fw(111), f);
    this.ver("deveau", [lerp(-2.9, -1.6, u), Y, lerp(-0.6, -0.1, u)], { ...DIA, ...(u < 1 ? CAMINA(f, 0) : {}), boca: "linea", mirarX: 0.5, cejasMiedo: 0.3 });
    this.ver("d1", [-3.75, lerp(1.6, 2.1, suave(fw(107) + 6, fw(111) + 10, f)), -1.4], { ...DIA, boca: "linea", brazoIzq: [2.4, 0.3], brazoDer: [1.9, 0.2], mirarY: 0.3 });
    this.cartas.d1.contacto.visible = false;
  }
  buscan(f: number) {
    this.ver("deveau", this.delante(112, 3.5, -0.1, Y), { ...DIA, ...MIEDO(f, 0.2), boca: "o", mirarX: -0.6, giro: -0.4 });
    this.ver("d1", this.delante(112, 2.4, 0.6, Y), { ...DIA, ...MIEDO(f, 0.2), boca: "linea", mirarX: 0.7, giro: 0.5 });
    this.ver("d2", this.delante(112, 4.2, -1.1, Y), { ...DIA, ...MIEDO(f, 0.25), boca: "o", mirarY: 0.6, brazoDer: [0.6, -0.4] });
  }
  vaporesBodega(f: number) {
    const t = f / FPS;
    this.h.vapB.forEach((v, k) => { const u = (t * 0.25 + k / 8) % 1; v.position.set((k % 2 ? 1 : -1) * (1.4 + (k % 3) * 0.4), 0.6 + u * 1.8, -4 + k * 1.1); v.scale.setScalar(0.8 + u * 1.6); v.material.opacity = 0.38 * Math.sin(u * Math.PI); });
    
  }
  escotillaVapor(f: number) {
    const t = f / FPS;
    this.h.vapor.forEach((v, k) => { const u = (t * 0.4 + k / 6) % 1; v.position.set(0.15 * Math.sin(k * 3 + t), Y + 0.5 + u * 2.4, 10.2 + 0.2 * Math.cos(k + t)); v.scale.setScalar(1.0 + u * 2.4); v.material.opacity = 0.42 * Math.sin(u * Math.PI); });
    this.ver("briggs", [1.0, Y, 8.6], { ...NOCHE, borde: "#c8e8b0", ...MIEDO(f, 0.4), boca: "grito", bocaAbre: 0.7, brazoIzq: [1.0, -0.4], brazoDer: [0.7, 0.2], mirarX: -0.6, mirarY: -0.2 });
    this.luz(0.5, Y + 1.6, 9.6, 3.5, "#c8f0b0");
  }
  /** el bote con los diez, amarrado a la popa; `aleja` 0 … 1 = el barco se va; `rota` = la cuerda ya se rompió */
  enElBote(f: number, aleja: number, rota: boolean) {
    const h = this.h, t = f / FPS, bx = BOTE.x, bz = BOTE.z, by = 0.1 + 0.08 * Math.sin(t * 1.3);
    h.bote.visible = true; h.bote.position.set(bx, by, bz); h.bote.rotation.set(0.03 * Math.sin(t * 1.1), 0, 0.04 * Math.sin(t * 0.9)); h.bote.scale.setScalar(1);
    h.mc.cuerdaRota.visible = rota; h.mc.g.position.z = aleja * 60;
    const quien: [Quien, number, number][] = [["briggs", -0.35, 1.7], ["sarah", 0.3, 1.15], ["m1", -0.4, 0.55], ["m2", 0.35, 0.05], ["m3", -0.35, -0.5], ["m4", 0.35, -1.05], ["m5", -0.3, -1.6]];
    quien.forEach(([q, x, z], k) => { this.ver(q, SENTADO(q, bx + x, bz + z, by + 0.22), { ...NOCHE, ...MIEDO(f, 0.2), sentado: 1, boca: k % 2 ? "linea" : "o", mirarY: 0.3, mirarX: k % 2 ? -0.3 : 0.3 }, [0, 1]); this.cartas[q].contacto.visible = false; });
    this.ver("sophia", SENTADO("sophia", bx + 0.05, bz + 1.45, by + 0.22), { ...NOCHE, sentado: 1, boca: "triste", mirarY: 0.3 }, [0, 1]); this.cartas.sophia.contacto.visible = false;
    if (!rota) { // la cuerda tensa, de la popa a la proa del bote
      const a = new THREE.Vector3(0.9, 3.2, B.popa + h.mc.g.position.z - 0.1), b = new THREE.Vector3(bx, by + 0.5, bz + 2.4);
      const m = a.clone().add(b).multiplyScalar(0.5); m.y -= 0.25;
      h.cuerdaBote.add(h.palo(a, m, 0.035, h.mCuerdaB), h.palo(m, b, 0.035, h.mCuerdaB));
    } else { // la otra mitad cuelga de la proa del bote al agua
      h.cuerdaBote.add(h.palo(new THREE.Vector3(bx, by + 0.5, bz + 2.4), new THREE.Vector3(bx + 0.1, -0.05, bz + 4.2), 0.035, h.mCuerdaB));
    }
    this.luz(bx, 2.2, bz + 1, 1.2, "#b8c8ff");
  }
  piratas(k: number) {
    const h = this.h; h.mc.g.visible = false; h.pirata.g.visible = true; h.pirata.g.position.set(lerp(-22, -16, k), 0, lerp(62, 48, k)); h.pirata.g.rotation.set(0, -2.6, 0.03);
  }
  motin(f: number) {
    const s = Math.sin(f * 0.45);
    this.ver("s1", [-0.9, Y, -0.6], { ...SILUETA, boca: "grito", brazoDer: [2.6, 0.2 + 0.3 * s], brazoIzq: [0.8, -0.6], cuerpoX: 0.1 * s });
    this.ver("s2", [0.2, Y, -0.1], { ...SILUETA, boca: "grito", brazoIzq: [1.8, -0.8 - 0.3 * s], brazoDer: [1.4, -0.5], cuerpoX: -0.1 * s });
    this.ver("s3", [1.25, Y, 0.5], { ...SILUETA, boca: "dientes", brazoDer: [2.2, -0.2], brazoIzq: [0.4, 0.2] });
    this.luz(0.2, Y + 2.0, 0.6, 2.2 + 0.4 * Math.sin(f * 0.9), "#ffb870");
  }
  monstruo(k: number) {
    const tg = this.h.tentaculos; tg.g.visible = true; this.luz(-7, 6, 4, 6, "#b8c8ff"); tg.tents.forEach((t, i) => { t.position.y = lerp(-9, -0.4, suave(0, 1, k * 1.6 - i * 0.18)); t.rotation.z = 0.1 * Math.sin(k * 6 + i); });
  }
  // ---------------- adentro
  seAsoma(f: number, k: number) {
    this.h.puertaCam.rotation.y = -1.6 * suave(0, 0.5, k);
    if (k > 0.1) this.ver("deveau", CA(1.4, 0, CAMAROTE.z1 + 0.32), { ...SILUETA, borde: "#e8eeff", ...MIEDO(f, 0.2), boca: "o", mirarX: -0.4 });
  }
  escribe(f: number, sonrie: boolean) {
    this.ver("doyle", SENTADO("doyle", ESTUDIO.x + 0.2, ESTUDIO.z - 1.5, 0.48), { ...CALIDA, sentado: 1, boca: sonrie ? "sonrisa" : "linea", mirarY: sonrie ? 0.1 : -0.6, mirarX: sonrie ? 0.3 : 0, brazoDer: sonrie ? [0.4, 0.2] : [0.5 + 0.08 * Math.sin(f * 0.8), -1.1], brazoIzq: [0.4, -0.9], cejasAlto: sonrie ? 0.3 : 0 });
    this.cartas.doyle.contacto.visible = false;
  }
  bodegaLlena() { this.h.vacios.visible = false; }

  luces(f: number, pl: Plano) {
    const h = this.h, Lg = pl.lugar, t = f / FPS, hora: Hora = pl.hora ?? "dia";
    h.animar(t, pl.viento ?? 1);
    const afuera = Lg === "mar";
    h.afuera.visible = afuera; h.camarote.visible = Lg === "camarote"; h.rancho.visible = Lg === "rancho"; h.bodega.visible = Lg === "bodega"; h.estudio.visible = Lg === "estudio";
    const noche = hora === "noche", tarde = hora === "tarde";
    if (afuera) {
      h.mCielo.map = noche ? h.cielos.noche : tarde ? h.cielos.tarde : h.cielos.dia; h.mCielo.needsUpdate = true;
      h.mMar.map = noche ? h.aguas.noche : tarde ? h.aguas.tarde : h.aguas.dia; h.mMar.needsUpdate = true;
      h.luna.visible = noche; h.reflejo.visible = noche;
      h.amb.intensity = noche ? 0.35 : tarde ? 0.5 : 0.6; h.hemi.intensity = noche ? 0.45 : tarde ? 0.6 : 0.8;
      h.sol.intensity = noche ? 1.1 : tarde ? 1.3 : 1.4; h.sol.color.set(noche ? "#9ab2e8" : tarde ? "#ffb88a" : "#d8dce4");
      h.sol.position.set(noche ? -120 : tarde ? 80 : -40, noche ? 110 : tarde ? 20 : 50, noche ? 330 : tarde ? -60 : 30);
      if (noche) { const cp = this.cam.position, dx = -120 - cp.x, dz = 330 - cp.z, L = Math.hypot(dx, dz); h.reflejo.position.set(cp.x + dx / L * 160, 0.03, cp.z + dz / L * 160); h.reflejo.rotation.set(-Math.PI / 2, 0, Math.atan2(-dx / L, -dz / L)); }
      if (tarde) h.puerto.visible = true;
      const m = pl.mece ?? 0;
      if (m) { h.mc.g.position.y = 0.12 * m * Math.sin(t * 0.8); h.mc.g.rotation.z = 0.035 * m * Math.sin(t * 0.6); h.mc.g.rotation.x += 0.012 * m * Math.sin(t * 0.7 + 1); }
      if (h.otro.g.visible) { h.otro.g.rotation.z = 0.02 * Math.sin(t * 0.7 + 2); }
    } else {
      h.luzB.intensity = noche ? 1.4 : 4; h.amb.intensity = Lg === "bodega" ? (noche ? 0.2 : 0.4) : Lg === "estudio" ? 0.18 : 0.6;
      h.hemi.intensity = Lg === "bodega" ? 0.3 : Lg === "estudio" ? 0.12 : 0.55;
      h.sol.intensity = 0;
      h.luzLamp.intensity = Lg === "camarote" && tarde ? 3.5 : 2.5;
    }
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
const PORTADA_I = 0;
const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? 60 : f0;
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
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : MARY_CUADROS;
  const k0 = Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a))), k = pl.ease ? pl.ease(k0) : k0;
  mundo.f = f;
  const pos = pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3;
  const mira = pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3;
  cam.position.set(...pos);
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.03; cam.far = 1200; cam.updateProjectionMatrix();
  const bal = (pl.balanceo ?? 0) * 0.035 * Math.sin(f / FPS * 0.7); // el barco se balancea: el horizonte se inclina
  cam.up.set(Math.sin(bal), Math.cos(bal), 0);
  cam.lookAt(...mira);
  cam.updateMatrixWorld();
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  const hora = pl.hora ?? "dia", afuera = pl.lugar === "mar";
  scene.background = new THREE.Color(afuera ? (hora === "noche" ? "#05080e" : hora === "tarde" ? "#4a3a4a" : "#7a8696") : "#05060a");
  scene.fog = afuera ? new THREE.Fog(hora === "noche" ? "#0c1420" : hora === "tarde" ? "#6a5a66" : "#8a94a0", hora === "niebla" ? 14 : 40, hora === "niebla" ? 150 : hora === "noche" ? 220 : 300) : null;
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
      {b.map((i) => <span key={i} style={{ color: i === actual ? "#ffd23a" : "#ffffff", margin: "0 9px" }}>{P[i].txt.replace(/[«»]/g, "").replace(/\.\.\.$/, "…")}</span>)}
    </div>
  );
};
/** fechas y datos en grande arriba (como en los documentales) */
const TITULOS: [number, number, string][] = [[0, 10, "MARY CELESTE"], [30, 46, "7 DE NOVIEMBRE DE 1872"], [46, 52, "1.701 BARRILES DE ALCOHOL"], [71, 84, "UN MES DESPUÉS"], [167, 174, "10 DÍAS SOLO"], [198, 205, "NO ERA SANGRE"], [215, 238, "TEORÍA: LOS VAPORES"], [259, 273, "OTRAS TEORÍAS"], [273, 283, "1884"], [300, 306, "HOY"]];
const Titulo: React.FC<{ f: number }> = ({ f }) => {
  const r = TITULOS.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = r[0] === 0 ? 1 : Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: r[0] === 0 ? 96 : r[2].length > 18 ? 62 : 72, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "MARY CELESTE · NUEVA YORK → GÉNOVA · 1872", a = fw(36) - 2;
  if (f < a || f >= fw(71) - 2) return null;
  const n = Math.round(Math.min(1, (f - a + 4) / 26) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, right: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1, textAlign: "center" }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Pregunta: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(320) - 2; if (f < a) return null;
  const u = Math.min(1, (f - a) / 6), pop = 1 + 0.15 * Math.sin(u * Math.PI) * (1 - u);
  return <div style={{ position: "absolute", top: 160, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 82, lineHeight: 1.05, color: "#ffd23a", transform: `scale(${pop})`, opacity: u, ...contornoTexto(12) }}>¿TÚ QUÉ CREES<br />QUE PASÓ?</div>;
};

/** mapa del Atlántico (papel viejo): de Nueva York a las Azores, y la X donde lo encontraron */
const LON0 = -80, LON1 = 0, LAT0 = 52, LAT1 = 22, MX = 60, MY = 330, MW = 960, MH = 1100;
const xy = (lon: number, lat: number) => [MX + (lon - LON0) / (LON1 - LON0) * MW, MY + (lat - LAT0) / (LAT1 - LAT0) * MH] as const;
const linea = (pts: [number, number][]) => pts.map(([lo, la], i) => `${i ? "L" : "M"}${xy(lo, la)[0].toFixed(1)},${xy(lo, la)[1].toFixed(1)}`).join(" ");
const AMERICA: [number, number][] = [[-80, 52], [-79, 51], [-66, 50], [-60, 47], [-53, 47.5], [-53, 46.5], [-60, 45.5], [-64, 44.3], [-66, 44.8], [-70, 43.6], [-70.5, 41.8], [-74, 40.6], [-74.5, 39.2], [-75.5, 38.5], [-76, 37], [-75.6, 35.5], [-77, 34.6], [-79, 33.6], [-81, 31.7], [-81.3, 30], [-80.5, 28], [-80, 26.5], [-80, 22], [-80, 52]];
const EUROPA: [number, number][] = [[0, 52], [-3, 51.5], [-5.5, 50], [-3, 48.8], [-4.7, 48.4], [-2.2, 47.1], [-1.2, 46], [-1.3, 44.5], [-1.8, 43.4], [-4, 43.5], [-8, 43.7], [-9.3, 42.9], [-8.9, 41.4], [-9.5, 38.8], [-8.8, 37.1], [-7.2, 37.2], [-6, 36], [-5.6, 35.8], [-6.3, 35], [-9.8, 30.5], [-11, 28.5], [-13, 27.5], [-15.5, 24], [-16.5, 22], [0, 22], [0, 52]];
const RUTA: [number, number][] = [[-74, 40.4], [-60, 40.8], [-45, 40], [-34, 38.5], [-25.1, 36.95]];
const DERIVA: [number, number][] = [[-25.1, 36.95], [-21, 37.6], [-17.25, 38.33]];
const Mapa: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(84) - 2, b = fw(92) - 2; if (f < a || f >= b) return null;
  const u = suave(a + 4, a + 60, f), v = suave(a + 55, a + 85, f), x = suave(a + 80, a + 90, f);
  const [nx, ny] = xy(-74, 40.6), [zx, zy] = xy(-17.25, 38.33);
  const texto = (s: string, lo: number, la: number, tam = 34, color = "#3a2a1a") => { const [px, py] = xy(lo, la); return <text x={px} y={py} fontFamily="Titulo" fontSize={tam} fill={color} textAnchor="middle" style={{ letterSpacing: 1 }}>{s}</text>; };
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <radialGradient id="papel" cx="50%" cy="50%" r="75%"><stop offset="0%" stopColor="#e2d4b0" /><stop offset="80%" stopColor="#c8b088" /><stop offset="100%" stopColor="#8a7050" /></radialGradient>
      </defs>
      <rect x={0} y={0} width={1080} height={1920} fill="#1a1612" />
      <rect x={MX - 20} y={MY - 20} width={MW + 40} height={MH + 40} fill="url(#papel)" stroke="#5a4028" strokeWidth={10} rx={8} />
      <g clipPath="none">
        <path d={linea(AMERICA)} fill="#a89070" stroke="#5a4028" strokeWidth={4} />
        <path d={linea(EUROPA)} fill="#a89070" stroke="#5a4028" strokeWidth={4} />
        {[[-31.1, 39.5, 10], [-28.4, 38.6, 13], [-27.2, 38.7, 8], [-25.5, 37.8, 12], [-25.1, 36.95, 9], [-16.9, 32.7, 10]].map(([lo, la, r], i) => { const [px, py] = xy(lo, la); return <ellipse key={i} cx={px} cy={py} rx={r} ry={r * 0.6} fill="#a89070" stroke="#5a4028" strokeWidth={3} />; })}
        <mask id="revela"><path d={linea(RUTA)} fill="none" stroke="#ffffff" strokeWidth={14} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - u} /></mask>
        <path d={linea(RUTA)} fill="none" stroke="#7a2a1a" strokeWidth={7} strokeDasharray="18 12" strokeLinecap="round" mask="url(#revela)" />
        <path d={linea(DERIVA)} fill="none" stroke="#3a3a6a" strokeWidth={6} strokeDasharray="6 10" opacity={v} />
        <circle cx={nx} cy={ny} r={11} fill="#7a2a1a" />
        {texto("NUEVA YORK", -68, 43.2, 32)}
        {texto("ISLAS AZORES", -28, 41.4, 32)}
        {texto("PORTUGAL", -7.8, 40.2, 26)}
        {texto("ESPAÑA", -4.5, 42.2, 26)}
        {texto("OCÉANO ATLÁNTICO", -46, 32, 40, "#5a4a3a")}
        <g opacity={x} transform={`translate(${zx},${zy}) scale(${1.4 - 0.4 * x})`}>
          <path d="M-22,-22 L22,22 M22,-22 L-22,22" stroke="#c0201a" strokeWidth={10} strokeLinecap="round" />
        </g>
        <g opacity={x}>{texto("AQUÍ LO", -17.5, 35.6, 30, "#c0201a")}{texto("ENCONTRARON", -17.5, 34.4, 30, "#c0201a")}</g>
        <g opacity={v}>{texto("25 NOV.", -24.5, 35.2, 24, "#3a3a6a")}</g>
      </g>
    </svg>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.03, far: 1200 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const MaryCeleste: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D />
      <Mapa f={f} />
      <Rotulo f={f} />
      <Titulo f={f} />
      <Pregunta f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void LITERA;
