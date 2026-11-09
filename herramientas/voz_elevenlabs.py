"""Narración con la voz del usuario en ElevenLabs + tratamiento + tiempos por palabra.

Uso:  python3 herramientas/voz_elevenlabs.py historias/<carpeta>/voz [--sin-generar] [--sin-tratamiento]

Lee <carpeta>/texto_enviado.txt (con etiquetas <break time="0.45s" />) y escribe en la misma carpeta:
  voz_original_elevenlabs.mp3, alineacion_caracteres.json  — salida tal cual de ElevenLabs
  voz_final.mp3                                            — silencios ajustados + tratamiento (lo que va al video)
  palabras.json                                            — [{txt, ini, fin}] en segundos de voz_final.mp3

Configuración (guía §5): la habitual del usuario — modelo eleven_v4, estabilidad 0.5, similitud 0.75, velocidad 1.0.
Tratamiento: el de sus videos anteriores — tono ×0.96 (misma velocidad), filtro 85–5200 Hz, +2 dB en graves y
claridad, compresión 1.6:1, eco tenue (43 y 87 ms) y volumen a −16 LUFS con picos ≤ −2 dB (sin él la voz «se satura»).
Pausas: 0.60–0.70 s donde había <break> ≥ 0.7 s; 0.30–0.45 s en los demás <break>; 0.45–0.55 s en «...» sin <break>;
el resto natural, máximo 0.45 s. La voz en sí no se corta: solo se quita o añade silencio en los huecos.
"""
import base64
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

CARPETA = Path(sys.argv[1]).resolve()
SR = 44100
VOZ_ID = "NpjhSa7jQNbSGat8hG6Q"  # «Videos suspenso»
AJUSTES = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True, "speed": 1.0}
MODELO = "eleven_v4"
TRATAMIENTO = ("aresample=44100,asetrate=44100*0.96,aresample=44100,atempo=1/0.96,highpass=f=85,lowpass=f=5200,"
               "equalizer=f=120:t=q:w=1:g=2,equalizer=f=2800:t=q:w=1.2:g=2,"
               "acompressor=threshold=-18dB:ratio=1.6:attack=10:release=150,aecho=0.9:0.9:43|87:0.12|0.07,"
               "loudnorm=I=-16:TP=-2:LRA=7")

crudo = (CARPETA / "texto_enviado.txt").read_text().strip()
fichas, pausa_tras = [], {}
for trozo in re.split(r"(<break time=\"[\d.]+s\" />)", crudo):
    m = re.match(r"<break time=\"([\d.]+)s\" />", trozo)
    if m:
        pausa_tras[len(fichas) - 1] = float(m.group(1))
    else:
        fichas += trozo.split()
texto = " ".join(fichas)

if "--sin-generar" not in sys.argv:
    cuerpo = {"text": texto, "model_id": MODELO, "voice_settings": AJUSTES}
    req = urllib.request.Request(
        f"https://api.elevenlabs.io/v1/text-to-speech/{VOZ_ID}/with-timestamps?output_format=mp3_44100_192",
        data=json.dumps(cuerpo).encode(), headers={"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=600))
    (CARPETA / "voz_original_elevenlabs.mp3").write_bytes(base64.b64decode(d["audio_base64"]))
    json.dump(d["alignment"], open(CARPETA / "alineacion_caracteres.json", "w"), ensure_ascii=False)

ali = json.load(open(CARPETA / "alineacion_caracteres.json"))
letras = "".join(ali["characters"])
assert letras == texto, "la alineación no coincide con el texto enviado"
ini_c, fin_c = ali["character_start_times_seconds"], ali["character_end_times_seconds"]

palabras, pos = [], 0
for w in fichas:
    a = letras.index(w, pos); b = a + len(w); pos = b
    idx = [k for k in range(a, b) if letras[k].isalnum()]
    palabras.append({"txt": w, "ini": ini_c[idx[0]], "fin": fin_c[idx[-1]]})

audio = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(CARPETA / "voz_original_elevenlabs.mp3"), "-ac", "1", "-ar", str(SR),
                                      "-f", "f32le", "-"], check=True, capture_output=True).stdout, np.float32).astype(np.float64)


def rango(i):
    if pausa_tras.get(i, 0) >= 0.7:
        return 0.60, 0.70
    if i in pausa_tras:
        return 0.30, 0.45
    if fichas[i].endswith("..."):
        return 0.45, 0.55
    return 0.0, 0.45


partes, nuevas, t_nuevo, cursor = [], [], 0.0, 0.0
for i, p in enumerate(palabras):
    a, b = int(cursor * SR), int(p["fin"] * SR)
    partes.append(audio[a:b])
    nuevas.append({"txt": p["txt"], "ini": round(t_nuevo + (p["ini"] - cursor), 3), "fin": round(t_nuevo + (p["fin"] - cursor), 3)})
    t_nuevo += (b - a) / SR
    if i + 1 == len(palabras):
        cola = audio[b:b + int(0.35 * SR)]
        partes.append(cola * np.linspace(1, 0, len(cola)))
        break
    hueco = palabras[i + 1]["ini"] - p["fin"]
    lo, hi = rango(i)
    objetivo = min(max(hueco, lo), hi)
    c0, c1 = int(p["fin"] * SR), int(palabras[i + 1]["ini"] * SR)
    if objetivo >= hueco:
        mitad = (c0 + c1) // 2
        partes += [audio[c0:mitad], np.zeros(int((objetivo - hueco) * SR)), audio[mitad:c1]]
    else:
        n = int(objetivo * SR); m1 = n // 2; f = int(0.012 * SR)
        izq, der = audio[c0:c0 + m1].copy(), audio[c1 - (n - m1):c1].copy()
        if len(izq) > f: izq[-f:] *= np.linspace(1, 0, f)
        if len(der) > f: der[:f] *= np.linspace(0, 1, f)
        partes += [izq, der]
    t_nuevo += objetivo
    cursor = palabras[i + 1]["ini"]

final = np.concatenate(partes)
filtro = ["-af", TRATAMIENTO] if "--sin-tratamiento" not in sys.argv else []
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", *filtro, "-ar", str(SR),
                "-c:a", "libmp3lame", "-b:a", "192k", str(CARPETA / "voz_final.mp3")], input=final.tobytes(), check=True)
json.dump(nuevas, open(CARPETA / "palabras.json", "w"), ensure_ascii=False)
print(f"listo: {len(nuevas)} palabras, {len(final) / SR:.2f} s (original {len(audio) / SR:.2f} s)")
