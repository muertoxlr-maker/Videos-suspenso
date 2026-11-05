"""Acceso a las fuentes tipográficas incluidas en generador/fuentes/."""
from functools import lru_cache
from pathlib import Path

from PIL import ImageFont

CARPETA = Path(__file__).parent / "fuentes"
ARCHIVOS = {
    "titulo": "InterDisplay-Black.otf",
    "texto": "InterDisplay-ExtraBold.otf",
    "mono": "JetBrainsMono-Bold.ttf",
}


@lru_cache(maxsize=None)
def fuente(tipo, tam):
    return ImageFont.truetype(str(CARPETA / ARCHIVOS[tipo]), int(tam))
