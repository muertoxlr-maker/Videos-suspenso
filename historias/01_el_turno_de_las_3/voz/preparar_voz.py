"""Genera y prepara la narración de «El turno de las 3:00» con ElevenLabs.

Configuración = la que el usuario usa siempre en su cuenta (modelo eleven_v4, estabilidad 0.5, similitud 0.75,
velocidad normal). Con eleven_multilingual_v2 + similitud 0.95 la voz salía apagada y con distorsión.

Pasos:
1. Envía el texto de texto_enviado.txt SIN las etiquetas <break> (las pausas se ponen aquí después).
2. Guarda voz_original_elevenlabs.mp3 y alineacion_caracteres.json (tiempos por letra).
3. Calcula el inicio/fin de cada palabra y ajusta los silencios entre palabras:
   - donde el guion tenía <break 0.75s> (cambio de parte): 0.60–0.70 s
   - donde tenía <break 0.4–0.45s>: 0.30–0.45 s
   - pausas dramáticas («ninguna...», «a mano...»): 0.45–0.55 s
   - el resto: se deja natural, como máximo 0.45 s
   La voz no se modifica: solo se quita o añade silencio dentro de los huecos.
4. Escribe voz_final.mp3, palabras.json (aquí) y caricatura3d/src/videos/turno3/palabras.json (con puntuación).

Uso:  python3 historias/01_el_turno_de_las_3/voz/preparar_voz.py [--sin-generar]
"""
import base64
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parents[2]
SR = 44100
VOZ_ID = "NpjhSa7jQNbSGat8hG6Q"  # «Videos suspenso»
AJUSTES = {"stability": 0.5, "similarity_boost": 0.75, "style": 0.0, "use_speaker_boost": True, "speed": 1.0}
MODELO = "eleven_v4"

crudo = (AQUI / "texto_enviado.txt").read_text().strip()
# tokens del guion; cada <break> se asigna a la palabra anterior
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
    (AQUI / "voz_original_elevenlabs.mp3").write_bytes(base64.b64decode(d["audio_base64"]))
    json.dump(d["alignment"], open(AQUI / "alineacion_caracteres.json", "w"), ensure_ascii=False)

ali = json.load(open(AQUI / "alineacion_caracteres.json"))
letras = "".join(ali["characters"])
assert letras == texto, "la alineación no coincide con el texto enviado"
ini_c, fin_c = ali["character_start_times_seconds"], ali["character_end_times_seconds"]

palabras, pos = [], 0
for i, w in enumerate(fichas):
    a = letras.index(w, pos); b = a + len(w); pos = b
    idx = [k for k in range(a, b) if letras[k].isalnum()]
    palabras.append({"txt": w, "ini": ini_c[idx[0]], "fin": fin_c[idx[-1]]})

audio = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(AQUI / "voz_original_elevenlabs.mp3"), "-ac", "1", "-ar", str(SR),
                                      "-f", "f32le", "-"], check=True, capture_output=True).stdout, np.float32).astype(np.float64)


def rango(i):
    w = fichas[i]
    if pausa_tras.get(i, 0) >= 0.7:
        return 0.60, 0.70
    if w.endswith("...") and not w.endswith("hospital..."):
        return 0.45, 0.55
    if i in pausa_tras:
        return 0.30, 0.45
    return 0.0, 0.45


partes, nuevas, t_nuevo, cursor = [], [], 0.0, 0.0
for i, p in enumerate(palabras):
    # copia desde el cursor hasta el final de la palabra
    a, b = int(cursor * SR), int(p["fin"] * SR)
    partes.append(audio[a:b])
    nuevas.append({"txt": p["txt"], "ini": round(t_nuevo + (p["ini"] - cursor), 3), "fin": round(t_nuevo + (p["fin"] - cursor), 3)})
    t_nuevo += (b - a) / SR
    if i + 1 == len(palabras):
        cola = audio[b:b + int(0.35 * SR)]
        partes.append(cola * np.linspace(1, 0, len(cola)))
        t_nuevo += len(cola) / SR
        break
    hueco = palabras[i + 1]["ini"] - p["fin"]
    lo, hi = rango(i)
    objetivo = min(max(hueco, lo), hi)
    c0, c1 = int(p["fin"] * SR), int(palabras[i + 1]["ini"] * SR)
    if objetivo >= hueco:  # añadir silencio en medio del hueco
        mitad = (c0 + c1) // 2
        partes += [audio[c0:mitad], np.zeros(int((objetivo - hueco) * SR)), audio[mitad:c1]]
    else:  # quitar el centro del hueco con fundidos de 12 ms
        n = int(objetivo * SR); m1 = n // 2; f = int(0.012 * SR)
        izq, der = audio[c0:c0 + m1].copy(), audio[c1 - (n - m1):c1].copy()
        if len(izq) > f: izq[-f:] *= np.linspace(1, 0, f)
        if len(der) > f: der[:f] *= np.linspace(0, 1, f)
        partes += [izq, der]
    t_nuevo += objetivo
    cursor = palabras[i + 1]["ini"]

final = np.concatenate(partes)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "libmp3lame", "-b:a", "192k",
                str(AQUI / "voz_final.mp3")], input=final.tobytes(), check=True)
json.dump(nuevas, open(RAIZ / "caricatura3d/src/videos/turno3/palabras.json", "w"), ensure_ascii=False)
json.dump([{"p": re.sub(r"[^\wáéíóúñü]", "", w["txt"], flags=re.I), "ini": w["ini"], "fin": w["fin"]} for w in nuevas],
          open(AQUI / "palabras.json", "w"), ensure_ascii=False)
print(f"listo: {len(nuevas)} palabras, {len(final) / SR:.2f} s (original {len(audio) / SR:.2f} s)")
