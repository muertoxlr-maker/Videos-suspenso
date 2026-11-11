// Sombra con la FORMA del personaje (no una mancha): la misma textura de la tarjeta, pintada de negro y acostada en
// el suelo, alejándose del foco. Su largo sale de la altura del foco (como una sombra de verdad) y se mueve con el
// dibujo (al caminar, la sombra camina). Hecha para «La taquería de las 2 AM», donde la sombra es la pista.
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";

export class SombraSilueta {
  readonly pivote = new THREE.Group();
  private malla: THREE.Mesh;
  constructor(textura: THREE.Texture, private ancho: number, private alto: number, pies = 0.006, opacidad = 0.8) {
    const geo = new THREE.PlaneGeometry(ancho, alto); geo.translate(0, alto / 2 - alto * pies, 0); // pies en el origen
    this.malla = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: "#000000", map: textura, alphaTest: 0.5, transparent: true, opacity: opacidad, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    this.malla.rotation.x = -Math.PI / 2; // arriba del dibujo → hacia −z del pivote
    this.malla.layers.set(NOINK);
    this.pivote.add(this.malla);
  }
  /** pies en (x, piso, z); foco en fx, fy, fz. Si no hay foco (apagón) se oculta. */
  colocar(x: number, z: number, piso: number, foco: THREE.Vector3 | null, min = 0.9, max = 1.7) {
    if (!foco) { this.pivote.visible = false; return; }
    this.pivote.visible = true;
    const dx = x - foco.x, dz = z - foco.z, d = Math.max(0.05, Math.hypot(dx, dz));
    const largo = Math.min(max, Math.max(min, (d * this.alto) / Math.max(0.3, foco.y + 1.5 - piso - this.alto))); // el foco se toma 1.5 m más alto: sombras cortas que se leen completas junto a los pies
    this.pivote.position.set(x, piso + 0.012, z);
    this.pivote.rotation.y = Math.atan2(-dx / d, -dz / d);
    this.malla.scale.set(1, largo / this.alto, 1);
    void this.ancho;
  }
}
