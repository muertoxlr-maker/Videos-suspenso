"""Efectos de sonido realistas con ElevenLabs (texto → sonido), para no usar efectos sintetizados que suenan falsos.

Uso:  python3 herramientas/sfx_elevenlabs.py historias/<carpeta>/sfx

Lee <carpeta>/pedidos.json: {"nombre": {"texto": "...", "seg": 20, "loop": true, "influencia": 0.4}, ...}
y guarda <carpeta>/<nombre>.mp3. Solo pide los que todavía no existen (para no gastar créditos dos veces).
Escribe las descripciones en inglés (salen mejor) y pide «no music» / «no voices» cuando no se quieran.
"""
import json
import sys
import urllib.request
from pathlib import Path

CARPETA = Path(sys.argv[1]).resolve()
pedidos = json.load(open(CARPETA / "pedidos.json"))
for nombre, p in pedidos.items():
    destino = CARPETA / f"{nombre}.mp3"
    if destino.exists():
        continue
    cuerpo = {"text": p["texto"], "duration_seconds": p["seg"], "prompt_influence": p.get("influencia", 0.4),
              "model_id": "eleven_text_to_sound_v2"}
    if p.get("loop"):
        cuerpo["loop"] = True
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_192",
                                 data=json.dumps(cuerpo).encode(),
                                 headers={"xi-api-key": "proxy-injected", "Content-Type": "application/json"})
    destino.write_bytes(urllib.request.urlopen(req, timeout=300).read())
    print("listo:", destino.name)
