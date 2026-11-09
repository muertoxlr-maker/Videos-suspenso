// Piezas compartidas, copiadas del estándar aprobado (prueba_pasillo/Prueba.tsx) para no tocar la prueba.
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { Aspecto, LIENZO_H, LIENZO_W, PIES, Pose, dibujarPersonaje } from "../prueba_pasillo/personaje";

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const suave = (a: number, b: number, f: number) => { const u = clamp01((f - a) / Math.max(1e-6, b - a)); return u * u * (3 - 2 * u); };
export const ruido = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };

export function lienzo(dibujar: (c: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 256, rep: [number, number] = [1, 1]) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  dibujar(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep);
  t.anisotropy = 8;
  return t;
}

/** Lienzo que se vuelve a dibujar en cada cuadro (pantallas, relojes, insertos animados). */
export class LienzoVivo {
  readonly tex: THREE.CanvasTexture;
  readonly ctx: CanvasRenderingContext2D;
  constructor(readonly w: number, readonly h: number) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    this.ctx = c.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
  }
  dibujar(fn: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
    this.ctx.clearRect(0, 0, this.w, this.h);
    fn(this.ctx, this.w, this.h);
    this.tex.needsUpdate = true;
  }
}

export const lambert = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(o);
export const caja = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b;
};
export const resplandor = (r: number, g: number, b: number) => lienzo((c, w, h) => {
  const gr = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, `rgba(${r},${g},${b},0.9)`); gr.addColorStop(0.3, `rgba(${r},${g},${b},0.35)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
}, 128, 128);
export const texTexto = (t: string, fondo: string, color: string, w = 256, h = 96, fuente = "bold 46px 'DejaVu Sans', sans-serif") => lienzo((g) => {
  g.fillStyle = fondo; g.fillRect(0, 0, w, h);
  g.fillStyle = color; g.font = fuente; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, w / 2, h / 2 + 3);
}, w, h);

/** Personaje plano anclado al suelo por la suela (estándar §8: Lambert + 0.12 de brillo propio + sombras). */
export class Tarjeta {
  readonly grupo = new THREE.Group();
  readonly sombraLarga: THREE.Mesh;
  readonly contacto: THREE.Mesh;
  private ctx: CanvasRenderingContext2D;
  private tex: THREE.CanvasTexture;
  constructor(private aspecto: Aspecto, readonly altura: number) {
    const c = document.createElement("canvas");
    c.width = LIENZO_W; c.height = LIENZO_H;
    this.ctx = c.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    const ancho = altura * (LIENZO_W / LIENZO_H);
    const mat = lambert({ map: this.tex, alphaTest: 0.5, emissive: new THREE.Color("#ffffff"), emissiveMap: this.tex, emissiveIntensity: 0.12, side: THREE.DoubleSide });
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(ancho, altura), mat);
    plano.position.y = altura / 2 - altura * ((LIENZO_H - PIES) / LIENZO_H);
    plano.layers.set(NOINK);
    const blob = lienzo((g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.5, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, 128, 128);
    const matSombra = (op: number) => new THREE.MeshBasicMaterial({ color: "#000000", alphaMap: blob, transparent: true, opacity: op, depthWrite: false });
    this.contacto = new THREE.Mesh(new THREE.PlaneGeometry(ancho * 0.5, ancho * 0.15), matSombra(0.9));
    this.contacto.rotation.x = -Math.PI / 2; this.contacto.position.set(0, 0.004, 0); this.contacto.layers.set(NOINK);
    this.sombraLarga = new THREE.Mesh(new THREE.PlaneGeometry(ancho * 0.42, altura * 0.8), matSombra(0.7));
    this.sombraLarga.rotation.x = -Math.PI / 2; this.sombraLarga.position.y = 0.003; this.sombraLarga.layers.set(NOINK);
    this.grupo.add(this.sombraLarga, this.contacto, plano);
  }
  orientarSombra(ang: number, largo: number) {
    this.sombraLarga.rotation.z = ang;
    this.sombraLarga.position.x = Math.sin(-ang) * largo * -0.5;
    this.sombraLarga.position.z = Math.cos(ang) * largo * 0.5;
  }
  sinSombras() { this.sombraLarga.visible = false; this.contacto.visible = false; return this; }
  dibujar(p: Pose) { dibujarPersonaje(this.ctx, this.aspecto, p); this.tex.needsUpdate = true; }
}

export const POSE: Pose = {
  vista: "frente", giro: 0, mirarX: 0, mirarY: 0, ojos: 1, pupila: 0.32, parpadeo: false, cejasAlto: 0, cejasMiedo: 0,
  boca: "linea", sudor: 0, brazoIzq: [0.08, -0.04], brazoDer: [0.08, -0.04], piernas: [0, 0], respira: 0, luzX: -1,
};

/** parpadeo natural de 3 cuadros cada ~2.6–3.8 s, desfasado por personaje */
export const parpadea = (f: number, semilla: number) => {
  const periodo = 78 + Math.floor(ruido(semilla) * 36);
  return (f + semilla * 17) % periodo < 3;
};
