// Escenarios de «Último vagón» con el nivel de detalle del estándar §8.4.
// Medidas en metros. Nuestro vagón: x ∈ [-1.4, 1.4], piso y = 0, techo y = 2.25, z ∈ [-9, 9] (el frente del tren hacia +z).
// El vagón de atrás está detrás de la puerta entre vagones (z < -9.6). El túnel y los andenes están fuera del tren y se
// desplazan en z para dar la sensación de movimiento (el tren se queda quieto en el origen).
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { LienzoVivo, caja, lambert, lienzo, resplandor, texTexto } from "../turno3/comun";

export const V = { x: 1.4, alto: 2.25, z0: -9, z1: 9 };
export const PUERTAS_Z = [-4.5, 3.0]; // centros de las puertas laterales (ancho 1.3)
export const PALANCA = { x: 1.33, y: 1.78, z: 3.95 }; // freno de emergencia, junto a la puerta derecha
export const ATRAS = -18.6; // desplazamiento del vagón de atrás
export const ESTACIONES = ["LAS TORRES", "ALAMEDA", "SAN LUCIO"];

const vidrio = () => new THREE.MeshBasicMaterial({ color: "#a9c7d6", transparent: true, opacity: 0.1, depthWrite: false, side: THREE.DoubleSide });
const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const halo = (r: number, g: number, b: number, w: number, h: number, op = 0.5) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  m.layers.set(NOINK); return m;
};

const texPisoVagon = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#5d5a55"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#53504b"; for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { g.beginPath(); g.arc(x + (y % 32 ? 8 : 0), y, 3.5, 0, 7); g.fill(); }
  for (let i = 0; i < 30; i++) { g.fillStyle = "rgba(30,28,25,0.15)"; g.fillRect((i * 41) % w, (i * 67) % h, 9, 4); }
}, 128, 128, rep);
const texConcreto = (rep: [number, number], base = "#323b42") => lienzo((g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${i % 2 ? "10,16,22" : "80,96,108"},0.16)`; g.fillRect((i * 53) % w, (i * 29) % h, 6 + (i % 5) * 4, 3 + (i % 3) * 3); }
  // costillas del túnel (bandas verticales oscuras): al pasar dan la sensación de velocidad
  for (const x of [0, w / 2]) { g.fillStyle = "#161d23"; g.fillRect(x, 0, 22, h); g.fillStyle = "#4a5660"; g.fillRect(x + 22, 0, 5, h); }
  g.strokeStyle = "#0d1216"; g.lineWidth = 7; for (const y of [0.52, 0.58, 0.63]) { g.beginPath(); g.moveTo(0, h * y); g.lineTo(w, h * y + 4); g.stroke(); } // cables a la altura de la ventana
  g.fillStyle = "rgba(120,90,50,0.25)"; g.fillRect(w * 0.3, h * 0.7, w * 0.15, h * 0.3); // mancha de humedad
}, 256, 256, rep);
const texAzulejo = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#b9c3c0"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#8c9794"; g.lineWidth = 3; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.fillStyle = "#c27a2c"; g.fillRect(0, h * 0.62, w, h * 0.08); // franja naranja de la línea
  for (let i = 0; i < 50; i++) { g.fillStyle = "rgba(60,70,65,0.1)"; g.fillRect((i * 37) % w, (i * 23) % h, 14, 8); }
}, 128, 128, rep);
const texAnuncio = (fondo: string, tinta: string, a: string, b: string) => lienzo((g, w, h) => {
  g.fillStyle = fondo; g.fillRect(0, 0, w, h);
  g.fillStyle = tinta; g.font = "bold 44px 'DejaVu Sans', sans-serif"; g.fillText(a, 18, 58);
  g.font = "28px 'DejaVu Sans', sans-serif"; g.fillText(b, 18, 102);
  g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.arc(w - 60, h / 2, 40, 0, 7); g.fill();
}, 512, 128);

/** Un vagón completo. `nuestro`: el de la historia (con palanca, mapa, avisos). Devuelve el grupo y sus piezas móviles. */
function vagon(nuestro: boolean) {
  const g = new THREE.Group();
  const L = V.z1 - V.z0, cz = (V.z0 + V.z1) / 2;
  const mInt = lambert({ color: "#a89f86" }), mExt = lambert({ color: "#c46a2a" }), mGris = lambert({ color: "#8e918c" });
  const mAsiento = lambert({ color: "#6e4a36" }), mMetal = lambert({ color: "#c9ccc6" }), mOscuro = lambert({ color: "#2a2c2e" });
  const mPuerta = lambert({ color: "#a6a8a1" });
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(2 * V.x, L), lambert({ map: texPisoVagon([4, 26]) }));
  piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0.002, cz); g.add(piso);
  g.add(caja(2 * V.x + 0.1, 0.25, L, mOscuro, 0, -0.13, cz)); // bastidor
  const techo = caja(2 * V.x, 0.06, L, [mInt, mInt, lambert({ color: "#9a4f20" }), lambert({ color: "#ddd6bd" }), mInt, mInt] as unknown as THREE.Material, 0, V.alto + 0.03, cz); g.add(techo);
  // paredes laterales con ventanas y huecos de puerta; cara exterior naranja, interior crema
  const ventanas: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const mats = s > 0 ? [mExt, mInt, mInt, mInt, mInt, mInt] : [mInt, mExt, mInt, mInt, mInt, mInt];
    const pared = (zA: number, zB: number, yA: number, yB: number) => { const b = caja(0.06, yB - yA, zB - zA, mats as unknown as THREE.Material, s * V.x, (yA + yB) / 2, (zA + zB) / 2); g.add(b); };
    const tramos: [number, number][] = [[V.z0, PUERTAS_Z[0] - 0.65], [PUERTAS_Z[0] + 0.65, PUERTAS_Z[1] - 0.65], [PUERTAS_Z[1] + 0.65, V.z1]];
    for (const [a, b] of tramos) {
      pared(a, b, 0, 0.9); pared(a, b, 1.75, V.alto);
      const n = Math.max(1, Math.round((b - a) / 1.9)), paso = (b - a) / n;
      for (let i = 0; i <= n; i++) { const z = a + i * paso; pared(Math.max(a, z - 0.14), Math.min(b, z + 0.14), 0.9, 1.75); } // pilares entre ventanas
      for (let i = 0; i < n; i++) {
        const v = new THREE.Mesh(new THREE.PlaneGeometry(paso - 0.28, 0.85), vidrio()); v.rotation.y = Math.PI / 2; v.position.set(s * V.x, 1.325, a + (i + 0.5) * paso); v.layers.set(NOINK); g.add(v); ventanas.push(v);
        // asiento corrido bajo la ventana
        g.add(caja(0.45, 0.1, paso - 0.1, mAsiento, s * (V.x - 0.26), 0.46, a + (i + 0.5) * paso), caja(0.08, 0.42, paso - 0.1, mAsiento, s * (V.x - 0.06), 0.7, a + (i + 0.5) * paso), caja(0.4, 0.41, paso - 0.3, mGris, s * (V.x - 0.26), 0.2, a + (i + 0.5) * paso));
        // anuncio sobre la ventana
        const an = [["#2c5d8a", "#f2efe6", "LÍNEA 3", "Cuida tus pertenencias"], ["#e7d9b0", "#3a2a1a", "PAN DORADO", "desde 1962"], ["#7a2632", "#f7e8d0", "FARMACIA 24 H", "abierto siempre"]][(((i + (s > 0 ? 1 : 0) + Math.round(a)) % 3) + 3) % 3];
        const ad = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.4, paso - 0.4), 0.3), lambert({ map: texAnuncio(an[0], an[1], an[2], an[3]) }));
        ad.rotation.y = -s * Math.PI / 2; ad.position.set(s * (V.x - 0.035), 1.98, a + (i + 0.5) * paso); g.add(ad);
      }
    }
    // puertas: dos hojas con ventanilla, luz roja encima
    for (const zc of PUERTAS_Z) {
      for (const h of [-1, 1]) {
        const z = zc + h * 0.325;
        g.add(caja(0.04, 1.0, 0.63, mPuerta, s * (V.x - 0.01), 0.5, z), caja(0.04, 0.4, 0.63, mPuerta, s * (V.x - 0.01), 2.0, z));
        g.add(caja(0.04, 0.8, 0.12, mPuerta, s * (V.x - 0.01), 1.4, z + h * 0.255), caja(0.04, 0.8, 0.08, mPuerta, s * (V.x - 0.01), 1.4, z - h * 0.275));
        const vv = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.8), vidrio()); vv.rotation.y = Math.PI / 2; vv.position.set(s * (V.x - 0.01), 1.4, z - h * 0.02); vv.layers.set(NOINK); g.add(vv); ventanas.push(vv);
      }
      g.add(caja(0.05, V.alto, 0.08, mGris, s * (V.x - 0.02), V.alto / 2, zc - 0.69), caja(0.05, V.alto, 0.08, mGris, s * (V.x - 0.02), V.alto / 2, zc + 0.69));
      g.add(caja(0.05, V.alto - 0.1, 0.03, mOscuro, s * (V.x - 0.03), (V.alto - 0.1) / 2, zc)); // junta de goma entre hojas
      g.add(caja(0.06, 0.06, 0.12, brillo("#ff3b2f"), s * (V.x - 0.05), 2.12, zc)); // luz de «puerta bloqueada»
      // tubos verticales junto a la puerta
      for (const dz of [-0.95, 0.95]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, V.alto, 10), mMetal); t.position.set(s * (V.x - 0.45), V.alto / 2, zc + dz); g.add(t); }
    }
  }
  // barras de techo y luminarias
  for (const x of [-0.72, 0.72]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, L - 0.4, 8), mMetal); b.rotation.x = Math.PI / 2; b.position.set(x, 1.95, cz); g.add(b); }
  for (const x of [-0.42, 0.42]) { const l = caja(0.16, 0.03, L - 1.2, brillo("#fff0c2"), x, V.alto - 0.015, cz); l.layers.set(NOINK); g.add(l); }
  for (const z of [-6, 0, 6]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, V.alto, 10), mMetal); p.position.set(0, V.alto / 2, z); g.add(p); } // tubos centrales
  const luces = [-5.5, 0, 5.5].map((z) => { const l = new THREE.PointLight("#ffe2a6", nuestro ? 1.1 : 0.9, 7.5, 1.4); l.position.set(0, V.alto - 0.2, z); g.add(l); return l; });
  // testeros: atrás la puerta entre vagones (con ventanilla), adelante la cabina
  const extremos: THREE.Mesh[] = [];
  for (const [z, s] of [[V.z0, 1], [V.z1, -1]] as const) {
    const esAtras = z === V.z0 || !nuestro; // el vagón de atrás tiene puerta con ventanilla en ambos extremos
    g.add(caja(0.95, V.alto, 0.06, mInt, -0.9, V.alto / 2, z), caja(0.95, V.alto, 0.06, mInt, 0.9, V.alto / 2, z));
    if (esAtras) {
      g.add(caja(0.85, 0.95, 0.05, mPuerta, 0, 0.475, z), caja(0.85, 0.35, 0.05, mPuerta, 0, 2.075, z), caja(0.17, 0.95, 0.05, mPuerta, -0.34, 1.425, z), caja(0.17, 0.95, 0.05, mPuerta, 0.34, 1.425, z));
      const vv = new THREE.Mesh(new THREE.PlaneGeometry(0.51, 0.95), vidrio()); vv.position.set(0, 1.425, z + s * 0.01); vv.layers.set(NOINK); g.add(vv); extremos.push(vv);
      g.add(caja(0.18, 0.04, 0.06, mMetal, 0.28, 1.05, z + s * 0.05)); // manija
    } else g.add(caja(0.85, V.alto, 0.05, mPuerta, 0, V.alto / 2, z), caja(0.4, 0.3, 0.02, lambert({ map: texTexto("CABINA", "#2a2c2e", "#e8e2cf", 256, 128) }), 0, 1.6, z - 0.04));
  }
  // frente del tren (solo se ve desde el túnel): naranja con faros y parabrisas oscuro
  if (nuestro) {
    g.add(caja(2 * V.x + 0.06, V.alto + 0.3, 0.06, mExt, 0, V.alto / 2 - 0.12, V.z1 + 0.08));
    g.add(caja(1.9, 0.6, 0.02, lambert({ color: "#14181c" }), 0, 1.55, V.z1 + 0.12));
    for (const x of [-0.9, 0.9]) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.11, 20), brillo("#fff6dc")); f.position.set(x, 0.55, V.z1 + 0.12); f.layers.set(NOINK); g.add(f); const h = halo(255, 240, 200, 1.6, 1.6, 0.8); h.position.set(x, 0.55, V.z1 + 0.14); g.add(h); }
  }
  // fuelle entre vagones (pasillo cerrado de goma)
  if (nuestro) g.add(caja(0.05, 2.1, 0.6, mOscuro, -0.55, 1.05, V.z0 - 0.3), caja(0.05, 2.1, 0.6, mOscuro, 0.55, 1.05, V.z0 - 0.3), caja(1.1, 0.05, 0.6, mOscuro, 0, 2.1, V.z0 - 0.3), caja(1.1, 0.05, 0.6, mOscuro, 0, 0.0, V.z0 - 0.3));
  return { g, ventanas, luces, extremos };
}

export function crearMetro() {
  const raiz = new THREE.Group();
  const tren = new THREE.Group(); raiz.add(tren);
  const nos = vagon(true); tren.add(nos.g);
  const atras = vagon(false); atras.g.position.z = ATRAS; tren.add(atras.g);

  // ---- piezas propias de nuestro vagón ----
  const mapa = new LienzoVivo(1024, 192);
  for (const zc of PUERTAS_Z) for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.23), new THREE.MeshLambertMaterial({ map: mapa.tex, emissive: "#ffffff", emissiveMap: mapa.tex, emissiveIntensity: 0.35 }));
    m.rotation.y = -s * Math.PI / 2; m.position.set(s * (V.x - 0.04), 2.04, zc); nos.g.add(m);
  }
  // letrero LED sobre la puerta entre vagones
  const led = new LienzoVivo(1024, 128);
  const ledM = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.18), new THREE.MeshBasicMaterial({ map: led.tex, toneMapped: false })); ledM.position.set(0, 2.08, V.z0 + 0.04); ledM.layers.set(NOINK); nos.g.add(ledM);
  const altavoz = new THREE.Group(); altavoz.position.set(0, V.alto - 0.02, 1.4);
  altavoz.add(caja(0.34, 0.03, 0.34, lambert({ color: "#bdb6a0" }), 0, 0, 0));
  for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) if (i * i + j * j <= 9) altavoz.add(caja(0.025, 0.012, 0.025, lambert({ color: "#3a3833" }), i * 0.04, -0.02, j * 0.04));
  nos.g.add(altavoz);
  // freno de emergencia: caja amarilla y negra con palanca roja
  const palanca = new THREE.Group(); palanca.position.set(PALANCA.x, PALANCA.y, PALANCA.z); palanca.rotation.y = -Math.PI / 2;
  palanca.add(caja(0.34, 0.42, 0.05, lambert({ map: lienzo((c, w, h) => {
    c.fillStyle = "#f0c419"; c.fillRect(0, 0, w, h);
    c.fillStyle = "#151515"; for (let i = -8; i < 16; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 16, 0); c.lineTo(i * 32 + 16 - h, h); c.lineTo(i * 32 - h, h); c.fill(); }
    c.fillStyle = "#f0c419"; c.fillRect(w * 0.1, h * 0.08, w * 0.8, h * 0.3); c.fillStyle = "#151515"; c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.textAlign = "center";
    c.fillText("FRENO DE", w / 2, h * 0.2); c.fillText("EMERGENCIA", w / 2, h * 0.33);
  }, 256, 320) }), 0, 0, 0));
  const brazoPal = new THREE.Group(); brazoPal.position.set(0, -0.02, 0.04);
  brazoPal.add(caja(0.05, 0.22, 0.05, lambert({ color: "#c81e1e", emissive: "#3a0404" }), 0, -0.09, 0.02), caja(0.18, 0.05, 0.06, lambert({ color: "#d82424", emissive: "#3a0404" }), 0, -0.2, 0.03));
  palanca.add(brazoPal); nos.g.add(palanca);
  const haloPal = halo(255, 60, 40, 0.7, 0.7, 0.25); haloPal.rotation.y = -Math.PI / 2; haloPal.position.set(PALANCA.x - 0.06, PALANCA.y - 0.1, PALANCA.z); nos.g.add(haloPal);

  // ---- vagón de atrás: ventana que se rompe y luz del celular ----
  const grieta = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.85), new THREE.MeshBasicMaterial({ map: lienzo((c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = "rgba(235,245,250,0.95)"; c.lineWidth = 3;
    const cx = w * 0.45, cy = h * 0.45;
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + Math.sin(i * 3) * 0.2; let x = cx, y = cy; c.beginPath(); c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += Math.cos(a + Math.sin(k * 7 + i) * 0.35) * 50; y += Math.sin(a + Math.sin(k * 5 + i) * 0.35) * 30; c.lineTo(x, y); } c.stroke(); }
    for (let r = 25; r < 200; r += 45) { c.beginPath(); c.ellipse(cx, cy, r, r * 0.6, 0, 0, 7); c.stroke(); }
    c.fillStyle = "rgba(10,14,18,0.85)"; c.beginPath(); c.ellipse(cx, cy, 70, 45, 0.3, 0, 7); c.fill(); // hueco
  }, 512, 288), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  grieta.rotation.y = Math.PI / 2; grieta.position.set(V.x - 0.03, 1.33, ATRAS - 2.5); grieta.layers.set(NOINK); grieta.visible = false; tren.add(grieta);
  const luzCel = new THREE.PointLight("#bfe6ff", 0, 2.5, 2); luzCel.position.set(0.5, 1.3, ATRAS + 4); tren.add(luzCel);
  const luzCelNos = new THREE.PointLight("#bfe6ff", 0, 1.6, 2); tren.add(luzCelNos); // tu celular (regla 2)

  // ---- túnel (se desplaza) ----
  const exterior = new THREE.Group(); raiz.add(exterior);
  const TL = 120;
  const muroTex = texConcreto([TL / 4, 1]);
  const muroIzq = new THREE.Mesh(new THREE.PlaneGeometry(TL, 4.2), lambert({ map: muroTex, emissive: "#ffffff", emissiveMap: muroTex, emissiveIntensity: 0.45 })); muroIzq.rotation.y = Math.PI / 2; muroIzq.position.set(-2.5, 1.0, -20); exterior.add(muroIzq);
  const muroDer = new THREE.Mesh(new THREE.PlaneGeometry(TL, 4.2), lambert({ map: muroTex, emissive: "#ffffff", emissiveMap: muroTex, emissiveIntensity: 0.45 })); muroDer.rotation.y = -Math.PI / 2; muroDer.position.set(2.5, 1.0, -20); exterior.add(muroDer);
  const boveda = new THREE.Mesh(new THREE.PlaneGeometry(5, TL), lambert({ color: "#1c242b" })); boveda.rotation.x = Math.PI / 2; boveda.position.set(0, 3.1, -20); exterior.add(boveda);
  const balasto = new THREE.Mesh(new THREE.PlaneGeometry(5, TL), lambert({ color: "#24211e" })); balasto.rotation.x = -Math.PI / 2; balasto.position.set(0, -1.0, -20); exterior.add(balasto);
  for (const x of [-0.72, 0.72]) exterior.add(caja(0.08, 0.1, TL, lambert({ color: "#6d6a66" }), x, -0.95, -20)); // rieles
  const banqueta = caja(0.9, 0.75, TL, lambert({ color: "#3a4148" }), 2.05, -0.625, -20); exterior.add(banqueta); // pasillo de servicio
  exterior.add(caja(0.9, 0.75, TL, lambert({ color: "#3a4148" }), -2.05, -0.625, -20));
  // lámparas del túnel cada 7 m (grupo que se desplaza en ciclo)
  const lamparas = new THREE.Group(); exterior.add(lamparas);
  for (let z = -77; z <= 42; z += 3.5) for (const s of [-1, 1]) {
    const l = caja(0.05, 0.08, 0.6, brillo("#cfe6ff"), s * 2.47, 1.25, z); l.layers.set(NOINK); lamparas.add(l);
    const h = halo(150, 200, 255, 1.4, 1.0, 0.55); h.rotation.y = -s * Math.PI / 2; h.position.set(s * 2.44, 1.25, z); lamparas.add(h);
  }
  const luzTunel = new THREE.PointLight("#9cc8ff", 1.6, 5, 1.5); exterior.add(luzTunel); // la lámpara que pasa junto a la ventana

  // ---- andén (uno solo, se viste distinto en cada estación) ----
  const anden = new THREE.Group(); raiz.add(anden);
  const AL = 46;
  anden.add(caja(5.4, 1.0, AL, lambert({ color: "#6f6a62" }), 4.2, -0.5, 0)); // plataforma (su borde junto al tren)
  const pisoA = new THREE.Mesh(new THREE.PlaneGeometry(5.4, AL), lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#8a857b"; c.fillRect(0, 0, w, h); c.strokeStyle = "#76716a"; c.lineWidth = 3; c.strokeRect(0, 0, w, h); }, 64, 64, [7, 60]) }));
  pisoA.rotation.x = -Math.PI / 2; pisoA.position.set(4.2, 0.003, 0); anden.add(pisoA);
  const franja = new THREE.Mesh(new THREE.PlaneGeometry(0.3, AL), lambert({ color: "#d6b21e" })); franja.rotation.x = -Math.PI / 2; franja.position.set(1.85, 0.005, 0); anden.add(franja);
  const muroA = new THREE.Mesh(new THREE.PlaneGeometry(AL, 4.2), lambert({ map: texAzulejo([AL / 2, 2]) })); muroA.rotation.y = -Math.PI / 2; muroA.position.set(6.9, 2.1, 0); anden.add(muroA);
  const techoA = new THREE.Mesh(new THREE.PlaneGeometry(5.6, AL), lambert({ color: "#3a3f42" })); techoA.rotation.x = Math.PI / 2; techoA.position.set(4.2, 4.0, 0); anden.add(techoA);
  for (let z = -20; z <= 20; z += 6) anden.add(caja(0.45, 4.0, 0.45, lambert({ color: "#9a9d97" }), 4.4, 2.0, z)); // columnas
  const letreros: THREE.Mesh[] = [];
  for (const z of [-15, 0, 15]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 0.6), lambert({ map: texTexto("ESTACIÓN", "#c27a2c", "#ffffff", 512, 96) })); m.rotation.y = -Math.PI / 2; m.position.set(6.88, 1.85, z); anden.add(m); letreros.push(m); }
  const lamparasA: { tubo: THREE.Mesh; halo: THREE.Mesh }[] = [];
  for (let z = -21; z <= 21; z += 6) {
    const tubo = caja(0.2, 0.05, 1.6, brillo("#f2f6ff"), 3.6, 3.9, z); tubo.layers.set(NOINK); anden.add(tubo);
    const h = halo(230, 240, 255, 2.4, 2.4, 0.35); h.rotation.x = Math.PI / 2; h.position.set(3.6, 3.86, z); anden.add(h);
    lamparasA.push({ tubo, halo: h });
  }
  const luzAnden = [new THREE.PointLight("#e8eeff", 2.2, 10, 1.3), new THREE.PointLight("#e8eeff", 2.2, 10, 1.3)];
  luzAnden.forEach((l) => anden.add(l));
  // la única lámpara encendida de tu estación: cono de luz
  const cono = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.7, 32, 1, true), new THREE.MeshBasicMaterial({ color: "#fff2d6", transparent: true, opacity: 0.035, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  cono.layers.set(NOINK); cono.visible = false; anden.add(cono);
  anden.visible = false;

  return { raiz, tren, nos, atras, mapa, led, palanca, brazoPal, grieta, luzCel, luzCelNos, exterior, lamparas, luzTunel, muroDer, banqueta, anden, letreros, lamparasA, luzAnden, cono, altavoz };
}
