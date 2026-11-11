// Movimiento más vivo (comparación con las referencias): gestos al hablar, temblor de miedo y acercamientos de cámara
// rápidos. Todo depende solo del cuadro, así cada cuadro se puede renderizar por separado.
import { Pose } from "../prueba_pasillo/personaje";

/** ruido suave (interpolado) entre -1 y 1 */
const r1 = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
export const ondula = (t: number, semilla: number) => {
  const i = Math.floor(t), u = t - i, s = u * u * (3 - 2 * u);
  return r1(i + semilla * 31.7) * (1 - s) + r1(i + 1 + semilla * 31.7) * s;
};

/**
 * gestos mientras habla: cada ~0.6 s cambia de ademán (una mano sube y explica, la otra baja, la cabeza acompaña).
 * `fuerza` 0 … 1. Devuelve campos de Pose para mezclar con `{ ...pose, ...hablaGestos(f, 3) }`.
 */
export const hablaGestos = (f: number, semilla: number, fuerza = 1): Partial<Pose> => {
  const t = f / 18; // un ademán cada ~0.6 s
  const a = ondula(t, semilla), b = ondula(t * 0.8, semilla + 5), c = ondula(t * 1.3, semilla + 9);
  const sube = Math.max(0, a) * fuerza; // la mano que explica
  return {
    brazoDer: [0.2 + sube * 1.7, -0.1 - sube * 2.1 + b * 0.3 * fuerza],
    brazoIzq: [0.12 + Math.max(0, -a) * 1.1 * fuerza, -0.05 - Math.max(0, -a) * 1.4 * fuerza],
    cabezaX: c * 0.03 * fuerza,
    cuerpoX: b * 0.02 * fuerza,
    giro: c * 0.18 * fuerza,
  };
};

/** temblor de miedo (cuerpo y brazos), `k` 0 … 1 */
export const tiembla = (f: number, k = 1): Partial<Pose> => ({
  cuerpoX: Math.sin(f * 2.3) * 0.012 * k,
  cabezaX: Math.sin(f * 3.1 + 1) * 0.01 * k,
  hombros: 0.35 * k,
});

/** acercamiento de cámara rápido al inicio del plano y luego casi quieto (como en las referencias), k 0 … 1 */
export const empuje = (k: number, rapidez = 3) => 1 - Math.pow(1 - Math.min(1, Math.max(0, k)), rapidez);
