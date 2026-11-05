"""Personajes cartoon animados: se redibujan en cada cuadro con su pose del momento.

`estado()` calcula la pose (respiración, parpadeo, boca al hablar, caminar…) para el
instante t, y `dibujar()` pinta al personaje con esa pose.
"""
import math
import random

from dibujos import CONTORNO, oscurecer, rect_redondo, rgb

PIEL = "#eab48c"


# ------------------------------------------------------------------ animación

def _lerp(a, b, t):
    return a + (b - a) * t


def _facil(t):
    t = min(1.0, max(0.0, t))
    return t * t * (3 - 2 * t)


def estado(p, t, dur, habla_hasta, semilla):
    """Pose del personaje `p` (dict del guion) en el segundo `t` de una escena de `dur` s."""
    rnd = random.Random(semilla)
    fase = rnd.random() * 10
    prog = t / dur if dur else 0
    exp = p.get("expresion", "neutral")
    e = dict(expresion=exp, mirar=p.get("mirar", 0.0), ojos_cerrados=bool(p.get("ojos_cerrados")),
             boca=0.0, brazos=[0.12, 0.12], piernas=[0.0, 0.0], cabeza_dx=0.0, cabeza_dy=0.0,
             lagrima=None, bob=0.0, dx=0.0, x=p.get("x", 0.5), escala=1.0, alpha=1.0)

    # respiración y balanceo suave: nadie está nunca del todo quieto
    e["bob"] = math.sin((t + fase) * 2 * math.pi * 0.45) * 0.006
    e["cabeza_dx"] = math.sin((t + fase) * 2 * math.pi * 0.23) * 0.008
    e["brazos"] = [0.12 + 0.03 * math.sin((t + fase) * 2.8), 0.12 + 0.03 * math.sin((t + fase) * 2.8 + 1)]

    if "mirar_fin" in p:
        e["mirar"] = _lerp(p.get("mirar", 0.0), p["mirar_fin"], _facil(prog * 1.6 - 0.3))

    # parpadeo cada 2.5–4.5 s
    periodo = 2.5 + rnd.random() * 2
    if exp not in ("vacio",) and (t + fase) % periodo < 0.13:
        e["ojos_cerrados"] = True

    # boca al hablar
    if p.get("habla") and 0.05 < t < habla_hasta:
        v = math.sin((t + fase) * 2 * math.pi * 5.1) * (0.65 + 0.35 * math.sin((t + fase) * 2 * math.pi * 1.3))
        e["boca"] = max(0.0, v)
        e["cabeza_dy"] += 0.005 * math.sin((t + fase) * 2 * math.pi * 2.4)

    acciones = p.get("accion", [])
    if isinstance(acciones, str):
        acciones = [acciones]
    for a in acciones:
        if a in ("caminar", "correr"):
            corre = a == "correr"
            frec = 3.2 if corre else 1.9
            s = math.sin(2 * math.pi * t * frec)
            amp = 0.6 if corre else 0.35
            e["piernas"] = [max(0, s) * amp, max(0, -s) * amp]
            base_b = 0.45 if corre else 0.12
            giro = 0.75 if corre else 0.35
            e["brazos"] = [base_b + s * giro, base_b - s * giro]
            e["bob"] -= abs(s) * (0.035 if corre else 0.016)
            x0, x1 = p.get("x", 0.5), p.get("x_fin", p.get("x", 0.5))
            e["x"] = _lerp(x0, x1, prog)
            if "mirar" not in p and x1 != x0:
                e["mirar"] = 0.7 if x1 > x0 else -0.7
        elif a == "temblar":
            r = random.Random(int(t * 30) + semilla)
            e["dx"] += r.uniform(-1, 1) * 0.005
            e["cabeza_dx"] += r.uniform(-1, 1) * 0.006
        elif a == "susto":
            k = t / 0.45
            if k < 1:
                e["bob"] -= 0.09 * math.sin(math.pi * k)
            arriba = 2.5 * (1 - _facil((t - 0.6) / 0.6))
            e["brazos"] = [max(e["brazos"][0], arriba), max(e["brazos"][1], arriba)]
        elif a == "brazos_arriba":
            e["brazos"] = [2.6 + 0.08 * math.sin(t * 9), 2.6 + 0.08 * math.sin(t * 9 + 1)]
        elif a == "senalar":
            e["brazos"][1] = 1.75 + 0.05 * math.sin(t * 3)
        elif a == "asentir":
            e["cabeza_dy"] += 0.014 * math.sin(t * 2 * math.pi * 1.8)
        elif a == "negar":
            e["cabeza_dx"] += 0.02 * math.sin(t * 2 * math.pi * 2.0)
        elif a == "llorar":
            e["lagrima"] = (t * 0.8 + fase) % 1
        elif a == "acercarse":
            e["escala"] = _lerp(1.0, p.get("tam_fin", 1.3), _facil(prog))
        elif a == "aparecer":
            e["alpha"] = min(1.0, t / 1.2)
    return e


# ------------------------------------------------------------------ dibujo

def _miembro(d, p0, p1, grosor, color, lw):
    """Brazo o pierna: trazo grueso con extremos redondos y contorno."""
    for ancho, c in ((grosor + 2 * lw, CONTORNO), (grosor, color)):
        d.line([p0, p1], fill=c, width=int(ancho))
        r = ancho / 2
        for x, y in (p0, p1):
            d.ellipse([x - r, y - r, x + r, y + r], fill=c)


def dibujar(d, cx, base, u, spec, e):
    """Dibuja un personaje de frente. `base` = línea de los pies, `u` = altura total."""
    sombra = spec.get("sombra", False)
    piel = rgb("#140c10" if sombra else spec.get("piel", PIEL))
    ropa = rgb("#0e080a" if sombra else spec.get("ropa", "#3b4a6b"))
    pantalon = rgb("#0a0608" if sombra else spec.get("pantalon", "#28243a"))
    pelo = rgb("#0a0608" if sombra else spec.get("color_pelo", "#2a1c16"))
    lw = max(3, int(u * 0.012))

    # sombra en el suelo
    d.ellipse([cx - 0.2 * u, base - 0.02 * u, cx + 0.2 * u, base + 0.025 * u], fill=(0, 0, 0, 90))

    # piernas: en vista frontal, "caminar" levanta un pie y luego el otro
    for i, s in enumerate((-1, 1)):
        x = cx + s * 0.065 * u
        levanta = e["piernas"][i]
        pie_y = base - 0.03 * u - levanta * 0.09 * u
        _miembro(d, (x, base - 0.23 * u), (x, pie_y), 0.095 * u, pantalon, lw)
        d.ellipse([x - 0.07 * u + s * 0.01 * u, pie_y - 0.025 * u, x + 0.07 * u + s * 0.01 * u, pie_y + 0.03 * u],
                  fill=oscurecer(pantalon, 0.5), outline=CONTORNO, width=lw)

    # brazos (detrás del torso); ángulo desde la vertical, positivo hacia fuera
    largo = 0.27 * u
    manos = []
    for i, s in enumerate((-1, 1)):
        a = e["brazos"][i]
        hombro = (cx + s * 0.13 * u, base - 0.52 * u)
        mano = (hombro[0] + s * math.sin(a) * largo, hombro[1] + math.cos(a) * largo)
        _miembro(d, hombro, mano, 0.085 * u, oscurecer(ropa, 0.15), lw)
        manos.append(mano)

    # torso
    rect_redondo(d, [cx - 0.17 * u, base - 0.57 * u, cx + 0.17 * u, base - 0.2 * u], 0.07 * u, ropa, lw)
    detalle = spec.get("detalle")
    if detalle == "chaleco":
        for y in (0.42, 0.33):
            d.rectangle([cx - 0.165 * u, base - y * u, cx + 0.165 * u, base - (y - 0.025) * u], fill="#e8e040")
    elif detalle == "corbata":
        d.polygon([(cx, base - 0.56 * u), (cx - 0.03 * u, base - 0.5 * u), (cx, base - 0.32 * u),
                   (cx + 0.03 * u, base - 0.5 * u)], fill="#8a1a1a", outline=CONTORNO)
    else:
        d.line([(cx, base - 0.55 * u), (cx, base - 0.22 * u)], fill=oscurecer(ropa, 0.35), width=lw)
        d.rectangle([cx - 0.09 * u, base - 0.36 * u, cx + 0.09 * u, base - 0.28 * u], outline=oscurecer(ropa, 0.35), width=lw)

    # manos delante del cuerpo
    for x, y in manos:
        r = 0.045 * u
        d.ellipse([x - r, y - r, x + r, y + r], fill=piel, outline=CONTORNO, width=lw)

    # cabeza
    hr = 0.235 * u
    hx = cx + e["cabeza_dx"] * u
    hy = base - 0.57 * u - hr * 0.82 + e["cabeza_dy"] * u
    tipo = spec.get("pelo", "corto")
    if tipo == "largo":
        d.rounded_rectangle([hx - hr * 1.08, hy - hr * 0.6, hx + hr * 1.08, hy + hr * 1.25], radius=hr * 0.5,
                            fill=pelo, outline=CONTORNO, width=lw)
    for s in (-1, 1):  # orejas
        d.ellipse([hx + s * hr * 0.98 - hr * 0.16, hy - hr * 0.08, hx + s * hr * 0.98 + hr * 0.16, hy + hr * 0.28],
                  fill=piel, outline=CONTORNO, width=lw)
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=piel, outline=CONTORNO, width=lw)
    _pelo(d, hx, hy, hr, tipo, pelo, lw)
    _cara(d, hx, hy, hr, e, lw, sombra, spec, piel)


def _pelo(d, cx, hy, hr, tipo, color, lw):
    if tipo == "calvo":
        for s in (-1, 1):
            d.chord([cx + s * hr * 0.9 - hr * 0.22, hy - hr * 0.35, cx + s * hr * 0.9 + hr * 0.22, hy + hr * 0.2],
                    90 if s < 0 else 270, 270 if s < 0 else 90, fill=color)
        return
    if tipo == "gorra":
        d.chord([cx - hr * 1.02, hy - hr * 1.1, cx + hr * 1.02, hy + hr * 0.5], 180, 360, fill=color, outline=CONTORNO, width=lw)
        d.rounded_rectangle([cx - hr * 1.2, hy - hr * 0.36, cx + hr * 0.4, hy - hr * 0.2], radius=hr * 0.08,
                            fill=oscurecer(color, 0.3), outline=CONTORNO, width=lw)
        return
    d.chord([cx - hr * 1.03, hy - hr * 1.06, cx + hr * 1.03, hy + hr * 0.45], 180, 360, fill=color, outline=CONTORNO, width=lw)
    pts = []
    n = 6
    for i in range(n + 1):
        t = i / n
        x = cx - hr * 0.98 + t * hr * 1.96
        y = hy - hr * 0.22 + (0.0 if i % 2 == 0 else -hr * 0.22) - math.sin(t * math.pi) * hr * 0.12
        pts.append((x, y))
    pts += [(cx + hr * 0.98, hy - hr * 0.6), (cx - hr * 0.98, hy - hr * 0.6)]
    d.polygon(pts, fill=color)
    if tipo == "corto":
        for i in range(5):
            a0 = math.radians(205 + i * 26)
            a1 = a0 + math.radians(26)
            am = (a0 + a1) / 2
            b0 = (cx + math.cos(a0) * hr * 0.92, hy + math.sin(a0) * hr * 0.92)
            b1 = (cx + math.cos(a1) * hr * 0.92, hy + math.sin(a1) * hr * 0.92)
            punta = (cx + math.cos(am + 0.12) * hr * 1.2, hy + math.sin(am + 0.12) * hr * 1.2)
            d.polygon([b0, punta, b1], fill=color)
            d.line([b0, punta, b1], fill=CONTORNO, width=lw, joint="curve")
    if tipo == "mono":
        d.ellipse([cx - hr * 0.35, hy - hr * 1.45, cx + hr * 0.35, hy - hr * 0.8], fill=color, outline=CONTORNO, width=lw)


def _cara(d, cx, hy, hr, e, lw, sombra, spec, piel):
    exp = e["expresion"]
    ex, ey, er = hr * 0.36, hy + hr * 0.02, hr * 0.24
    pupila = er * (0.25 if exp in ("miedo", "grito", "sonrisa_rara") else 0.42)
    dy_p = -er * 0.15 if exp in ("miedo", "grito") else 0
    for s in (-1, 1):
        x = cx + s * ex
        if e["ojos_cerrados"]:
            d.arc([x - er, ey - er * 0.6, x + er, ey + er * 0.6], 10, 170, fill=CONTORNO, width=int(lw * 1.3))
            continue
        d.ellipse([x - er, ey - er * 1.1, x + er, ey + er * 1.1], fill="#fff6e8", outline=CONTORNO, width=lw)
        if exp != "vacio" and not sombra:
            px = x + e["mirar"] * er * 0.45
            d.ellipse([px - pupila, ey + dy_p - pupila, px + pupila, ey + dy_p + pupila], fill=CONTORNO)
            d.ellipse([px + pupila * 0.15, ey + dy_p - pupila * 0.65, px + pupila * 0.45, ey + dy_p - pupila * 0.1],
                      fill="#ffffff")
        if exp in ("sospecha", "cansado"):
            d.chord([x - er - lw, ey - er * 1.2, x + er + lw, ey + er * (0.1 if exp == "sospecha" else 0.3)], 180, 360,
                    fill=piel, outline=CONTORNO, width=lw)
    if spec.get("lentes"):
        for s in (-1, 1):
            x = cx + s * ex
            d.ellipse([x - er * 1.35, ey - er * 1.35, x + er * 1.35, ey + er * 1.35], outline=CONTORNO, width=lw)
        d.line([(cx - ex + er * 1.35, ey), (cx + ex - er * 1.35, ey)], fill=CONTORNO, width=lw)

    # lágrimas
    if e["lagrima"] is not None and not sombra:
        for s in (-1, 1):
            f = (e["lagrima"] + (0.5 if s > 0 else 0)) % 1
            tx, ty, r = cx + s * ex + s * er * 0.3, ey + er * 1.0 + f * hr * 0.6, hr * 0.07
            d.ellipse([tx - r, ty - r * 1.5, tx + r, ty + r * 1.2], fill="#8fd0f0", outline=CONTORNO, width=max(2, lw // 2))

    # cejas
    by = ey - er * 1.55
    ancho = er * 0.9
    for s in (-1, 1):
        x = cx + s * ex
        if exp in ("miedo", "grito", "triste"):
            p = [(x + s * ancho, by + er * 0.45), (x - s * ancho, by - er * 0.05)]
        elif exp in ("enojado", "sonrisa_rara"):
            p = [(x + s * ancho, by - er * 0.15), (x - s * ancho, by + er * 0.4)]
        elif exp == "feliz":
            p = [(x - ancho, by + er * 0.1), (x, by - er * 0.2), (x + ancho, by + er * 0.1)]
        else:
            p = [(x - ancho, by + er * 0.12), (x + ancho, by + er * 0.12)]
        d.line(p, fill=CONTORNO if not sombra else "#000", width=int(lw * 1.6), joint="curve")

    # boca
    my = hy + hr * 0.58
    mw = hr * 0.28
    oscuro = "#3a0c12"
    if e["boca"] > 0.12 and exp not in ("grito", "sonrisa_rara"):
        alto = mw * (0.25 + 0.75 * e["boca"])
        d.ellipse([cx - mw * 0.6, my - alto * 0.5, cx + mw * 0.6, my + alto * 0.7], fill=oscuro, outline=CONTORNO, width=lw)
        if e["boca"] > 0.5:
            d.chord([cx - mw * 0.35, my, cx + mw * 0.35, my + alto * 0.65], 180, 360, fill="#d04a5a")
    elif exp == "feliz":
        d.chord([cx - mw, my - mw * 0.9, cx + mw, my + mw * 0.7], 0, 180, fill=oscuro, outline=CONTORNO, width=lw)
    elif exp == "grito":
        d.ellipse([cx - mw * 0.8, my - mw * 0.7, cx + mw * 0.8, my + mw * 1.1], fill=oscuro, outline=CONTORNO, width=lw)
        d.chord([cx - mw * 0.5, my + mw * 0.3, cx + mw * 0.5, my + mw * 1.05], 180, 360, fill="#d04a5a")
    elif exp == "miedo":
        pts = [(cx - mw * 0.8 + i * mw * 0.32, my + (mw * 0.12 if i % 2 else -mw * 0.12)) for i in range(6)]
        d.line(pts, fill=CONTORNO, width=lw, joint="curve")
        gx, gy = cx + hr * 0.82, hy - hr * 0.4    # gota de sudor
        d.polygon([(gx, gy - hr * 0.2), (gx - hr * 0.09, gy), (gx + hr * 0.09, gy)], fill="#9fd8ff")
        d.ellipse([gx - hr * 0.09, gy - hr * 0.08, gx + hr * 0.09, gy + hr * 0.1], fill="#9fd8ff", outline=CONTORNO,
                  width=max(2, lw // 2))
    elif exp == "triste":
        d.arc([cx - mw * 0.8, my, cx + mw * 0.8, my + mw], 200, 340, fill=CONTORNO, width=lw)
    elif exp == "sonrisa_rara":
        d.chord([cx - mw * 1.9, my - mw * 1.0, cx + mw * 1.9, my + mw * 0.9], 0, 180, fill="#fff6e8", outline=CONTORNO, width=lw)
        for i in range(1, 8):
            x = cx - mw * 1.9 + i * mw * 3.8 / 8
            d.line([(x, my - mw * 0.05), (x, my + mw * 0.75)], fill=CONTORNO, width=max(2, lw // 2))
    elif exp == "vacio":
        d.line([(cx - mw * 0.5, my), (cx + mw * 0.5, my)], fill="#000", width=lw)
    elif exp == "silencio":
        d.ellipse([cx - mw * 0.25, my - mw * 0.2, cx + mw * 0.25, my + mw * 0.25], fill=oscuro, outline=CONTORNO, width=lw)
        d.rounded_rectangle([cx - mw * 0.22, my - mw * 1.0, cx + mw * 0.22, my + mw * 1.6], radius=mw * 0.2,
                            fill=piel, outline=CONTORNO, width=lw)
    else:
        d.line([(cx - mw * 0.55, my), (cx + mw * 0.55, my)], fill=CONTORNO, width=lw)


PLANOS = {
    # altura del personaje y línea de pies, como fracción del alto del fondo
    "general": (0.42, 0.84),
    "medio": (0.95, 1.13),
    "primer_plano": (1.35, 1.46),
}
