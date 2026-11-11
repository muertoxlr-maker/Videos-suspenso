// Perro callejero plano (tarjeta 2D en el mundo 3D), con el mismo contorno de tinta que los personajes (§8).
// De perfil, mirando hacia la izquierda de la pantalla. Pose: cola (meneo), ladra (boca), cabeza arriba/abajo, orejas.
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { lambert } from "../turno3/comun";

export const PERRO_W = 640, PERRO_H = 480, PERRO_PIES = 472;
const TINTA = "#141012";

export type PosePerro = { cola: number; ladra: number; cabeza: number; orejas: number; paso: number; luzX: number; borde?: string; espejo?: boolean };
export const POSE_PERRO: PosePerro = { cola: 0, ladra: 0, cabeza: 0, orejas: 0.3, paso: 0, luzX: -1 };

const mezcla = (hex: string, k: number, hacia: number) => {
  const c = new THREE.Color(hex); const o = new THREE.Color(hacia ? "#ffffff" : "#000000");
  return "#" + c.lerp(o, k).getHexString();
};

export function dibujarPerro(ctx: CanvasRenderingContext2D, p: PosePerro, pelo = "#8a5a34", panza = "#c79a6a") {
  ctx.clearRect(0, 0, PERRO_W, PERRO_H);
  ctx.save();
  if (p.espejo) { ctx.translate(PERRO_W, 0); ctx.scale(-1, 1); }
  ctx.lineJoin = "round"; ctx.lineCap = "round";
  const LW = 9;
  const trazo = (d: () => void, relleno: string | CanvasGradient, w = LW) => { ctx.beginPath(); d(); ctx.fillStyle = relleno; ctx.fill(); ctx.lineWidth = w; ctx.strokeStyle = TINTA; ctx.stroke(); };
  const base = PERRO_PIES;
  const cuerpoY = base - 190, cuerpoX = 340;
  // cola (detrás): arco que se menea
  const ca = -0.9 + p.cola * 0.55;
  ctx.lineWidth = 30 + 9; ctx.strokeStyle = TINTA;
  const colaPts = () => { ctx.beginPath(); ctx.moveTo(cuerpoX + 150, cuerpoY - 20); ctx.quadraticCurveTo(cuerpoX + 205 + Math.cos(ca) * 30, cuerpoY - 60 + Math.sin(ca) * 50, cuerpoX + 200 + Math.cos(ca) * 95, cuerpoY - 40 + Math.sin(ca) * 110); };
  colaPts(); ctx.stroke(); ctx.lineWidth = 30; ctx.strokeStyle = pelo; colaPts(); ctx.stroke();
  // patas (las de atrás un poco más oscuras)
  const pata = (x: number, fase: number, osc: boolean) => {
    const lev = Math.max(0, Math.sin(p.paso + fase)) * 18, adel = Math.sin(p.paso + fase) * 14;
    const col = osc ? mezcla(pelo, 0.25, 0) : pelo;
    trazo(() => { ctx.roundRect(x - 17 + adel * 0.4, cuerpoY + 20, 34, base - cuerpoY - 34 - lev, 14); }, col);
    trazo(() => ctx.ellipse(x - 6 + adel, base - 12 - lev, 26, 13, 0, 0, Math.PI * 2), mezcla(col, 0.1, 0), 7);
  };
  pata(cuerpoX - 95, 0, true); pata(cuerpoX + 110, Math.PI, true);
  // cuerpo con panza clara y luz lateral
  const gc = ctx.createLinearGradient(0, cuerpoY - 80, 0, cuerpoY + 70);
  gc.addColorStop(0, mezcla(pelo, 0.12, 1)); gc.addColorStop(0.6, pelo); gc.addColorStop(1, mezcla(pelo, 0.3, 0));
  trazo(() => ctx.ellipse(cuerpoX, cuerpoY, 175, 78, 0, 0, Math.PI * 2), gc);
  ctx.beginPath(); ctx.ellipse(cuerpoX - 10, cuerpoY + 40, 120, 30, 0, 0, Math.PI * 2); ctx.fillStyle = panza; ctx.globalAlpha = 0.6; ctx.fill(); ctx.globalAlpha = 1;
  // mancha en el lomo
  ctx.beginPath(); ctx.ellipse(cuerpoX + 40, cuerpoY - 35, 60, 28, -0.1, 0, Math.PI * 2); ctx.fillStyle = mezcla(pelo, 0.35, 0); ctx.fill();
  pata(cuerpoX - 130, Math.PI, false); pata(cuerpoX + 80, 0, false);
  // cuello y cabeza
  const cy = cuerpoY - 95 - p.cabeza * 40, hx = cuerpoX - 205;
  trazo(() => { ctx.moveTo(cuerpoX - 150, cuerpoY - 30); ctx.lineTo(hx + 40, cy + 10); ctx.lineTo(hx + 95, cy + 55); ctx.lineTo(cuerpoX - 100, cuerpoY + 30); ctx.closePath(); }, pelo);
  const gh = ctx.createRadialGradient(hx + (p.luzX < 0 ? -30 : 30), cy - 30, 10, hx, cy, 100);
  gh.addColorStop(0, mezcla(pelo, 0.15, 1)); gh.addColorStop(1, mezcla(pelo, 0.2, 0));
  trazo(() => ctx.ellipse(hx, cy, 82, 70, 0, 0, Math.PI * 2), gh);
  // hocico y boca (abre al ladrar)
  const ab = p.ladra * 34;
  trazo(() => ctx.ellipse(hx - 80, cy + 22 + ab * 0.2, 52, 30, 0.1, 0, Math.PI * 2), panza);
  if (ab > 2) {
    trazo(() => { ctx.moveTo(hx - 40, cy + 40); ctx.lineTo(hx - 125, cy + 40 + ab * 0.4); ctx.quadraticCurveTo(hx - 100, cy + 52 + ab * 1.2, hx - 40, cy + 52 + ab * 0.6); ctx.closePath(); }, "#5a1a1e", 7);
    ctx.fillStyle = "#f2ece0"; for (const x of [-112, -80]) { ctx.beginPath(); ctx.moveTo(hx + x, cy + 42); ctx.lineTo(hx + x + 7, cy + 54); ctx.lineTo(hx + x + 14, cy + 42); ctx.fill(); }
  }
  trazo(() => ctx.ellipse(hx - 128, cy + 8, 16, 12, 0, 0, Math.PI * 2), "#1a1416", 6);
  // ojo
  trazo(() => ctx.ellipse(hx - 22, cy - 18, 16, 18, 0, 0, Math.PI * 2), "#f4efe4", 6);
  ctx.beginPath(); ctx.arc(hx - 28, cy - 16, 8, 0, Math.PI * 2); ctx.fillStyle = TINTA; ctx.fill();
  ctx.beginPath(); ctx.arc(hx - 31, cy - 20, 3, 0, Math.PI * 2); ctx.fillStyle = "#ffffff"; ctx.fill();
  // ceja
  ctx.lineWidth = 6; ctx.strokeStyle = TINTA; ctx.beginPath(); ctx.moveTo(hx - 42, cy - 44 + p.ladra * 6); ctx.lineTo(hx - 6, cy - 40); ctx.stroke();
  // oreja caída (se levanta un poco cuando está alerta)
  const oa = 0.4 - p.orejas * 0.7;
  trazo(() => { ctx.moveTo(hx + 20, cy - 55); ctx.quadraticCurveTo(hx + 85, cy - 70 - p.orejas * 30, hx + 70 + Math.cos(oa) * 20, cy + 10 + Math.sin(oa) * 40); ctx.quadraticCurveTo(hx + 40, cy + 5, hx + 20, cy - 55); }, mezcla(pelo, 0.3, 0), 7);
  if (p.borde) { // luz de borde en el lomo del lado de la lámpara
    ctx.globalAlpha = 0.45; ctx.lineWidth = 10; ctx.strokeStyle = p.borde;
    ctx.beginPath(); ctx.ellipse(cuerpoX, cuerpoY - 4, 168, 70, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.restore();
}

/** tarjeta del perro: misma receta que Tarjeta (Lambert + 0.12 de brillo propio, sin tinta 3D) */
export class TarjetaPerro {
  readonly grupo = new THREE.Group();
  readonly textura: THREE.CanvasTexture;
  readonly ancho: number;
  private ctx: CanvasRenderingContext2D;
  constructor(readonly altura = 0.6, private pelo = "#8a5a34", private panza = "#c79a6a") {
    const c = document.createElement("canvas"); c.width = PERRO_W; c.height = PERRO_H;
    this.ctx = c.getContext("2d")!;
    this.textura = new THREE.CanvasTexture(c); this.textura.colorSpace = THREE.SRGBColorSpace; this.textura.anisotropy = 8;
    this.ancho = altura * (PERRO_W / PERRO_H);
    const mat = lambert({ map: this.textura, alphaTest: 0.5, emissive: new THREE.Color("#ffffff"), emissiveMap: this.textura, emissiveIntensity: 0.12, side: THREE.DoubleSide });
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(this.ancho, altura), mat);
    plano.position.y = altura / 2 - altura * ((PERRO_H - PERRO_PIES) / PERRO_H);
    plano.layers.set(NOINK);
    this.grupo.add(plano);
  }
  dibujar(p: Partial<PosePerro>) { dibujarPerro(this.ctx, { ...POSE_PERRO, ...p }, this.pelo, this.panza); this.textura.needsUpdate = true; }
}
