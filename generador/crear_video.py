#!/usr/bin/env python3
"""Convierte un guion JSON en un vídeo vertical de suspenso (formato TikTok/Reels/Shorts).

Uso:
    python generador/crear_video.py guiones/hotel_medianoche.json
    python generador/crear_video.py guiones/hotel_medianoche.json --previa   # solo una hoja con las escenas
    python generador/crear_video.py guiones/hotel_medianoche.json --rapido   # baja resolución para probar
"""
import argparse
import asyncio
import hashlib
import json
import math
import multiprocessing as mp
import os
import random
import shutil
import tempfile
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).parent))
import sonido  # noqa: E402
from dibujos import componer_fondo, rgb  # noqa: E402
from personajes import PLANOS, dibujar, estado  # noqa: E402
from tipografia import fuente  # noqa: E402

FPS = 30
MARGEN = 1.1          # el fondo se dibuja un 10 % más grande para poder hacer zoom
AMARILLO = (255, 210, 58)
VOZ_POR_DEFECTO = "es-MX-JorgeNeural"


# ------------------------------------------------------------------ texto

def tokens(texto):
    """Separa el texto en palabras y marca las que van entre *asteriscos*."""
    salida, resaltado = [], False
    texto = re.sub(r"^\s*[—-]\s*", "", texto)   # el guion de diálogo no se muestra
    for trozo in re.split(r"(\*)", texto):
        if trozo == "*":
            resaltado = not resaltado
            continue
        for palabra in trozo.split():
            salida.append((palabra, resaltado))
    return salida


def texto_limpio(texto):
    return re.sub(r"\s+", " ", texto.replace("*", "")).strip()


def agrupar(palabras, max_palabras=3, max_letras=18):
    """Agrupa palabras en bloques cortos de subtítulo, cortando en la puntuación."""
    grupos, actual = [], []
    for palabra, res in palabras:
        largo = sum(len(p) + 1 for p, _ in actual) + len(palabra)
        if actual and (len(actual) >= max_palabras or largo > max_letras):
            grupos.append(actual)
            actual = []
        actual.append((palabra, res))
        if re.search(r"[.,:;!?…]$", palabra):
            grupos.append(actual)
            actual = []
    if actual:
        grupos.append(actual)
    return grupos


def imagen_texto(grupo, tam, ancho_max):
    """Renderiza un bloque de subtítulo (palabras resaltadas en amarillo) como RGBA."""
    f = fuente("texto", tam)
    borde = max(3, tam // 9)
    espacio = f.getlength(" ")
    medidas = [f.getlength(p) for p, _ in grupo]
    total = sum(medidas) + espacio * (len(grupo) - 1)
    escala = min(1.0, ancho_max / total) if total else 1.0
    if escala < 1:
        return imagen_texto(grupo, int(tam * escala), ancho_max)
    w, h = int(total + borde * 4), int(tam * 1.5 + borde * 2)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = borde * 2
    for (palabra, res), m in zip(grupo, medidas):
        d.text((x, h / 2), palabra, font=f, anchor="lm", fill=AMARILLO if res else (255, 255, 255),
               stroke_width=borde, stroke_fill=(10, 6, 8))
        x += m + espacio
    return img


def escalar(img, s):
    if abs(s - 1) < 0.01:
        return img
    return img.resize((max(1, int(img.width * s)), max(1, int(img.height * s))), Image.BILINEAR)


def pegar_centrado(lienzo, img, cx, cy, alpha=1.0):
    if alpha < 1:
        a = img.split()[3].point(lambda v: int(v * alpha))
        img = img.copy()
        img.putalpha(a)
    lienzo.paste(img, (int(cx - img.width / 2), int(cy - img.height / 2)), img)


def facil(t):
    t = min(1, max(0, t))
    return t * t * (3 - 2 * t)


def rebote(t):
    """Curva de 'pop': crece un poco de más y vuelve a su tamaño."""
    t = min(1, max(0, t))
    return 1 + 0.25 * math.sin(t * math.pi) * (1 - t)


# ------------------------------------------------------------------ voz

_tts_ok = True


def generar_voz(texto, voz, velocidad, tono, cache):
    """Genera la narración con edge-tts (requiere internet). Devuelve la ruta o None."""
    global _tts_ok
    if not _tts_ok or not texto:
        return None
    clave = hashlib.sha1(f"{texto}|{voz}|{velocidad}|{tono}".encode()).hexdigest()[:16]
    ruta = cache / f"{clave}.mp3"
    if ruta.exists():
        return ruta
    try:
        import edge_tts

        async def correr():
            await edge_tts.Communicate(texto, voz, rate=velocidad, pitch=tono).save(str(ruta))
        asyncio.run(correr())
        return ruta
    except Exception as e:  # sin internet, sin el paquete, etc.
        _tts_ok = False
        print(f"  ! No se pudo generar la voz ({type(e).__name__}). Sigo sin narración.")
        print("    Instala 'pip install edge-tts' y comprueba tu conexión, o usa --sin-voz.")
        if ruta.exists():
            ruta.unlink()
        return None


# ------------------------------------------------------------------ plan

def planificar(guion, base_dir, usar_voz, cache):
    """Calcula duración, audio y subtítulos de cada escena."""
    escenas = []
    voz_def = guion.get("voz", VOZ_POR_DEFECTO)
    vel_def = guion.get("velocidad_voz", "+0%")
    t = 0.0
    for i, esc in enumerate(guion["escenas"]):
        texto = esc.get("texto", "")
        limpio = texto_limpio(texto)
        audio = None
        if esc.get("audio"):
            audio = sonido.leer_audio(base_dir / esc["audio"])
        elif usar_voz and limpio:
            ruta = generar_voz(limpio.lstrip("—- "), esc.get("voz", voz_def), esc.get("velocidad_voz", vel_def),
                               esc.get("tono", "+0Hz"), cache)
            if ruta:
                audio = sonido.leer_audio(ruta)
        palabras = tokens(texto)
        if audio is not None:
            hablado = len(audio) / sonido.SR
        else:
            hablado = len(palabras) / 2.7 + (0.25 if palabras else 0)
        dur = max(esc.get("duracion", 0), hablado + esc.get("pausa", 0.2), 1.0)
        if esc.get("opciones"):
            dur += esc.get("espera", 2.5)
        # tiempos de cada bloque de subtítulo, proporcionales a su longitud
        grupos = agrupar(palabras)
        pesos = [sum(len(p) for p, _ in g) + 3 for g in grupos]
        total = sum(pesos) or 1
        bloques, acum = [], 0.05
        for g, p in zip(grupos, pesos):
            d = hablado * p / total
            bloques.append((acum, acum + d, g))
            acum += d
        if bloques:  # el último bloque se queda en pantalla hasta el final de la escena
            a, _, g = bloques[-1]
            bloques[-1] = (a, dur, g)
        escenas.append(dict(datos=esc, inicio=t, dur=dur, audio=audio, bloques=bloques, indice=i, hablado=hablado))
        t += dur
    return escenas, t


# ------------------------------------------------------------------ vídeo

class Renderizador:
    def __init__(self, guion, W, H):
        self.guion, self.W, self.H = guion, W, H
        self.reparto = guion.get("reparto", {})
        self.cache_txt = {}
        self.ruido = [np.random.default_rng(k).integers(-6, 7, (H // 2, W // 2, 1), dtype=np.int16) for k in range(4)]
        # viñeta: oscurece los bordes del cuadro
        yy, xx = np.mgrid[0:H, 0:W]
        r = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
        self.vineta = (1 - 0.8 * np.clip((r - 0.55) / 0.6, 0, 1) ** 1.4)[..., None].astype(np.float32)

    def fondo(self, esc):
        bw, bh = int(self.W * MARGEN), int(self.H * MARGEN)
        return componer_fondo(bw, bh, esc["datos"], semilla=esc["indice"] * 7 + 3)

    def _personajes(self, img, esc, t, caja, bw, bh):
        """Dibuja a cada personaje con su pose del instante t, ya en coordenadas de pantalla."""
        datos = esc["datos"]
        x0, y0, vw = caja
        k = self.W / vw
        alto_p, base_p = PLANOS[datos.get("plano", "general")]
        for j, p in enumerate(datos.get("personajes", [])):
            quien = p["quien"]
            if quien not in self.reparto:
                raise ValueError(f"El personaje {quien!r} no está en el reparto")
            e = estado(p, t, esc["dur"], esc["hablado"], semilla=esc["indice"] * 31 + j * 7)
            a_b = bh * alto_p * p.get("tam", 1.0) * e["escala"]
            base_b = bh * base_p - (bh * alto_p - a_b) * 0.15 - p.get("subir", 0) * bh + e["bob"] * a_b
            cx_b = bw * e["x"] + e["dx"] * a_b
            u = a_b * k
            cx, base = (cx_b - x0) * k, (base_b - y0) * k
            bx0, bx1 = max(0, int(cx - 0.55 * u)), min(self.W, int(cx + 0.55 * u) + 1)
            by0, by1 = max(0, int(base - 1.22 * u)), min(self.H, int(base + 0.06 * u) + 1)
            if bx1 <= bx0 or by1 <= by0:
                continue
            S = 2
            capa = Image.new("RGBA", ((bx1 - bx0) * S, (by1 - by0) * S), (0, 0, 0, 0))
            dibujar(ImageDraw.Draw(capa), (cx - bx0) * S, (base - by0) * S, u * S, self.reparto[quien], e)
            capa = capa.reduce(S)
            if e["alpha"] < 1:
                capa.putalpha(capa.split()[3].point(lambda v, a=e["alpha"]: int(v * a)))
            img.paste(capa, (bx0, by0), capa)

    def txt(self, clave, fabricar):
        if clave not in self.cache_txt:
            self.cache_txt[clave] = fabricar()
        return self.cache_txt[clave]

    def cuadro(self, esc, base, t, n_cuadro):
        W, H = self.W, self.H
        datos = esc["datos"]
        dur = esc["dur"]
        p = t / dur
        bw, bh = base.size

        # movimiento de cámara
        mov = datos.get("camara", "in" if esc["indice"] % 2 == 0 else "out")
        if mov == "in":
            z, dx = 1 + 0.09 * facil(p), 0
        elif mov == "out":
            z, dx = 1.09 - 0.09 * facil(p), 0
        elif mov in ("izquierda", "derecha"):
            z, dx = 1.06, (bw * 0.03) * (facil(p) * 2 - 1) * (1 if mov == "derecha" else -1)
        else:
            z, dx = 1.03, 0
        dy = 0
        efectos = datos.get("efectos", [])
        if "sacudida" in efectos or "toc3" in datos.get("sonidos", []):
            amp = 0
            if "sacudida" in efectos:
                amp = max(amp, max(0, 1 - t / 0.7))
            if "toc3" in datos.get("sonidos", []):
                for k in range(3):
                    dt = t - (0.05 + 0.42 * k)
                    if 0 <= dt < 0.2:
                        amp = max(amp, 1 - dt / 0.2)
            rnd = random.Random(n_cuadro)
            dx += rnd.uniform(-1, 1) * W * 0.02 * amp
            dy += rnd.uniform(-1, 1) * W * 0.02 * amp
        vw, vh = bw / z, bh / z
        cx = min(max(bw / 2 + dx, vw / 2), bw - vw / 2)
        cy = min(max(bh / 2 + dy, vh / 2), bh - vh / 2)
        img = base.resize((W, H), Image.BILINEAR, box=(cx - vw / 2, cy - vh / 2, cx + vw / 2, cy + vh / 2))
        self._personajes(img, esc, t, (cx - vw / 2, cy - vh / 2, vw), bw, bh)

        # viñeta y tinte de color
        a = np.asarray(img).astype(np.float32) * self.vineta
        if datos.get("tinte"):
            a = a * 0.8 + np.array(rgb(datos["tinte"]), dtype=np.float32) * 0.2
        img = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

        # parpadeo de luz
        if "parpadeo" in efectos:
            r = random.Random(n_cuadro // 2).random()
            if r < 0.18:
                img = Image.eval(img, lambda v: int(v * 0.35))

        # destello al empezar la escena
        if "destello" in efectos and t < 0.25:
            img = Image.blend(img, Image.new("RGB", img.size, (255, 240, 230)), 0.8 * (1 - t / 0.25))

        img = img.convert("RGBA")
        self._rotulo(img, datos.get("rotulo"), t)
        self._titulo(img, datos.get("titulo"), t)
        self._opciones(img, datos.get("opciones"), t, dur)
        self._subtitulos(img, esc, t)
        return self._grano(img.convert("RGB"), n_cuadro)

    def _rotulo(self, img, texto, t):
        if not texto:
            return
        W = self.W
        visibles = int(len(texto) * min(1, t / 0.7))   # efecto máquina de escribir
        f = fuente("mono", W * 0.038)
        d = ImageDraw.Draw(img)
        x, y = W * 0.06, self.H * 0.055
        caja = d.textbbox((x, y), texto, font=f, anchor="lm")
        pad = W * 0.022
        d.rounded_rectangle([caja[0] - pad, caja[1] - pad * 0.8, caja[2] + pad, caja[3] + pad * 0.8],
                            radius=pad * 0.6, fill=(14, 6, 10, 215), outline=(190, 40, 50, 255), width=max(2, W // 360))
        d.text((x, y), texto[:visibles], font=f, anchor="lm", fill=(240, 220, 210))
        if visibles < len(texto) or int(t * 2) % 2 == 0:
            cx = x + d.textlength(texto[:visibles], font=f) + 4
            d.rectangle([cx, y - W * 0.016, cx + W * 0.012, y + W * 0.016], fill=(240, 60, 60))

    def _titulo(self, img, texto, t):
        if not texto:
            return
        W = self.W

        def fabricar():
            f = fuente("titulo", W * 0.105)
            borde = W // 90
            caja = f.getbbox(texto)
            tw, th = caja[2] - caja[0], caja[3] - caja[1]
            im = Image.new("RGBA", (int(tw + borde * 8), int(th + W * 0.08)), (0, 0, 0, 0))
            d = ImageDraw.Draw(im)
            d.text((im.width / 2 + borde, th / 2 + borde * 3), texto, font=f, anchor="mm", fill=(150, 10, 20))
            d.text((im.width / 2, th / 2 + borde * 2), texto, font=f, anchor="mm", fill=(255, 245, 235),
                   stroke_width=borde, stroke_fill=(15, 5, 8))
            ly = th + borde * 4.5
            d.rectangle([im.width * 0.2, ly, im.width * 0.8, ly + borde * 1.3], fill=(210, 30, 40))
            return im
        im = self.txt(("titulo", texto), fabricar)
        s = rebote(t / 0.3) if t < 0.3 else 1.0
        pegar_centrado(img, escalar(im, s), W / 2, self.H * 0.17, min(1, t / 0.08))

    def _opciones(self, img, opciones, t, dur):
        if not opciones:
            return
        W, H = self.W, self.H
        colores = [(200, 30, 50), (40, 90, 210)]
        imgs = []
        for i, op in enumerate(opciones[:2]):
            def fabricar(op=op, c=colores[i]):
                f = fuente("titulo", W * 0.062)
                tw = f.getlength(op)
                im = Image.new("RGBA", (int(tw + W * 0.12), int(W * 0.13)), (0, 0, 0, 0))
                d = ImageDraw.Draw(im)
                d.rounded_rectangle([4, 4, im.width - 4, im.height - 4], radius=im.height / 2, fill=c,
                                    outline=(255, 255, 255), width=max(3, W // 200))
                d.text((im.width / 2, im.height / 2), op, font=f, anchor="mm", fill=(255, 255, 255))
                return im
            imgs.append(self.txt(("op", op, i), fabricar))
        sep = W * 0.11
        total = sum(i.width for i in imgs) + sep * (len(imgs) - 1)
        x = (W - total) / 2
        y = H * 0.17
        medio = x + imgs[0].width + sep / 2
        for i, im in enumerate(imgs):
            t0 = 0.15 + i * 0.25
            if t < t0:
                x += im.width + sep
                continue
            s = rebote((t - t0) / 0.3)
            if t > dur - 2.5:                    # latido mientras esperamos la respuesta
                s *= 1 + 0.04 * math.sin((t - t0) * 2 * math.pi * 1.6)
            pegar_centrado(img, escalar(im, s), x + im.width / 2, y)
            x += im.width + sep
        if len(imgs) == 2 and t > 0.4:
            d = ImageDraw.Draw(img)
            d.text((medio, y), "o", font=fuente("texto", W * 0.05), anchor="mm", fill=(255, 255, 255),
                   stroke_width=W // 200, stroke_fill=(10, 5, 8))

    def _subtitulos(self, img, esc, t):
        for a, b, grupo in esc["bloques"]:
            if a <= t < b:
                clave = ("sub", tuple(grupo))
                im = self.txt(clave, lambda g=grupo: imagen_texto(g, int(self.W * 0.075), self.W * 0.88))
                s = 0.85 + 0.15 * facil((t - a) / 0.09)
                pegar_centrado(img, escalar(im, s), self.W / 2, self.H * 0.76)
                break

    def _grano(self, img, n):
        a = np.asarray(img).astype(np.int16)
        r = self.ruido[n % 4]
        r = np.repeat(np.repeat(r, 2, axis=0), 2, axis=1)[: a.shape[0], : a.shape[1]]
        return np.clip(a + r, 0, 255).astype(np.uint8)


def mezclar_audio(guion, escenas, total, base_dir):
    n = int(total * sonido.SR) + sonido.SR
    pista = np.zeros(n)
    voz = np.zeros(n)
    for esc in escenas:
        ini = int((esc["inicio"] + 0.05) * sonido.SR)
        if esc["audio"] is not None:
            a = esc["audio"][: n - ini]
            voz[ini:ini + len(a)] += a
        datos = esc["datos"]
        sonidos = list(datos.get("sonidos", []))
        if datos.get("titulo") and "impacto" not in sonidos:
            sonidos.append("impacto")
        for nombre in sonidos:
            if nombre not in sonido.EFECTOS:
                raise ValueError(f"Sonido desconocido: {nombre!r}. Opciones: {', '.join(sonido.EFECTOS)}")
            fabricar, vol = sonido.EFECTOS[nombre]
            x = fabricar() * vol
            s0 = int(esc["inicio"] * sonido.SR)
            pista[s0:s0 + len(x)] += x[: n - s0]
    amb = np.zeros(n)
    a = sonido.ambiente(n / sonido.SR)[:n]
    amb[:len(a)] = a
    pista += amb * guion.get("volumen_ambiente", 0.22)
    if guion.get("musica"):
        m = sonido.leer_audio(base_dir / guion["musica"])
        m = np.tile(m, int(np.ceil(n / len(m))))[:n]
        pista += m * guion.get("volumen_musica", 0.25)
    # baja el fondo cuando habla el narrador
    if np.any(voz):
        env = np.convolve(np.abs(voz), np.ones(4410) / 4410, mode="same")
        pista *= 1 - 0.45 * np.clip(env * 12, 0, 1)
    mezcla = voz * 0.95 + pista
    return mezcla / max(1.0, np.max(np.abs(mezcla)) / 0.89)


def escribir_srt(escenas, ruta):
    def ts(s):
        ms = int(round(s * 1000))
        return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
    lineas, k = [], 1
    for esc in escenas:
        texto = texto_limpio(esc["datos"].get("texto", ""))
        if texto:
            ini = esc["inicio"]
            lineas += [str(k), f"{ts(ini)} --> {ts(ini + esc['dur'])}", texto, ""]
            k += 1
    ruta.write_text("\n".join(lineas), encoding="utf-8")


def _render_escena(trabajo):
    guion, W, H, esc, n0, cuadros, destino = trabajo
    rend = Renderizador(guion, W, H)
    base = rend.fondo(esc)
    ff = subprocess.Popen([
        "ffmpeg", "-v", "error", "-y",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
        "-c:v", "libx264", "-preset", "medium", "-crf", "23", "-pix_fmt", "yuv420p", destino,
    ], stdin=subprocess.PIPE)
    for k in range(cuadros):
        ff.stdin.write(rend.cuadro(esc, base, k / FPS, n0 + k).tobytes())
    ff.stdin.close()
    if ff.wait() != 0:
        raise RuntimeError(f"ffmpeg falló en la escena {esc['indice'] + 1}")
    return esc["indice"]


def main():
    ap = argparse.ArgumentParser(description="Genera un vídeo vertical de suspenso desde un guion JSON.")
    ap.add_argument("guion", type=Path)
    ap.add_argument("-o", "--salida", type=Path, help="archivo .mp4 de salida (por defecto, en salida/)")
    ap.add_argument("--rapido", action="store_true", help="540x960, para pruebas rápidas")
    ap.add_argument("--sin-voz", action="store_true", help="no generar narración automática")
    ap.add_argument("--previa", action="store_true", help="solo genera una imagen con todas las escenas")
    ap.add_argument("--procesos", type=int, help="núcleos a usar (por defecto, todos)")
    args = ap.parse_args()

    guion = json.loads(args.guion.read_text(encoding="utf-8"))
    base_dir = args.guion.parent
    raiz = Path(__file__).resolve().parent.parent
    carpeta = raiz / "salida"
    carpeta.mkdir(exist_ok=True)
    cache = raiz / ".cache" / "voz"
    cache.mkdir(parents=True, exist_ok=True)
    nombre = args.guion.stem
    W, H = (540, 960) if args.rapido else (1080, 1920)
    if args.previa:
        escenas, _ = planificar(guion, base_dir, False, cache)
        cols = 6
        mw, mh = 270, 480
        filas = math.ceil(len(escenas) / cols)
        hoja = Image.new("RGB", (cols * mw, filas * mh), (0, 0, 0))
        r2 = Renderizador(guion, mw * 2, mh * 2)
        for esc in escenas:
            t = max((esc["bloques"][0][0] + 0.2) if esc["bloques"] else 0.5, min(esc["dur"] * 0.6, esc["dur"] - 0.1))
            cuadro = Image.fromarray(r2.cuadro(esc, r2.fondo(esc), t, 0)).resize((mw, mh), Image.LANCZOS)
            d = ImageDraw.Draw(cuadro)
            d.text((10, 10), str(esc["indice"] + 1), font=fuente("titulo", 30), fill=(255, 255, 0),
                   stroke_width=3, stroke_fill=(0, 0, 0))
            hoja.paste(cuadro, ((esc["indice"] % cols) * mw, (esc["indice"] // cols) * mh))
        destino = carpeta / f"{nombre}_previa.jpg"
        hoja.save(destino, quality=88)
        print(f"Vista previa: {destino}")
        return

    print(f"Guion: {guion.get('titulo', nombre)}  ({len(guion['escenas'])} escenas)")
    escenas, total = planificar(guion, base_dir, not args.sin_voz, cache)
    print(f"Duración: {total:.1f} s")

    wav = carpeta / f"{nombre}_audio.wav"
    sonido.guardar_wav(wav, mezclar_audio(guion, escenas, total, base_dir))
    salida = args.salida or carpeta / f"{nombre}.mp4"
    escribir_srt(escenas, salida.with_suffix(".srt"))

    # cada escena se renderiza en paralelo como un trozo de vídeo y luego se unen
    tmp = Path(tempfile.mkdtemp(prefix="suspenso_"))
    trabajos = []
    for esc in escenas:
        ligera = {k: v for k, v in esc.items() if k != "audio"}
        n0 = round(esc["inicio"] * FPS)
        cuadros = round((esc["inicio"] + esc["dur"]) * FPS) - n0
        trabajos.append((guion, W, H, ligera, n0, cuadros, str(tmp / f"{esc['indice']:03d}.mp4")))
    procesos = args.procesos or max(1, (os.cpu_count() or 2))
    try:
        with mp.Pool(procesos) as pool:
            for k, i in enumerate(pool.imap_unordered(_render_escena, trabajos), 1):
                print(f"  escena {i + 1:>2} lista  ({k}/{len(escenas)})", flush=True)
        lista = tmp / "lista.txt"
        lista.write_text("".join(f"file '{t[-1]}'\n" for t in trabajos))
        r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(lista),
                            "-i", str(wav), "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest",
                            "-movflags", "+faststart", str(salida)])
        if r.returncode != 0:
            sys.exit("ffmpeg falló al unir el vídeo")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    wav.unlink()
    print(f"Listo: {salida}")


if __name__ == "__main__":
    main()
