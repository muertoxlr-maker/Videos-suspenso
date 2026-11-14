// Piezas nuevas de «El último tren» sobre el metro de «Último vagón» (`ultimo_vagon/metro.ts`): escalera eléctrica en el
// andén, multitud de zombies pegada a las ventanas, brazo de zombie que se mete entre las puertas, extintor, el refugio
// del túnel (pared con las tres reglas, linternas, catres, huacales, letrero) y la sirena. Acabado §8.9; §8.6d.
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor, texTexto } from "../turno3/comun";
import { catre, huacal, lampara, texMultitud } from "../ambulancia/ambulancia";
import { V } from "../ultimo_vagon/metro";

const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const destello = (r: number, g: number, b: number, tam: number, op = 0.5) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  sp.scale.set(tam, tam, 1); sp.layers.set(NOINK); return sp;
};
const cil = (rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 14) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); return c; };
const rz = (n: number) => { const x = Math.sin(n * 91.7) * 43758.5453; return x - Math.floor(x); };
const manchas = (c: CanvasRenderingContext2D, w: number, h: number, n: number, col = "18,16,14", a = 0.25) => {
  for (let k = 0; k < n; k++) { const x = (k * 71 + 13) % w, y = (k * 113 + 7) % h, g = c.createRadialGradient(x, y, 2, x, y, 26 + (k % 3) * 16); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(0, 0, w, h); }
};

/** las tres reglas pintadas con brocha sobre el azulejo del andén */
const texReglas = () => lienzo((c, w, h) => { // vertical, para que quepa entera en el celular
  c.clearRect(0, 0, w, h);
  c.fillStyle = "rgba(235,230,215,0.92)"; c.fillRect(16, 16, w - 32, h - 32); manchas(c, w, h, 10, "60,50,40", 0.25);
  c.fillStyle = "#8a1c16"; c.textAlign = "center"; c.font = "bold 92px 'DejaVu Sans', sans-serif"; c.fillText("REGLAS", w / 2, 116); c.fillRect(w * 0.25, 134, w * 0.5, 9);
  c.textAlign = "left"; c.font = "bold 50px 'DejaVu Sans', sans-serif";
  const L = ["1. A LAS 10 SE APAGAN", "    LAS LUCES. EN LO", "    OSCURO, NADIE HABLA.", "2. NADIE CAMINA", "    POR LAS VÍAS.", "3. DESPUÉS DE LA SIRENA,", "    NADIE SE SUBE AL TREN.", "    NI TU FAMILIA."];
  L.forEach((t, i) => c.fillText(t, 40, 230 + i * 74 + (i >= 3 ? 34 : 0) + (i >= 5 ? 34 : 0)));
  c.fillStyle = "rgba(138,28,22,0.85)"; for (let k = 0; k < 10; k++) c.fillRect(60 + rz(k * 3) * (w - 160), 244 + Math.floor(rz(k) * 8) * 74, 5, 24 + rz(k + 5) * 40);
}, 820, 1000);
const texEscalones = () => lienzo((c, w, h) => { // escalones metálicos con ranuras y orilla amarilla
  c.fillStyle = "#5a5e64"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#3a3e44"; for (let x = 6; x < w; x += 12) c.fillRect(x, 0, 5, h);
  c.fillStyle = "#d6b21e"; c.fillRect(0, h - 14, w, 14); c.fillRect(0, 0, 10, h); c.fillRect(w - 10, 0, 10, h);
  c.fillStyle = "#1a1c20"; c.fillRect(0, h - 4, w, 4);
}, 128, 64, [1, 14]);

export function crearExtras(anden: THREE.Group, nos: THREE.Group) {
  // ---------------- escalera eléctrica (en el fondo del andén, sube hacia −z) ----------------
  const escalera = new THREE.Group(); escalera.position.set(4.9, 0, -13.5); anden.add(escalera);
  const largo = 9.2, ang = Math.atan2(3.9, 8.4);
  const rampa = new THREE.Group(); rampa.rotation.x = ang; escalera.add(rampa); // sube hacia −z
  const esc = new THREE.Mesh(new THREE.PlaneGeometry(1.1, largo), lambert({ map: texEscalones() })); esc.rotation.x = -Math.PI / 2; esc.position.set(0, 0.02, -largo / 2); rampa.add(esc);
  const mLado = lambert({ color: "#3a3e46" }), mPasa = lambert({ color: "#141416" });
  for (const s of [-1, 1]) {
    rampa.add(caja(0.12, 0.95, largo, mLado, s * 0.62, 0.42, -largo / 2)); // costados
    rampa.add(caja(0.1, 0.07, largo + 0.3, mPasa, s * 0.62, 0.95, -largo / 2)); // pasamanos de hule
  }
  escalera.add(caja(1.5, 0.08, 1.2, lambert({ color: "#7a7e84" }), 0, 0.04, 0.55)); // placa de abajo con peine
  escalera.add(caja(1.6, 0.06, 0.3, brillo("#d6b21e"), 0, 0.09, 0.05));
  const letEsc = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.4), lambert({ map: texTexto("↑ SALIDA", "#1f4f8a", "#ffffff", 512, 128) })); letEsc.position.set(0, 3.2, -1.2); letEsc.rotation.y = Math.PI; escalera.add(letEsc);
  const ESCALERA = { x: 4.9, z0: -13.5, pend: 3.9 / 8.4 }; // los zombies bajan sobre la rampa: y = (z0 − z) · pend

  // ---------------- multitud pegada a las ventanas del lado del andén ----------------
  const multitud = new THREE.Group(); anden.add(multitud);
  const filas: THREE.Mesh[] = [];
  for (let k = 0; k < 3; k++) for (let j = 0; j < 4; j++) {
    const m = new THREE.MeshLambertMaterial({ map: texMultitud(k * 5 + j * 3 + 2), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.12 });
    m.emissiveMap = m.map;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(9, 3.4), m); p.rotation.y = -Math.PI / 2; p.position.set(V.x + 0.35 + k * 0.5, 0.3 - k * 0.1, -14 + j * 9 + (k % 2) * 3); p.layers.set(NOINK); multitud.add(p); filas.push(p);
  }
  multitud.visible = false;

  // ---------------- brazo de zombie (sale entre las puertas hacia adentro, −x) ----------------
  const brazo = new THREE.Group(); nos.add(brazo);
  const piel = lambert({ color: "#9a9fa8" }), tinta = lambert({ color: "#141012" });
  const manga = cil(0.07, 0.08, 0.5, lambert({ color: "#4a6450" }), 0, 0, 0, 10); manga.rotation.z = Math.PI / 2; manga.position.x = 0.32; brazo.add(manga);
  // orilla en jirones de la manga
  for (let k = 0; k < 5; k++) { const j = caja(0.06, 0.05, 0.03, lambert({ color: "#4a6450" }), 0.05, Math.sin(k * 1.26) * 0.07, Math.cos(k * 1.26) * 0.07); j.rotation.z = 0.4; brazo.add(j); }
  const ante = cil(0.05, 0.055, 0.42, piel, 0, 0, 0, 10); ante.rotation.z = Math.PI / 2; ante.position.x = -0.12; brazo.add(ante);
  brazo.add(caja(0.035, 0.012, 0.012, lambert({ color: "#5a1416" }), -0.1, 0.05, 0.02), caja(0.03, 0.012, 0.012, lambert({ color: "#5a1416" }), -0.18, 0.04, -0.02)); // rasguños
  const mano = new THREE.Group(); mano.position.x = -0.36; brazo.add(mano);
  mano.add(caja(0.12, 0.05, 0.12, piel, 0, 0, 0));
  const dedos: THREE.Mesh[] = [];
  for (let k = 0; k < 4; k++) { const d = caja(0.11, 0.028, 0.026, piel, -0.1, 0, -0.045 + k * 0.03); mano.add(d); dedos.push(d); d.add(caja(0.02, 0.03, 0.028, tinta, -0.055, 0.003, 0)); }
  const pulgar = caja(0.07, 0.03, 0.03, piel, -0.04, 0, 0.075); pulgar.rotation.y = -0.6; mano.add(pulgar);
  brazo.visible = false;

  // ---------------- extintor (en su soporte junto a la puerta; y el que tú agarras) ----------------
  const extintor = () => {
    const g = new THREE.Group(), rojo = lambert({ color: "#c8261e" }), negro = lambert({ color: "#18181a" });
    g.add(cil(0.075, 0.075, 0.42, rojo, 0, 0.21, 0), cil(0.04, 0.075, 0.06, rojo, 0, 0.45, 0), cil(0.02, 0.02, 0.05, negro, 0, 0.5, 0));
    g.add(caja(0.12, 0.02, 0.03, negro, 0.03, 0.535, 0), caja(0.1, 0.02, 0.03, negro, 0.02, 0.51, 0)); // manija
    const mang = cil(0.012, 0.012, 0.32, negro, -0.09, 0.32, 0, 6); mang.rotation.z = 0.25; g.add(mang); g.add(cil(0.022, 0.016, 0.06, negro, -0.13, 0.17, 0, 8));
    const et = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.16), lambert({ map: texTexto("PQS", "#f2efe6", "#c8261e", 128, 160, "bold 40px 'DejaVu Sans', sans-serif") })); et.position.set(0, 0.24, 0.077); g.add(et);
    return g;
  };
  const extSoporte = extintor(); extSoporte.position.set(V.x - 0.12, 0.62, 3.95); extSoporte.rotation.y = -Math.PI / 2; nos.add(extSoporte);
  nos.add(caja(0.03, 0.1, 0.2, lambert({ color: "#2a2c2e" }), V.x - 0.03, 0.85, 3.95));
  const extMano = extintor(); extMano.visible = false; nos.add(extMano);

  // ---------------- el refugio (el mismo andén, vestido distinto) ----------------
  const refugio = new THREE.Group(); anden.add(refugio);
  const reglas = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.32), new THREE.MeshLambertMaterial({ map: texReglas(), transparent: true })); reglas.rotation.y = -Math.PI / 2; reglas.position.set(6.86, 1.7, -4); refugio.add(reglas);
  const letRef = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.55), lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#e8e2cc"; c.fillRect(0, 0, w, h); manchas(c, w, h, 4, "60,50,40", 0.3); c.fillStyle = "#2a5a3a"; c.font = "bold 74px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("REFUGIO", w / 2, h / 2 + 4); }, 512, 110) }));
  letRef.rotation.y = -Math.PI / 2; letRef.position.set(6.86, 3.25, -7.2); refugio.add(letRef);
  const mMad = lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#8a6a44"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(40,26,14,0.5)"; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * h / 4); c.lineTo(w, i * h / 4); c.stroke(); } }, 128, 128) });
  const mPalo = lambert({ color: "#5a4a3a" });
  const catres: THREE.Group[] = [];
  for (let k = 0; k < 4; k++) { const ct = catre(mPalo, lambert({ color: ["#6a7a5a", "#5a6a7a", "#7a6a5a", "#6a5a6a"][k] })); ct.rotation.y = Math.PI / 2; ct.position.set(5.6, 0, 3 + k * 2.4); refugio.add(ct); catres.push(ct); }
  refugio.add(huacal(6.3, 0, -0.6, mMad), huacal(6.3, 0.4, -0.55, mMad, 0.55, 0.36, 0.42), huacal(6.3, 0, -1.4, mMad));
  for (let k = 0; k < 3; k++) { const g = new THREE.Group(); g.position.set(6.4, 0, -7.2 + k * 0.42); g.add(cil(0.17, 0.17, 0.42, new THREE.MeshLambertMaterial({ color: "#6aa8d8", transparent: true, opacity: 0.75 }), 0, 0.21, 0, 12), cil(0.045, 0.045, 0.05, lambert({ color: "#2a4a8a" }), 0, 0.46, 0, 8)); refugio.add(g); }
  const linternas: THREE.Group[] = [];
  for (const [x, z] of [[5.0, -2.6], [5.9, 1.4], [3.2, 6.5], [5.2, 10.5]] as [number, number][]) { const l = lampara(); l.position.set(x, 0.006, z); refugio.add(l); linternas.push(l); }
  const luzRef = [new THREE.PointLight("#ffc888", 3.0, 8, 1.5), new THREE.PointLight("#ffc888", 2.4, 8, 1.5), new THREE.PointLight("#ffc888", 2.0, 7, 1.5)];
  luzRef[0].position.set(5.2, 1.3, -2.8); luzRef[1].position.set(5.4, 1.2, 3.2); luzRef[2].position.set(4.6, 1.2, 9.5); luzRef.forEach((l) => refugio.add(l));
  // sirena: faro rojo en una columna
  const sirena = new THREE.Group(); sirena.position.set(4.4, 3.2, -0.3); refugio.add(sirena);
  sirena.add(caja(0.2, 0.1, 0.2, lambert({ color: "#2a2a2c" }), 0, -0.1, -0.23));
  const faro = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2), brillo("#4a0e0e")); faro.position.set(0, -0.05, -0.23); faro.layers.set(NOINK); sirena.add(faro);
  const haloSir = destello(255, 40, 30, 1.6, 0); haloSir.position.set(0, 0, -0.23); sirena.add(haloSir);
  const luzSir = new THREE.PointLight("#ff2a1a", 0, 12, 1.4); luzSir.position.set(-0.4, -0.2, -0.3); sirena.add(luzSir);
  refugio.visible = false;

  // lámpara que trae tu mamá (va en su mano; se mueve con ella)
  const lamMama = lampara(); lamMama.visible = false; anden.add(lamMama);
  const luzMama = new THREE.PointLight("#ffd29a", 0, 7, 1.5); lamMama.add(luzMama); luzMama.position.y = 0.3;

  return { escalera, ESCALERA, multitud, filas, brazo, mano, dedos, extMano, extSoporte, refugio, reglas, catres, linternas, luzRef, sirena, faro, haloSir, luzSir, lamMama, luzMama };
}
