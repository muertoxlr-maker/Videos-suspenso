// Utilería para llenar fondos (las referencias tienen carteles, ventanas encendidas, anuncios y objetos por todos
// lados). Piezas genéricas para cualquier historia; cada escena elige textos y colores.
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";

const sprite = (r: number, g: number, b: number, tam: number, op: number) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  sp.scale.set(tam, tam, 1); sp.layers.set(NOINK); return sp;
};

/** cartel de papel o lámina con varias líneas de texto (la primera más grande); brillo > 0 si está iluminado por dentro */
export const cartel = (lineas: string[], fondo: string, tinta: string, w: number, h: number, brillo = 0, borde = tinta) => {
  const px = 300, tex = lienzo((c, W, H) => {
    c.fillStyle = fondo; c.fillRect(0, 0, W, H);
    c.strokeStyle = borde; c.lineWidth = 10; c.strokeRect(12, 12, W - 24, H - 24);
    c.fillStyle = tinta; c.textAlign = "center"; c.textBaseline = "middle";
    const n = lineas.length;
    lineas.forEach((t, i) => {
      const tam = i === 0 ? Math.min(H / (n + 0.6) * 1.1, W / Math.max(4, t.length) * 1.6) : Math.min(H / (n + 1.2) * 0.75, W / Math.max(4, t.length) * 1.5);
      c.font = `bold ${Math.round(tam)}px 'DejaVu Sans', sans-serif`;
      c.fillText(t, W / 2, H * (i + 0.75) / (n + 0.5));
    });
  }, px * Math.max(1, Math.round(w / h)), px);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex, emissive: "#ffffff", emissiveMap: tex, emissiveIntensity: brillo }));
  // por detrás se ve el papel liso (no el texto al revés)
  const atras = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lambert({ color: "#d9d4c6" })); atras.rotation.y = Math.PI; atras.position.z = -0.002; m.add(atras);
  return m;
};

/** casa lejana con ventanas encendidas (luz cálida) y techo de dos aguas */
export const casa = (ancho: number, alto: number, fondo: number, encendidas: boolean[], pared = "#3a3530") => {
  const g = new THREE.Group();
  g.add(caja(ancho, alto, fondo, lambert({ color: pared }), 0, alto / 2, 0));
  const techo = new THREE.Mesh(new THREE.CylinderGeometry(0.01, fondo * 0.62, ancho * 1.05, 3, 1), lambert({ color: "#2a1f1c" }));
  techo.rotation.z = Math.PI / 2; techo.rotation.x = Math.PI / 6; techo.position.y = alto + fondo * 0.18; techo.scale.set(1, 1, 0.6); g.add(techo);
  const n = encendidas.length, vw = ancho / (n * 1.8);
  encendidas.forEach((on, i) => {
    const x = -ancho / 2 + (i + 0.5) * (ancho / n);
    const v = new THREE.Mesh(new THREE.PlaneGeometry(vw, alto * 0.32), new THREE.MeshBasicMaterial({ color: on ? "#ffc56e" : "#151a22", toneMapped: false }));
    v.position.set(x, alto * 0.55, fondo / 2 + 0.01); v.layers.set(NOINK); g.add(v);
    if (on) { const s = sprite(255, 190, 110, vw * 3.2, 0.35); s.position.set(x, alto * 0.55, fondo / 2 + 0.2); g.add(s); }
  });
  return g;
};

/** anuncio espectacular sobre dos postes, iluminado por dos lámparas */
export const espectacular = (lineas: string[], fondo: string, tinta: string, w = 6, h = 2.6, altura = 6) => {
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(caja(0.25, altura, 0.25, lambert({ color: "#4a4c50" }), s * w * 0.3, altura / 2, -0.2));
  g.add(caja(w + 0.2, h + 0.2, 0.15, lambert({ color: "#2c2e32" }), 0, altura + h / 2, -0.1));
  const c = cartel(lineas, fondo, tinta, w, h, 0.55, fondo); c.position.set(0, altura + h / 2, 0.0); g.add(c);
  for (const s of [-1, 1]) {
    g.add(caja(0.08, 0.08, 0.9, lambert({ color: "#2c2e32" }), s * w * 0.3, altura - 0.05, 0.4));
    const f = caja(0.4, 0.12, 0.2, new THREE.MeshBasicMaterial({ color: "#fff0d0", toneMapped: false }), s * w * 0.3, altura - 0.05, 0.85); f.layers.set(NOINK); g.add(f);
    const h2 = sprite(255, 225, 170, 2.2, 0.45); h2.position.set(s * w * 0.3, altura - 0.05, 0.95); g.add(h2);
  }
  const l = new THREE.PointLight("#ffe2b0", 4, 9, 1.4); l.position.set(0, altura + 0.2, 1.4); g.add(l);
  return g;
};

/** pila de llantas viejas */
export const llantas = (n = 4) => {
  const g = new THREE.Group(), m = lambert({ color: "#1d1d20" }), r = lambert({ color: "#5a5a5e" });
  for (let i = 0; i < n; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.12, 8, 18), m); t.rotation.x = Math.PI / 2; t.position.set((i % 2) * 0.04, 0.12 + i * 0.22, 0); g.add(t);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 14), r); c.position.set((i % 2) * 0.04, 0.12 + i * 0.22, 0); g.add(c);
  }
  return g;
};

/** exhibidor de botellas o latas de colores (aceites, refrescos) */
export const exhibidor = (w = 0.9, niveles = 3, colores = ["#c43a2c", "#e0b030", "#2f6fb0", "#3a9a5a"]) => {
  const g = new THREE.Group(), metal = lambert({ color: "#6a6c70" });
  for (let k = 0; k < niveles; k++) {
    const y = 0.35 + k * 0.42;
    g.add(caja(w, 0.03, 0.4, metal, 0, y, 0));
    for (let i = 0; i < 6; i++) g.add(caja(w / 8, 0.26, 0.12, lambert({ color: colores[(i + k) % colores.length] }), -w / 2 + (i + 0.6) * (w / 6.2), y + 0.145, 0.05));
  }
  for (const s of [-1, 1]) g.add(caja(0.04, 0.35 + niveles * 0.42, 0.04, metal, s * w / 2, (0.35 + niveles * 0.42) / 2, -0.15));
  return g;
};
