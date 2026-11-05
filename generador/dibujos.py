"""Dibujos procedurales en estilo cartoon: escenarios y personajes.

Todo se dibuja con Pillow a doble resolución y luego se reduce, para que
los bordes queden suaves. No hace falta ninguna imagen externa.
"""
import math
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

from tipografia import fuente

CONTORNO = (22, 16, 20)


# ---------------------------------------------------------------- utilidades

def rgb(c):
    """Convierte '#rrggbb' o una tupla en tupla RGB."""
    if isinstance(c, str):
        c = c.lstrip("#")
        if len(c) == 3:
            c = "".join(ch * 2 for ch in c)
        return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))
    return tuple(c[:3])


def mezclar(a, b, t):
    a, b = rgb(a), rgb(b)
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def oscurecer(c, t=0.3):
    return mezclar(c, (0, 0, 0), t)


def degradado(w, h, arriba, abajo):
    arriba, abajo = rgb(arriba), rgb(abajo)
    col = Image.linear_gradient("L").resize((1, h))
    capa_a = Image.new("RGB", (1, h), arriba)
    capa_b = Image.new("RGB", (1, h), abajo)
    return Image.composite(capa_b, capa_a, col).resize((w, h))


def _pegar(img, capa, x, y, modo="normal"):
    """Pega una capa RGBA en (x, y) recortando lo que se salga del lienzo."""
    W, H = img.size
    cw, ch = capa.size
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(W, x + cw), min(H, y + ch)
    if x1 <= x0 or y1 <= y0:
        return
    trozo = capa.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    if modo == "pantalla":
        base = img.crop((x0, y0, x1, y1)).convert("RGB")
        color = Image.new("RGB", trozo.size, (0, 0, 0))
        color.paste(trozo.convert("RGB"), (0, 0), trozo.split()[3])
        img.paste(ImageChops.screen(base, color), (x0, y0))
    else:
        img.paste(trozo, (x0, y0), trozo)


def brillo(img, cx, cy, r, color, alpha=170, modo="pantalla"):
    """Halo de luz difuminado centrado en (cx, cy)."""
    borde = int(r * 1.2)
    lado = int(2 * (r + borde))
    capa = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    c = lado / 2
    ImageDraw.Draw(capa).ellipse([c - r, c - r, c + r, c + r], fill=rgb(color) + (alpha,))
    capa = capa.filter(ImageFilter.GaussianBlur(r * 0.55))
    _pegar(img, capa, int(cx - c), int(cy - c), modo)


def vineta(img, fuerza=0.75):
    W, H = img.size
    m = Image.radial_gradient("L").resize((W, H))
    m = m.point(lambda v: int(min(255, max(0, (v - 90) * 1.6)) * fuerza))
    negro = Image.new("RGB", (W, H), (6, 3, 6))
    return Image.composite(negro, img, m)


def niebla(img, y, alto, color=(120, 60, 60), alpha=90, semilla=1):
    W, H = img.size
    rnd = random.Random(semilla)
    capa = Image.new("RGBA", (W, int(alto * 2)), (0, 0, 0, 0))
    d = ImageDraw.Draw(capa)
    for _ in range(14):
        cx = rnd.uniform(-0.1, 1.1) * W
        cy = alto + rnd.uniform(-0.3, 0.3) * alto
        rx, ry = rnd.uniform(0.2, 0.45) * W, rnd.uniform(0.25, 0.5) * alto
        d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=rgb(color) + (alpha // 3,))
    capa = capa.filter(ImageFilter.GaussianBlur(alto * 0.25))
    _pegar(img, capa, 0, int(y - alto), "pantalla")


def rect_redondo(d, caja, r, fill, ancho, contorno=CONTORNO):
    d.rounded_rectangle(caja, radius=r, fill=fill, outline=contorno, width=ancho)


def texto_centrado(d, cx, cy, txt, f, fill, **kw):
    d.text((cx, cy), txt, font=f, fill=fill, anchor="mm", **kw)


# --------------------------------------------------------------- escenarios
# Cada fondo recibe (img, rnd, opciones). img es RGB a doble resolución.

def fondo_calle(img, rnd, op):
    W, H = img.size
    img.paste(degradado(W, H, "#2a0f1e", "#7a2a22"))
    d = ImageDraw.Draw(img)
    horizonte = int(H * 0.56)
    # edificios
    x = -20
    while x < W:
        bw = rnd.randint(int(W * 0.14), int(W * 0.28))
        bh = rnd.randint(int(H * 0.18), int(H * 0.42))
        color = mezclar("#1d0f18", "#3a1a22", rnd.random())
        d.rectangle([x, horizonte - bh, x + bw, horizonte], fill=color)
        for wy in range(horizonte - bh + 40, horizonte - 40, 70):
            for wx in range(x + 24, x + bw - 40, 56):
                if rnd.random() < 0.35:
                    d.rectangle([wx, wy, wx + 28, wy + 38], fill=mezclar("#ffb35a", "#ffd98a", rnd.random()))
        x += bw + rnd.randint(4, 30)
    # letrero
    letrero = op.get("letrero")
    if letrero:
        lx, ly = int(W * 0.68), int(H * 0.25)
        f = fuente("titulo", int(W * 0.075))
        caja = d.textbbox((lx, ly), letrero, font=f, anchor="mm")
        d.rectangle([caja[0] - 30, caja[1] - 24, caja[2] + 30, caja[3] + 24], fill="#140a10", outline="#3a2030", width=8)
        brillo(img, lx, ly, W * 0.22, "#ff3b3b", 120)
        d = ImageDraw.Draw(img)
        apagada = op.get("letra_apagada", 1)
        x0 = caja[0]
        for i, letra in enumerate(letrero):
            color = "#5a1a20" if i == apagada else "#ff5a4a"
            d.text((x0, ly), letra, font=f, fill=color, anchor="lm")
            x0 += d.textlength(letra, font=f)
    # calle
    d.rectangle([0, horizonte, W, H], fill="#1a1014")
    cx = W // 2
    d.polygon([(cx - 40, horizonte), (cx + 40, horizonte), (W * 1.1, H), (-W * 0.1, H)], fill="#2b1c20")
    for i in range(7):
        t0, t1 = (i / 7) ** 1.8, ((i + 0.5) / 7) ** 1.8
        y0 = horizonte + (H - horizonte) * t0
        y1 = horizonte + (H - horizonte) * t1
        a0, a1 = 4 + 30 * t0, 4 + 30 * t1
        d.polygon([(cx - a0, y0), (cx + a0, y0), (cx + a1, y1), (cx - a1, y1)], fill="#d9b25a")
    # farolas
    for fx in (0.12, 0.88):
        x = int(W * fx)
        d.rectangle([x - 10, int(H * 0.3), x + 10, horizonte + 160], fill="#0f0a0c")
        brillo(img, x, int(H * 0.3), W * 0.16, "#ffb060", 200)
        d = ImageDraw.Draw(img)
    niebla(img, horizonte + 40, H * 0.12, (160, 70, 60), 150, rnd.randint(0, 999))


def fondo_recepcion(img, rnd, op):
    W, H = img.size
    img.paste(degradado(W, H, "#3a1c16", "#1c0d0c"))
    d = ImageDraw.Draw(img)
    for x in range(0, W, 90):
        d.rectangle([x, 0, x + 40, int(H * 0.62)], fill="#43221a")
    # tablero de llaves
    tx0, ty0, tx1, ty1 = int(W * 0.18), int(H * 0.16), int(W * 0.82), int(H * 0.40)
    rect_redondo(d, [tx0, ty0, tx1, ty1], 20, "#5a3420", 10)
    f = fuente("mono", int(W * 0.022))
    for fila in range(3):
        for col in range(6):
            x = tx0 + 70 + col * (tx1 - tx0 - 140) / 5
            y = ty0 + 70 + fila * (ty1 - ty0 - 110) / 2
            d.ellipse([x - 10, y - 10, x + 10, y + 10], fill="#c9a35a")
            if not (fila == 2 and col == 3):  # falta la llave 313
                d.rectangle([x - 8, y + 10, x + 8, y + 70], fill="#d8b46a", outline=CONTORNO, width=4)
            d.text((x, y - 34), f"{fila + 1}{col + 1:02d}", font=f, fill="#e8c890", anchor="mm")
    brillo(img, W * 0.5, H * 0.1, W * 0.3, "#ffc070", 110)
    d = ImageDraw.Draw(img)
    # mostrador
    my = int(H * 0.62)
    d.rectangle([0, my + 60, W, H], fill="#2a1410")
    rect_redondo(d, [-20, my, W + 20, my + 90], 16, "#7a4524", 10)
    d.rectangle([-20, my + 90, W + 20, H], fill="#5a3018", outline=CONTORNO, width=10)
    for x in range(60, W, 200):
        d.rectangle([x, my + 140, x + 120, H - 80], outline="#43220f", width=8)
    # campana
    bx = int(W * 0.78)
    d.chord([bx - 60, my - 70, bx + 60, my + 50], 180, 360, fill="#e0b84a", outline=CONTORNO, width=8)
    d.rectangle([bx - 75, my - 10, bx + 75, my + 4], fill="#b8922a", outline=CONTORNO, width=6)


def fondo_pasillo(img, rnd, op):
    W, H = img.size
    img.paste((30, 12, 14), (0, 0, W, H))
    d = ImageDraw.Draw(img)
    fx, fy = W / 2, H * 0.43            # punto de fuga
    pw, ph = W * 0.16, H * 0.14         # tamaño del fondo del pasillo
    lejos = [fx - pw, fy - ph, fx + pw, fy + ph]
    # techo, suelo y paredes
    d.polygon([(0, 0), (W, 0), (lejos[2], lejos[1]), (lejos[0], lejos[1])], fill="#2a1416")
    d.polygon([(0, H), (W, H), (lejos[2], lejos[3]), (lejos[0], lejos[3])], fill="#5a1418")
    d.polygon([(0, 0), (lejos[0], lejos[1]), (lejos[0], lejos[3]), (0, H)], fill="#6a3a2c")
    d.polygon([(W, 0), (lejos[2], lejos[1]), (lejos[2], lejos[3]), (W, H)], fill="#5e3226")
    d.rectangle(lejos, fill="#0a0507")
    # patrón de la alfombra
    for i in range(1, 9):
        t = (i / 9) ** 1.7
        y = lejos[3] + (H - lejos[3]) * t
        xa = lejos[0] - (lejos[0]) * t
        xb = lejos[2] + (W - lejos[2]) * t
        d.line([(xa, y), (xb, y)], fill="#7a2228", width=int(4 + 10 * t))

    # puertas a ambos lados
    def en_pared(lado, t):
        """Punto sobre la pared a profundidad t (0 = cerca, 1 = lejos)."""
        x = (0 if lado < 0 else W) + ((lejos[0] if lado < 0 else lejos[2]) - (0 if lado < 0 else W)) * t
        arriba = 0 + (lejos[1]) * t
        abajo = H + (lejos[3] - H) * t
        return x, arriba, abajo

    f = fuente("mono", int(W * 0.03))
    for lado in (-1, 1):
        for k, (t0, t1) in enumerate([(0.08, 0.32), (0.5, 0.64), (0.75, 0.83)]):
            x0, a0, b0 = en_pared(lado, t0)
            x1, a1, b1 = en_pared(lado, t1)
            alto0, alto1 = b0 - a0, b1 - a1
            pts = [(x0, a0 + alto0 * 0.25), (x1, a1 + alto1 * 0.25), (x1, b1), (x0, b0)]
            d.polygon(pts, fill="#3a1c14", outline=CONTORNO)
            d.line(pts + [pts[0]], fill=CONTORNO, width=int(10 * (1 - t0)))
            if k == 0:
                num = op.get("puertas", ["311", "312"])[0 if lado < 0 else 1]
                d.text(((x0 + x1) / 2, a0 + alto0 * 0.31), num, font=f, fill="#d8b46a", anchor="mm")
    # lámparas del techo
    for t in (0.15, 0.45, 0.7, 0.86):
        y = lejos[1] * t
        ancho = (1 - t) * W * 0.12 + 10
        parpadea = op.get("parpadeo") and t == 0.45
        color = "#5a3a2a" if parpadea else "#ffd090"
        d.rectangle([fx - ancho, y + 10, fx + ancho, y + 10 + ancho * 0.2], fill=color)
        if not parpadea:
            brillo(img, fx, y + 40, ancho * 2.2, "#ff9a50", 110)
            d = ImageDraw.Draw(img)


def fondo_habitacion(img, rnd, op):
    W, H = img.size
    img.paste(degradado(W, H, "#2c1620", "#170a10"))
    d = ImageDraw.Draw(img)
    suelo = int(H * 0.66)
    for x in range(0, W, 120):
        d.line([(x, 0), (x, suelo)], fill="#341b26", width=30)
    d.rectangle([0, suelo, W, H], fill="#2a1612")
    for y in range(suelo + 50, H, 110):
        d.line([(0, y), (W, y)], fill="#21100e", width=10)
    # puerta (izquierda)
    px0, px1, py0 = int(W * 0.06), int(W * 0.42), int(H * 0.24)
    rect_redondo(d, [px0, py0, px1, suelo + 10], 10, "#4a2416", 12)
    d.rectangle([px0 + 50, py0 + 60, px1 - 50, py0 + 360], outline="#331709", width=10)
    d.rectangle([px0 + 50, py0 + 440, px1 - 50, suelo - 60], outline="#331709", width=10)
    d.ellipse([px1 - 90, int(H * 0.46) - 26, px1 - 38, int(H * 0.46) + 26], fill="#d8b04a", outline=CONTORNO, width=6)
    d.text(((px0 + px1) / 2, py0 + 30 + 0), "313", font=fuente("mono", int(W * 0.03)), fill="#d8b46a", anchor="mt")
    # luz bajo la puerta, con sombras de pies
    d.rectangle([px0 + 10, suelo - 4, px1 - 10, suelo + 14], fill="#ffcf7a")
    for sx in (0.42, 0.6):
        x = px0 + (px1 - px0) * sx
        d.rectangle([x - 30, suelo - 4, x + 30, suelo + 14], fill="#1a0a08")
    # ventana (derecha)
    vx0, vx1, vy0, vy1 = int(W * 0.56), int(W * 0.94), int(H * 0.14), int(H * 0.38)
    vent = degradado(vx1 - vx0, vy1 - vy0, "#0a1230", "#3a2a50")
    img.paste(vent, (vx0, vy0))
    brillo(img, vx0 + (vx1 - vx0) * 0.7, vy0 + 140, 70, "#f0f0ff", 230)
    d = ImageDraw.Draw(img)
    d.rectangle([vx0, vy0, vx1, vy1], outline=CONTORNO, width=16)
    d.line([((vx0 + vx1) / 2, vy0), ((vx0 + vx1) / 2, vy1)], fill=CONTORNO, width=12)
    # cama
    cx0, cy0 = int(W * 0.48), int(H * 0.53)
    rect_redondo(d, [cx0, cy0 - 120, W + 40, cy0 + 30], 30, "#4a2a1c", 10)
    rect_redondo(d, [cx0 - 10, cy0, W + 40, suelo + 80], 26, "#7a2c34", 10)
    rect_redondo(d, [cx0 + 30, cy0 - 50, cx0 + 260, cy0 + 40], 30, "#e8d8c8", 8)
    # lámpara de noche
    brillo(img, W * 0.47, H * 0.45, W * 0.12, "#ffb060", 140)


def fondo_puerta(img, rnd, op):
    W, H = img.size
    img.paste(degradado(W, H, "#1a0c10", "#0d0608"))
    d = ImageDraw.Draw(img)
    suelo = int(H * 0.86)
    px0, px1 = int(W * 0.12), int(W * 0.88)
    rect_redondo(d, [px0 - 40, int(H * 0.02), px1 + 40, suelo + 20], 16, "#2e170e", 16)
    d.rectangle([px0, int(H * 0.05), px1, suelo], fill="#53291a", outline=CONTORNO, width=14)
    for y0, y1 in [(0.1, 0.42), (0.48, 0.8)]:
        d.rectangle([px0 + 80, int(H * y0), px1 - 80, int(H * y1)], outline="#3a1b0e", width=16)
    # mirilla
    d.ellipse([W / 2 - 34, H * 0.2 - 34, W / 2 + 34, H * 0.2 + 34], fill="#c9a24a", outline=CONTORNO, width=8)
    d.ellipse([W / 2 - 12, H * 0.2 - 12, W / 2 + 12, H * 0.2 + 12], fill="#110808")
    # perilla
    kx, ky = px1 - 130, int(H * 0.47)
    d.ellipse([kx - 60, ky - 60, kx + 60, ky + 60], fill="#d8b04a", outline=CONTORNO, width=10)
    d.ellipse([kx - 24, ky - 40, kx + 4, ky - 12], fill="#f8e4a0")
    # luz bajo la puerta y pies
    d.rectangle([px0, suelo, px1, suelo + 26], fill="#ffd27a")
    brillo(img, W / 2, suelo + 10, W * 0.3, "#ffa040", 120)
    d = ImageDraw.Draw(img)
    for sx in (0.4, 0.58):
        x = W * sx
        d.rectangle([x - 50, suelo, x + 50, suelo + 26], fill="#120606")
    d.rectangle([0, suelo + 26, W, H], fill="#1a0c0a")


def fondo_ascensor(img, rnd, op):
    W, H = img.size
    img.paste(degradado(W, H, "#3a3434", "#141010"))
    d = ImageDraw.Draw(img)
    for x in range(0, W, int(W / 6)):
        d.line([(x, 0), (x, H)], fill="#2a2424", width=8)
    # pantalla de piso
    sx, sy = W / 2, H * 0.12
    rect_redondo(d, [sx - 170, sy - 90, sx + 170, sy + 90], 20, "#0a0404", 10)
    piso = str(op.get("piso", "0"))
    f = fuente("mono", int(W * 0.12))
    brillo(img, sx, sy, 150, "#ff2020", 120)
    d = ImageDraw.Draw(img)
    d.text((sx, sy), piso, font=f, fill="#ff3a2a", anchor="mm")
    # botonera
    bx0, by0 = int(W * 0.72), int(H * 0.3)
    rect_redondo(d, [bx0, by0, bx0 + 200, by0 + 560], 20, "#8a8484", 10)
    fb = fuente("mono", 40)
    for i, n in enumerate(["5", "4", "3", "2", "1", "0"]):
        y = by0 + 60 + i * 88
        encendido = n == piso
        d.ellipse([bx0 + 60, y - 32, bx0 + 124, y + 32], fill="#ff5a3a" if encendido else "#d8d0c8", outline=CONTORNO, width=6)
        d.text((bx0 + 92, y), n, font=fb, fill=CONTORNO, anchor="mm")
    brillo(img, W / 2, 0, W * 0.4, "#fff0d0", 90)
    # luz roja de alarma
    if piso == "0":
        capa = Image.new("RGB", img.size, (140, 10, 10))
        img.paste(Image.blend(img, capa, 0.18))


def fondo_oscuro(img, rnd, op):
    W, H = img.size
    img.paste(degradado(W, H, "#0a0406", "#2a0a0c"))
    brillo(img, W / 2, H * 0.95, W * 0.6, "#a01818", 120)


def fondo_nota(img, rnd, op):
    """Una hoja con las reglas escritas, sobre una mesa a oscuras."""
    W, H = img.size
    img.paste(degradado(W, H, "#24120c", "#100806"))
    d = ImageDraw.Draw(img)
    for y in range(0, H, 140):
        d.line([(0, y + rnd.randint(-10, 10)), (W, y + rnd.randint(-10, 10))], fill="#1a0c08", width=6)
    hw, hh = int(W * 0.84), int(H * 0.47)
    hoja = Image.new("RGBA", (hw, hh), (0, 0, 0, 0))
    hd = ImageDraw.Draw(hoja)
    hd.rectangle([0, 0, hw - 1, hh - 1], fill="#efe2c4", outline=CONTORNO, width=10)
    paso, y0 = int(hh * 0.088), int(hh * 0.25)
    for y in range(y0, hh - 30, paso):
        hd.line([(40, y + 14), (hw - 40, y + 14)], fill="#c9b892", width=4)
    hd.line([(110, 30), (110, hh - 30)], fill="#e0a0a0", width=4)
    hd.text((hw / 2, hh * 0.13), op.get("encabezado", "REGLAS"), font=fuente("titulo", int(hw * 0.1)), fill="#5a1414", anchor="mm")
    f = fuente("mono", int(paso * 0.56))
    resaltar = op.get("resaltar")
    y = y0
    for i, linea in enumerate(op.get("lineas", [])):
        color = "#b01818" if resaltar == i + 1 else "#2a1a14"
        for trozo in _envolver(hd, f"{i + 1}. {linea}", f, hw - 170):
            hd.text((130, y), trozo, font=f, fill=color, anchor="ls")
            y += paso
    sombra = Image.new("RGBA", (hw + 80, hh + 80), (0, 0, 0, 0))
    ImageDraw.Draw(sombra).rectangle([40, 50, hw + 40, hh + 50], fill=(0, 0, 0, 160))
    sombra = sombra.filter(ImageFilter.GaussianBlur(30))
    hoja = hoja.rotate(rnd.uniform(-4, 4), expand=True, resample=Image.BICUBIC)
    _pegar(img, sombra, (W - hw) // 2 - 40, int(H * 0.27) - 40)
    _pegar(img, hoja, (W - hoja.width) // 2, int(H * 0.27))
    brillo(img, W * 0.5, H * 0.35, W * 0.45, "#ffb060", 60)


def _envolver(d, texto, f, ancho):
    palabras, lineas, actual = texto.split(), [], ""
    for p in palabras:
        prueba = (actual + " " + p).strip()
        if d.textlength(prueba, font=f) > ancho and actual:
            lineas.append(actual)
            actual = p
        else:
            actual = prueba
    if actual:
        lineas.append(actual)
    return lineas


FONDOS = {
    "calle": fondo_calle,
    "recepcion": fondo_recepcion,
    "pasillo": fondo_pasillo,
    "habitacion": fondo_habitacion,
    "puerta": fondo_puerta,
    "ascensor": fondo_ascensor,
    "oscuro": fondo_oscuro,
    "nota": fondo_nota,
}


def componer_fondo(ancho, alto, escena, semilla=0):
    """Devuelve el escenario (sin personajes) como imagen RGB de ancho x alto."""
    S = 2
    img = Image.new("RGB", (ancho * S, alto * S))
    nombre = escena.get("fondo", "oscuro")
    if nombre not in FONDOS:
        raise ValueError(f"Fondo desconocido: {nombre!r}. Opciones: {', '.join(FONDOS)}")
    FONDOS[nombre](img, random.Random(semilla), escena.get("opciones_fondo", {}))
    return img.reduce(S)
