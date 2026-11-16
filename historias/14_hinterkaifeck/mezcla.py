"""Mezcla de «Hinterkaifeck»: voz + efectos cortos, sincronizados con palabras.json.

REGLA DEL USUARIO (guía §5): efectos cortos, solo en su momento; nada de ambientes ni bucles que suenen casi todo el
video (en «La taquería» el comal sonaba a fuga de gas y la calle a viento). Aquí no hay ningún sonido de fondo: los
únicos bucles son el dron y los latidos de los últimos ~20 s.
Efectos grabados con ElevenLabs (herramientas/sfx_elevenlabs.py, pedidos en sfx/pedidos.json). Nada bajo 100 Hz;
−14 LUFS. Nivel de los efectos: el mismo de «La taquería» (ganancia medida allá: 3.79 con voz de RMS 0.2077).
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[1] / "generador"))
import sonido  # noqa: E402

SR = sonido.SR
FPS = 30
P = json.load(open(AQUI / "voz" / "palabras.json"))
CUADROS = int(np.ceil(97.7 * FPS))  # = HINTER_CUADROS del video (2931)
DUR = CUADROS / FPS
N = int(DUR * SR)
rng = np.random.default_rng(49)


def t(i):
    return P[i]["ini"]


def fw(i):
    return round(P[i]["ini"] * FPS) / FPS  # el cuadro exacto del video, en segundos


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def norm(x, pico=1.0):
    m = np.max(np.abs(x)) or 1.0
    return x / m * pico


def pasa(x, bajo=None, alto=None):
    return sonido._filtro(x, bajo, alto)


def env(dur, a=0.05, r=0.1):
    x = tt(dur)
    return np.clip(np.minimum(x / a, (dur - x) / r), 0, 1)


def rampa(x0, x1, ini, fin):
    """0 antes de ini, sube a 1 en fin (o baja si x0 > x1) — sobre todo el largo del video"""
    x = tt(DUR)[:N]
    return np.clip((x - ini) / max(1e-6, fin - ini), 0, 1) * (x1 - x0) + x0


# ------------------------------------------------------------------ efectos (grabados con ElevenLabs, carpeta sfx/)
# Antes eran sintetizados y sonaban falsos (la rueda «silbaba» y los clics de cadena sonaban a palomitas).
SFX = AQUI / "sfx"


def sfx(nombre, rms_db=-20.0):
    """lee sfx/<nombre>.mp3 y lo deja con el mismo volumen medio (para que los niveles de abajo sean comparables)"""
    x = sonido.leer_audio(SFX / f"{nombre}.mp3").astype(np.float64)
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-12) * 10 ** (rms_db / 20)


SISEO = {"apaga_lampara"}  # aire y zumbidos: se les quita el siseo agudo (que no suene a fuga de gas)


def golpe(nombre, pico_db=-6.0):
    x = sonido.leer_audio(SFX / f"{nombre}.mp3").astype(np.float64)
    if nombre in SISEO:
        x = pasa(x, None, 3800)
    return norm(x, 10 ** (pico_db / 20))


def bucle(x, dur, cruce=0.4):
    """repite un sonido hecho en bucle hasta cubrir dur segundos (con un cruce suave por si acaso)"""
    n = int(dur * SR); c = int(cruce * SR); out = np.zeros(n + len(x)); i = 0
    rampa_c = np.linspace(0, 1, c)
    while i < n:
        y = x.copy()
        if i > 0:
            y[:c] *= rampa_c; out[i:i + c] *= 1 - rampa_c
        out[i:i + len(y)] += y
        i += len(x) - c
    return out[:n]


def tramo(x, ini, fin, sube=0.5, baja=0.5):
    """coloca un bucle de ini a fin (segundos del video) con entrada y salida suaves"""
    y = bucle(x, fin - ini) * env(fin - ini, sube, baja)[: int((fin - ini) * SR)]
    out = np.zeros(N); i = int(ini * SR); out[i:i + len(y)] = y[: N - i]
    return out


def db(v):
    return 10 ** (v / 20)


# ------------------------------------------------------------------ pistas
pista = np.zeros(N)


def poner(x, seg, vol=1.0):
    i = int(seg * SR)
    if i >= N or i < 0:
        return
    x = x[: N - i]
    pista[i:i + len(x)] += x * vol


# efectos de la historia (cada uno en su palabra)
poner(golpe("tabla_cruje", -8), 0.4)                         # «alguien vivió…»
poner(golpe("porton_cruje", -6), fw(8) + 0.1)                # el portón entreabierto
poner(golpe("pasos_nieve", -7), fw(66))                      # «había huellas»
poner(golpe("candado", -6), fw(78))                          # «ninguna regresaba»: el candado roto
poner(golpe("pasos_techo", -4), fw(84))                      # «oyó pasos arriba»
poner(golpe("escalera", -6), fw(91))                         # «subió»
poner(golpe("periodico", -6), fw(104))                       # el periódico
poner(golpe("toc_puerta", -6), fw(118))                      # llega María
for k in range(3):
    poner(golpe("apaga_lampara", -8), fw(130) + 26 * k / FPS)  # las ventanas se apagan
poner(golpe("golpes_sordos", -9), fw(136) + 0.2)             # «uno por uno» (lejos, apagados)
poner(golpe("apaga_lampara", -8), fw(147))             # la ventana de la casa
poner(golpe("mugido", -9), fw(172))                          # los animales
poner(golpe("cuchara", -7), fw(177))                         # «comía en la cocina»
poner(golpe("pasos_nieve", -8), fw(190) + 0.5)               # los vecinos caminan
poner(golpe("porton_cruje", -5), fw(205) - 0.2)              # «entraron»
poner(golpe("maquina_escribir", -8), fw(211))                # la policía
poner(golpe("sello", -5), fw(219) + 0.2)                     # SIN RESOLVER
poner(golpe("derrumbe", -9), fw(224))                        # «derribaron la granja»
poner(golpe("tabla_cruje", -5), fw(237))                     # el ático
efectos = pista.copy(); pista[:] = 0
# letreros: golpe suave en cada fecha; fuerte en «encontraron» y en la pregunta final
for w in (15, 39, 54, 114, 190, 211, 221, 227):
    poner(golpe("golpe_titulo", -12), t(w) - 0.07)
    poner(golpe("whoosh", -14), t(w) - 0.4)
poner(golpe("golpe_titulo", -6), t(207) - 0.07)              # «y los encontraron»
poner(golpe("golpe_titulo", -6), t(243) - 0.07)              # ¿Tú qué crees que pasó?
# final (solo los últimos segundos): dron y latidos
dron_f = tramo(sfx("dron"), fw(227), DUR, 3.0, 0.8)
latidos = tramo(sfx("latidos"), fw(235), DUR, 1.0, 0.6)
fondo_crudo = dron_f * db(-5) + latidos * db(-3) + pista * db(-14) + efectos * db(-11)

# ------------------------------------------------------------------ voz y mezcla
voz = sonido.leer_audio(AQUI / "voz" / "voz_final.mp3")
vz = np.zeros(N); vz[: min(N, len(voz))] = voz[:N]
envv = np.convolve(np.abs(vz), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
duck = 1 - 0.75 * np.clip(envv / (np.percentile(envv[envv > 1e-4], 60) + 1e-9), 0, 1)
hab0 = envv > np.percentile(envv, 70)
ganancia = 3.79 * np.sqrt(np.mean(vz[hab0] ** 2)) / 0.2077  # mismo nivel de efectos que «La taquería»
fondo = pasa(fondo_crudo, 100, None) * duck * ganancia
mezcla = vz * 1.0 + fondo
mezcla /= max(1.0, np.max(np.abs(mezcla)) / 0.95)
salida = AQUI / "audio"
salida.mkdir(exist_ok=True)
crudo = salida / "mezcla_cruda.wav"
sonido.guardar_wav(crudo, mezcla)
med = subprocess.run(["ffmpeg", "-i", str(crudo), "-af", "loudnorm=I=-14:TP=-2.5:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(med[med.rindex("{"):])
filtro = (f"loudnorm=I=-14:TP=-2.5:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(crudo), "-af", filtro, "-ar", str(SR), str(salida / "mezcla.wav")], check=True)
crudo.unlink()
hab = envv > np.percentile(envv, 70)
print(f"fondo bajo la voz al hablar: {20 * np.log10(np.sqrt(np.mean(fondo[hab] ** 2)) / np.sqrt(np.mean(vz[hab] ** 2))):.1f} dB")
print("listo:", salida / "mezcla.wav", f"{DUR:.2f} s")
