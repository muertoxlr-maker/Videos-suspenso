"""Mezcla de «El turno de las 3:00»: voz + ambiente + efectos sintetizados, sincronizados con palabras.json.

Guía §5: voz al frente; ambiente/música continuo 4–7 dB bajo la voz; -14 LUFS al final; el video termina con la
última palabra. Todos los efectos se generan con numpy (sin bibliotecas de sonido de terceros).

Uso:  python3 historias/01_el_turno_de_las_3/mezcla.py   → historias/01_el_turno_de_las_3/audio/mezcla.wav
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[1] / "generador"))
import sonido  # noqa: E402  (ambiente, impacto, latido, whoosh, chirrido, toc)

SR = sonido.SR
FPS = 30
P = json.load(open(AQUI / "voz" / "palabras.json"))
DUR = 2463 / FPS
N = int(DUR * SR)
rng = np.random.default_rng(7)


def t(i):  # segundo en que empieza la palabra i
    return P[i]["ini"]


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def norm(x, pico=1.0):
    m = np.max(np.abs(x)) or 1.0
    return x / m * pico


def pasa(x, bajo=None, alto=None):
    return sonido._filtro(x, bajo, alto)


# ------------------------------------------------------------------ efectos nuevos
def bip(f=1000, dur=0.09):
    x = np.sin(2 * np.pi * f * tt(dur)) * np.minimum(1, np.minimum(tt(dur) / 0.005, (dur - tt(dur)) / 0.02))
    return x


def tic():
    x = pasa(rng.standard_normal(int(0.03 * SR)), 1500, 6000) * np.exp(-tt(0.03) * 160)
    return norm(x) * 0.7


def zumbido(dur):
    x = tt(dur)
    y = sum(np.sin(2 * np.pi * 120 * k * x) / k for k in (1, 2, 3, 5)) + 0.3 * pasa(rng.standard_normal(len(x)), 2000, 5000)
    return norm(y)


def chasquido_luz():
    x = pasa(rng.standard_normal(int(0.25 * SR)), 300, 4000) * (rng.random(int(0.25 * SR)) > 0.7) * np.exp(-tt(0.25) * 12)
    return norm(x)


def ruedas(dur):
    x = tt(dur)
    f = 1800 + 400 * np.sin(2 * np.pi * 0.9 * x)
    chirr = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.1 * x)) ** 4
    rodar = pasa(rng.standard_normal(len(x)), 60, 400)
    env = np.minimum(1, np.minimum(x / 0.4, (dur - x) / 0.6))
    return norm(0.25 * chirr + norm(rodar)) * env


def campanita():
    x = tt(1.6)
    return norm((np.sin(2 * np.pi * 1318 * x) + 0.6 * np.sin(2 * np.pi * 2637 * x)) * np.exp(-x * 3))


def puertas_metal(dur=0.9):
    x = tt(dur)
    roce = pasa(rng.standard_normal(len(x)), 200, 1500) * np.minimum(1, np.minimum(x / 0.1, (dur - x) / 0.1))
    golpe = np.zeros_like(x); k = int((dur - 0.12) * SR); g = sonido.toc(); golpe[k:k + len(g)] += g[: len(x) - k]
    return norm(0.5 * norm(roce) + golpe)


def cortina():
    x = tt(0.7)
    anillas = pasa(rng.standard_normal(len(x)), 2500, 8000) * (0.4 + 0.6 * (np.sin(2 * np.pi * 22 * x) > 0.6))
    tela = pasa(rng.standard_normal(len(x)), 300, 2000)
    return norm(anillas * 0.5 + tela) * np.sin(np.pi * x / x[-1])


def clic():
    x = pasa(rng.standard_normal(int(0.05 * SR)), 1000, 7000) * np.exp(-tt(0.05) * 90)
    return norm(x)


def soplo_vacio():
    x = tt(0.35)
    return norm(pasa(rng.standard_normal(len(x)), 800, 4000)) * np.exp(-x * 10) * 0.4


def timbre_llamada():
    x = tt(1.4)
    ding = np.sin(2 * np.pi * 880 * x) * np.exp(-x * 4)
    dong = np.zeros_like(x); k = int(0.45 * SR); y = np.arange(len(x) - k) / SR; dong[k:] = np.sin(2 * np.pi * 698 * y) * np.exp(-y * 4)
    return norm(ding + dong)


def tos():
    x = tt(0.35)
    return norm(pasa(rng.standard_normal(len(x)), 150, 1800) * np.exp(-x * 9) * (1 + 0.5 * np.sin(2 * np.pi * 9 * x)))


def respiracion(dur):
    x = tt(dur)
    silbido = pasa(rng.standard_normal(len(x)), 900, 3000) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.9 * x)) ** 2
    return norm(silbido)


def picaporte():
    a = clic(); b = np.zeros(int(0.25 * SR)); b[: len(a)] += a; c = clic(); b[int(0.12 * SR):int(0.12 * SR) + len(c)] += c * 0.7
    return b


def golpe_grave():
    x = tt(2.2)
    f = 35 + 50 * np.exp(-x * 4)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.4) + 0.3 * pasa(rng.standard_normal(len(x)), None, 300) * np.exp(-x * 6))


# ------------------------------------------------------------------ pistas
pista = np.zeros(N)


def poner(x, seg, vol):
    i = int(seg * SR)
    if i >= N:
        return
    x = x[: N - i]
    pista[i:i + len(x)] += x * vol


# ambiente grave continuo (más presente en los silencios; se baja bajo la voz con el «ducking» de abajo)
amb = sonido.ambiente(DUR + 1)[:N]
ambiente = np.zeros(N); ambiente[: len(amb)] = amb

# monitor de signos: 1 pitido por segundo; desde las 3:40 más rápido; al final, alarma aguda
s = 0.4
while s < DUR - 0.3:
    if s < t(119):
        paso, f, v = 1.0, 1000, 0.10
    elif s < t(181):
        paso, f, v = 0.62, 1180, 0.13
    else:
        paso, f, v = 0.45, 1400, 0.15
    poner(bip(f), s, v)
    s += paso

# zumbido de fluorescentes en los planos del pasillo
fin_pl = {15: 21, 47: 75, 98: 105, 187: 194}
for a_w, b_w in fin_pl.items():
    a_s, b_s = t(a_w) - 0.07, t(b_w) - 0.07
    poner(zumbido(b_s - a_s) * np.minimum(1, np.minimum(tt(b_s - a_s) / 0.08, (b_s - a_s - tt(b_s - a_s)) / 0.08)), a_s, 0.035)
poner(chasquido_luz(), t(15) + 0.2, 0.25)
poner(chasquido_luz(), t(20) - 0.15, 0.35)

# reloj: tic-tac y golpe en «tres»
for k in range(int((t(15) - t(6)) / 0.5)):
    poner(tic(), t(6) + k * 0.5, 0.35)
poner(golpe_grave(), t(12) - 0.03, 0.45)
# «cambian de cara»: impacto
poner(sonido.impacto(), t(20) - 0.05, 0.6)
# títulos de regla y de hora
for w in (44, 61, 75):
    poner(sonido.impacto(), t(w) - 0.07, 0.5)
    poner(sonido.whoosh(), t(w) - 0.35, 0.25)
for w in (93, 119):
    poner(sonido.impacto(), t(w) - 0.07, 0.32)
# pizarrón / camilla del pasillo
poner(ruedas(2.6), t(56) - 0.1, 0.22)
# elevador: campanita y puertas
poner(campanita(), t(64), 0.22)
poner(puertas_metal(), t(70) - 0.05, 0.3)
# camilla que pasa frente a la puerta
poner(ruedas(3.6), t(98) - 0.3, 0.28)
# cortina y cama vacía
poner(cortina(), t(105) - 0.05, 0.3)
poner(sonido.latido(), t(116) + 0.2, 0.35)
# la abuela se ahoga
for k in range(5):
    poner(tos(), t(126) + k * 0.42, 0.22)
poner(respiracion(t(181) - t(129)), t(129), 0.05)
# inhalador vacío: dos clics y un soplo sin aire
for k, d in enumerate((0.0, 0.47)):
    poner(clic(), t(130) + d, 0.4); poner(soplo_vacio(), t(130) + d + 0.02, 0.3)
# timbre de llamada que nadie atiende
poner(timbre_llamada(), t(135), 0.3)
# la puerta se abre
poner(picaporte(), t(139) - 0.1, 0.4)
poner(sonido.chirrido(), t(139) + 0.05, 0.45)
# el gafete: golpe grave y latidos
poner(golpe_grave(), t(167) - 0.05, 0.5)
for k in range(3):
    poner(sonido.latido(), t(167) + 0.5 + k * 0.85, 0.35)
# el pasillo lleno de camillas
poner(sonido.whoosh(), t(187) - 0.3, 0.25)
# pregunta final: latidos que se aceleran y golpe al aparecer los botones
poner(sonido.impacto(), t(194) - 0.07, 0.35)
s = t(194) + 0.3
paso = 0.85
while s < DUR - 0.4:
    poner(sonido.latido(), s, 0.3)
    s += paso; paso = max(0.5, paso * 0.92)

# ------------------------------------------------------------------ voz y mezcla
voz = sonido.leer_audio(AQUI / "voz" / "voz_final.mp3")
vz = np.zeros(N); vz[: min(N, len(voz))] = voz[:N]
# ducking: el fondo baja ~5 dB cuando habla el narrador
env = np.convolve(np.abs(vz), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
duck = 1 - 0.45 * np.clip(env / (np.percentile(env[env > 1e-4], 60) + 1e-9), 0, 1)
fondo = (ambiente * 0.62 + pista * 2.8) * duck
mezcla = vz * 1.0 + fondo
mezcla /= max(1.0, np.max(np.abs(mezcla)) / 0.95)
salida = AQUI / "audio"
salida.mkdir(exist_ok=True)
crudo = salida / "mezcla_cruda.wav"
sonido.guardar_wav(crudo, mezcla)
# volumen final: -14 LUFS (doble pasada de loudnorm)
med = subprocess.run(["ffmpeg", "-i", str(crudo), "-af", "loudnorm=I=-14:TP=-1.0:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(med[med.rindex("{"):])
filtro = (f"loudnorm=I=-14:TP=-1.0:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(crudo), "-af", filtro, "-ar", str(SR), str(salida / "mezcla.wav")], check=True)
crudo.unlink()
print("listo:", salida / "mezcla.wav", f"{DUR:.2f} s")
