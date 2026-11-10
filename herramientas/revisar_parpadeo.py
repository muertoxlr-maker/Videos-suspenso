"""Busca parpadeos (z-fighting: dos superficies en el mismo lugar que se pelean cuadro a cuadro).

Marca los píxeles que cambian en un cuadro y regresan en el siguiente (sube-baja o baja-sube). El movimiento normal
(gente caminando, puertas, cortes de plano, textos que aparecen) también marca algo; los parpadeos se ven como
manchas o rayas rojas sobre objetos QUIETOS (pisos, bordes, marcos, mesas) que se repiten en muchos segundos.

Uso:
  python3 herramientas/revisar_parpadeo.py video.mp4               → segundos con más parpadeo
  python3 herramientas/revisar_parpadeo.py video.mp4 out.jpg 9,14  → mapa rojo de esos segundos para mirarlo
Funciona igual con un clip corto de prueba (npx remotion render <Comp> clip.mp4 --frames=A-B --scale=0.5).
"""
import sys

import cv2
import numpy as np


def leer(p):
    c = cv2.VideoCapture(p); gris, color = [], []
    while True:
        ok, f = c.read()
        if not ok:
            break
        s = cv2.resize(f, (270, 480)); color.append(s); gris.append(cv2.cvtColor(s, cv2.COLOR_BGR2GRAY).astype(np.int16))
    return gris, color


def mascara(g, i, umbral=18):
    a = g[i] - g[i - 1]; b = g[i + 1] - g[i]
    m = (np.abs(a) > umbral) & (np.abs(b) > umbral) & (np.sign(a) != np.sign(b))
    m[290:340] = False; m[400:] = False  # zona de subtítulos
    return m


g, col = leer(sys.argv[1])
if len(sys.argv) > 3:
    outs = []
    for seg in [int(x) for x in sys.argv[3].split(",")]:
        acc = sum(mascara(g, i).astype(int) for i in range(max(1, seg * 30 + 1), min(len(g) - 1, seg * 30 + 29)))
        im = col[min(len(col) - 1, seg * 30 + 15)].copy(); im[acc > 2] = (0, 0, 255)
        cv2.putText(im, f"{seg}s", (5, 25), 0, 0.8, (0, 255, 255), 2); outs.append(im)
    cv2.imwrite(sys.argv[2], np.hstack(outs)); print("mapa:", sys.argv[2])
else:
    n = np.array([0] + [int(mascara(g, i).sum()) for i in range(1, len(g) - 1)] + [0])
    print(f"cuadros con más de 30 px parpadeando: {(n > 30).sum()} de {len(n)}")
    seg = [(s, int((n[s * 30:(s + 1) * 30] > 30).sum())) for s in range(len(n) // 30 + 1)]
    print("segundos más sospechosos (s: cuadros):", ", ".join(f"{s}: {k}" for s, k in sorted(seg, key=lambda x: -x[1])[:12]))
