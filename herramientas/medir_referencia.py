"""Mide TODOS los cuadros de un short vertical de referencia.

Basado en `tutorial-caricatura/herramientas/medir_30fps.py` (MIT, © 2026 Mr omi y Crea con LuisPa),
con estos cambios:
  - Ignora en la medición de movimiento las zonas con texto fijo en pantalla (marca de agua, subtítulos,
    rótulo superior), que si no hacen parecer quieta a la cámara.
  - Divide el video en planos (entre cortes duros) y da medidas por plano.
  - Detecta destellos/fundidos (saltos de brillo cortos) aparte de los cortes duros.
  - Guarda tiras de cuadros consecutivos del centro de cada plano para revisar personajes y movimiento.

Uso:  python3 herramientas/medir_referencia.py video.mp4 carpeta_salida
Salida: medidas.csv, resumen.json, planos/plano_NNN.jpg (12 cuadros seguidos), hojas/hoja_NNN.jpg (60 cuadros)
"""
import csv
import json
import os
import subprocess
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw

W, H = 270, 480          # tamaño para medir (escala 0.25 de 1080x1920)
TW, TH = 108, 192        # miniatura en las hojas
ESCALA = 1080 / W
FPS = 30


def cuadros(ruta, w, h):
    cmd = ["ffmpeg", "-v", "error", "-i", ruta, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)


def mascara():
    """255 donde se buscan puntos de la escena; 0 en zonas de texto/marca de agua."""
    m = np.full((H, W), 255, np.uint8)
    m[: int(H * 0.09), :] = 0                                  # rótulo superior / títulos
    m[int(H * 0.74): int(H * 0.84), :] = 0                     # banda de subtítulos
    m[int(H * 0.40): int(H * 0.58), : int(W * 0.30)] = 0       # marca de agua (centro-izquierda)
    m[int(H * 0.76):, int(W * 0.68):] = 0                      # marca de agua (abajo-derecha)
    return m


def movimiento(prev_g, g, orb, bf, mask):
    k1, d1 = orb.detectAndCompute(prev_g, mask)
    k2, d2 = orb.detectAndCompute(g, mask)
    if d1 is None or d2 is None or len(k1) < 12 or len(k2) < 12:
        return None
    m = bf.match(d1, d2)
    if len(m) < 12:
        return None
    a = np.float32([k1[x.queryIdx].pt for x in m])
    b = np.float32([k2[x.trainIdx].pt for x in m])
    M, inl = cv2.estimateAffinePartial2D(a, b, method=cv2.RANSAC, ransacReprojThreshold=1.5)
    if M is None or inl is None or inl.sum() < 10:
        return None
    s = float(np.hypot(M[0, 0], M[1, 0]))
    ang = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
    cx, cy = W / 2, H / 2
    nx = M[0, 0] * cx + M[0, 1] * cy + M[0, 2]
    ny = M[1, 0] * cx + M[1, 1] * cy + M[1, 2]
    return (nx - cx) * ESCALA, (ny - cy) * ESCALA, (s - 1) * 100, ang


def main():
    ruta, out = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.join(out, "hojas"), exist_ok=True)
    os.makedirs(os.path.join(out, "planos"), exist_ok=True)
    orb = cv2.ORB_create(800)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    mask = mascara()
    filas, hoja, prev_g, prev_hist, minis = [], [], None, None, []
    for i, rgb in enumerate(cuadros(ruta, W, H)):
        g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
        lum = g.astype(np.float32) / 255
        hist = cv2.calcHist([hsv], [0, 1], mask, [16, 8], [0, 180, 0, 256])
        cv2.normalize(hist, hist)
        p5, p50, p95 = np.percentile(lum, [5, 50, 95])
        sat = hsv[..., 1].astype(np.float32) / 255
        fila = {"cuadro": i, "seg": round(i / FPS, 3), "dx": 0.0, "dy": 0.0, "zoom_pct": 0.0, "giro": 0.0,
                "dif": 0.0, "dif_hist": 0.0, "brillo": round(float(lum.mean()), 3), "brillo_p5": round(float(p5), 3),
                "brillo_p50": round(float(p50), 3), "brillo_p95": round(float(p95), 3),
                "contraste": round(float(lum.std()), 3), "saturacion": round(float(sat.mean()), 3),
                "tono_medio": round(float(hsv[..., 0][sat > 0.25].mean() * 2) if (sat > 0.25).any() else -1, 1),
                "sin_medida": 0}
        if prev_g is not None:
            d = np.abs(g.astype(np.int16) - prev_g.astype(np.int16))
            fila["dif"] = round(float(d[mask > 0].mean()), 2)
            fila["dif_hist"] = round(float(cv2.compareHist(prev_hist, hist, cv2.HISTCMP_BHATTACHARYYA)), 3)
            r = movimiento(prev_g, g, orb, bf, mask)
            if r is None:
                fila["sin_medida"] = 1
            else:
                fila["dx"], fila["dy"], fila["zoom_pct"], fila["giro"] = (round(v, 3) for v in r)
        filas.append(fila)
        prev_g, prev_hist = g, hist
        mini = Image.fromarray(rgb).resize((TW, TH))
        minis.append(mini)
        hoja.append((i, mini))
        if len(hoja) == 60:
            guardar_hoja(hoja, out)
            hoja = []
    if hoja:
        guardar_hoja(hoja, out)

    with open(os.path.join(out, "medidas.csv"), "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(filas[0].keys()))
        w.writeheader()
        w.writerows(filas)
    res = resumen(filas)
    for k, p in enumerate(res["planos"]):
        guardar_plano(k, p, minis, out)
    json.dump(res, open(os.path.join(out, "resumen.json"), "w"), indent=1, ensure_ascii=False)
    print(json.dumps(res["general"], ensure_ascii=False))


def guardar_hoja(hoja, out):
    cols, rows = 10, 6
    img = Image.new("RGB", (cols * TW, rows * (TH + 14)), (20, 20, 20))
    d = ImageDraw.Draw(img)
    for k, (i, im) in enumerate(hoja):
        x, y = (k % cols) * TW, (k // cols) * (TH + 14)
        img.paste(im, (x, y + 14))
        d.text((x + 3, y + 1), f"{i}  {i / FPS:.2f}s", fill=(255, 220, 0))
    img.save(os.path.join(out, "hojas", f"hoja_{hoja[0][0] // 60:03d}.jpg"), quality=85)


def guardar_plano(k, p, minis, out):
    """12 cuadros consecutivos del centro del plano."""
    a, b = p["inicio"], p["fin"]
    c = (a + b) // 2
    ini = max(a, min(c - 6, b - 11))
    sel = list(range(ini, min(b + 1, ini + 12)))
    img = Image.new("RGB", (12 * TW, TH + 14), (20, 20, 20))
    d = ImageDraw.Draw(img)
    for j, i in enumerate(sel):
        img.paste(minis[i], (j * TW, 14))
        d.text((j * TW + 3, 1), f"{i}", fill=(255, 220, 0))
    img.save(os.path.join(out, "planos", f"plano_{k:03d}.jpg"), quality=85)


def resumen(filas):
    n = len(filas)
    dif = np.array([f["dif"] for f in filas])
    dh = np.array([f["dif_hist"] for f in filas])
    br = np.array([f["brillo"] for f in filas])
    med = np.median(dif[1:]) if n > 1 else 0
    # corte duro: salto grande de imagen y de colores en un solo cuadro
    cortes = [i for i in range(1, n) if (dif[i] > max(18, 6 * med) and dh[i] > 0.25) or dh[i] > 0.45]
    # destello/fundido: el brillo se dispara o cae y vuelve en <= 8 cuadros sin ser corte
    destellos = []
    for i in range(1, n - 1):
        if i in cortes:
            continue
        if abs(br[i] - br[i - 1]) > 0.08:
            destellos.append(i)
    vel = np.array([np.hypot(f["dx"], f["dy"]) for f in filas])
    zoom = np.array([abs(f["zoom_pct"]) for f in filas])
    giro = np.array([abs(f["giro"]) for f in filas])
    medido = np.array([not f["sin_medida"] for f in filas])
    mov = ((vel > 0.3) | (zoom > 0.03) | (giro > 0.02)) & medido
    for c in cortes:
        mov[c] = False
    # planos entre cortes
    limites = [0] + cortes + [n]
    planos = []
    for a, b in zip(limites[:-1], limites[1:]):
        b -= 1
        if b < a:
            continue
        sl = slice(a, b + 1)
        z = np.array([filas[k]["zoom_pct"] for k in range(a, b + 1)])
        dx = np.array([filas[k]["dx"] for k in range(a, b + 1)])
        dy = np.array([filas[k]["dy"] for k in range(a, b + 1)])
        tipo = ("acercamiento" if z.sum() > 1 else "alejamiento" if z.sum() < -1 else
                "paneo" if abs(dx.sum()) > 40 or abs(dy.sum()) > 40 else "casi fijo")
        planos.append({
            "inicio": a, "fin": b, "cuadros": b - a + 1, "segundos": round((b - a + 1) / FPS, 2),
            "tipo": tipo, "zoom_total_pct": round(float(z.sum()), 2),
            "desplaz_total_px": [round(float(dx.sum()), 1), round(float(dy.sum()), 1)],
            "pct_moviendose": round(100 * float(mov[sl].mean()), 1),
            "pct_sin_medida": round(100 * float(1 - medido[sl].mean()), 1),
            "brillo": round(float(br[sl].mean()), 3),
            "saturacion": round(float(np.mean([filas[k]["saturacion"] for k in range(a, b + 1)])), 3),
        })
    dur = np.array([p["cuadros"] for p in planos])
    return {
        "general": {
            "cuadros": n, "segundos": round(n / FPS, 2), "cortes_duros": len(cortes), "planos": len(planos),
            "duracion_plano_mediana_s": round(float(np.median(dur)) / FPS, 2),
            "duracion_plano_media_s": round(float(dur.mean()) / FPS, 2),
            "duracion_plano_min_max_s": [round(float(dur.min()) / FPS, 2), round(float(dur.max()) / FPS, 2)],
            "destellos_o_fundidos": len(destellos),
            "pct_cuadros_camara_moviendose": round(100 * float(mov.mean()), 1),
            "pct_cuadros_medibles": round(100 * float(medido.mean()), 1),
            "pct_cuadros_con_zoom": round(100 * float(((zoom > 0.03) & medido).mean()), 1),
            "zoom_mediano_pct_por_cuadro": round(float(np.median(zoom[medido & (zoom > 0.03)])) if ((zoom > 0.03) & medido).any() else 0, 3),
            "brillo_medio": round(float(br.mean()), 3),
            "brillo_p5_medio": round(float(np.mean([f["brillo_p5"] for f in filas])), 3),
            "brillo_p95_medio": round(float(np.mean([f["brillo_p95"] for f in filas])), 3),
            "contraste_medio": round(float(np.mean([f["contraste"] for f in filas])), 3),
            "saturacion_media": round(float(np.mean([f["saturacion"] for f in filas])), 3),
        },
        "cortes_en_cuadro": cortes,
        "destellos_en_cuadro": destellos,
        "planos": planos,
    }


if __name__ == "__main__":
    main()
