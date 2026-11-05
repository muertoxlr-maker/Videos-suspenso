# Videos de suspenso

Generador automático de vídeos verticales de suspenso del tipo **"reglas + dilema final"**
(formato TikTok / Reels / Shorts, 1080×1920). Escribes un guion en JSON y el programa dibuja
los escenarios y personajes en estilo cartoon, anima la cámara, pone los subtítulos con
palabras clave en amarillo, genera la voz del narrador y mezcla el ambiente y los efectos de sonido.

## Instalación

Necesitas **Python 3.9+** y **ffmpeg**.

```bash
pip install -r requirements.txt
# ffmpeg:  Windows → winget install ffmpeg   ·   macOS → brew install ffmpeg   ·   Linux → sudo apt install ffmpeg
```

## Uso

```bash
# 1. Mira primero cómo quedan todas las escenas (tarda unos segundos)
python generador/crear_video.py guiones/hotel_medianoche.json --previa

# 2. Prueba rápida en baja resolución
python generador/crear_video.py guiones/hotel_medianoche.json --rapido

# 3. Vídeo final 1080×1920
python generador/crear_video.py guiones/hotel_medianoche.json
```

El resultado queda en `salida/`: el `.mp4` y un `.srt` con los subtítulos, por si quieres
retocarlo en CapCut.

- La **voz automática** usa `edge-tts` (gratis, necesita internet). Si no hay conexión, el
  vídeo se genera igual pero sin narración. `--sin-voz` la desactiva a propósito.
- Para usar **tu propia voz**, graba un audio por escena y añádelo con `"audio": "voz/escena01.mp3"`
  (la ruta es relativa al archivo del guion). La escena dura lo que dure tu grabación.

---

## La fórmula

Así está construido un vídeo de este tipo (unos 60–75 segundos):

| Parte | Tiempo | Qué pasa | Ejemplo |
|---|---|---|---|
| **Gancho** | 0–5 s | Segunda persona, situación concreta, hora exacta. | "Imagina que tu coche se queda sin gasolina a las tres de la mañana." |
| **Contexto** | 5–15 s | El lugar y una pista de que algo anda mal. | "El recepcionista no te pregunta ni tu nombre." |
| **Reglas** | 15–40 s | 3 reglas numeradas, cada una más inquietante. | "Regla número uno: si tocan tres veces, no abras." |
| **Se rompe una regla** | 40–55 s | Lo que las reglas prohibían, ocurre. | "Una. Dos. Tres veces." |
| **Giro** | 55–65 s | Aparece la duda: ¿a quién creer? | "En la cama… estás tú." |
| **Pregunta** | final | Dos opciones con botones de color para que comenten. | "¿Abres la puerta… o le crees al que está contigo?" |

Consejos que marcan la diferencia:

- **Cortes rápidos**: una escena cada 2–3 segundos. Frases cortas.
- **Una idea por escena** y una o dos palabras clave en `*asteriscos*` (salen en amarillo).
- **Hablale al espectador** ("tú", "tu mamá", "tu habitación").
- **El dilema final no debe tener respuesta obvia**: ambas opciones tienen que dar miedo.
- Repite el número clave (tres golpes, 3:33, habitación 313): da sensación de patrón.

---

## Cómo escribir un guion

Copia `guiones/hotel_medianoche.json` y cámbialo. Estructura básica:

```json
{
  "titulo": "Nombre del vídeo",
  "voz": "es-MX-JorgeNeural",
  "velocidad_voz": "+6%",
  "reparto": {
    "tu": {"piel": "#eab48c", "pelo": "corto", "color_pelo": "#2a1c16", "ropa": "#3b5a7a"}
  },
  "escenas": [
    {"fondo": "calle", "personajes": [{"quien": "tu", "x": 0.5, "expresion": "miedo"}],
     "rotulo": "NOCHE 1 · 2:47 AM", "texto": "Imagina que *nadie* te espera."}
  ]
}
```

### Campos de cada escena

| Campo | Qué hace |
|---|---|
| `texto` | Lo que dice el narrador. Las palabras entre `*asteriscos*` salen en amarillo. Empieza con `—` para un diálogo. |
| `fondo` | `calle`, `recepcion`, `pasillo`, `habitacion`, `puerta`, `ascensor`, `nota`, `oscuro` |
| `opciones_fondo` | Detalles del fondo: `letrero` y `letra_apagada` (calle), `puertas` y `parpadeo` (pasillo), `piso` (ascensor), `lineas`, `resaltar` y `encabezado` (nota) |
| `personajes` | Lista de `{"quien", "x" (0–1), "expresion", "mirar" (-1 a 1), "tam", "subir"}` |
| `plano` | `general` (cuerpo entero), `medio` (de cintura arriba), `primer_plano` (la cara) |
| `rotulo` | Etiqueta arriba a la izquierda que aparece como máquina de escribir. |
| `titulo` | Texto grande arriba, p. ej. `"REGLA Nº 1"` (suena un golpe automáticamente). |
| `opciones` | Dos botones para la pregunta final, p. ej. `["ABRO", "NO ABRO"]`. |
| `camara` | `in`, `out`, `izquierda`, `derecha`, `fijo` (por defecto alterna in/out). |
| `efectos` | `sacudida`, `parpadeo`, `destello` |
| `sonidos` | `impacto`, `toc`, `toc3` (tres golpes, mueve la cámara), `latido`, `whoosh`, `chirrido` |
| `tinte` | Color que tiñe la escena, p. ej. `"#7a0000"` para rojo. |
| `duracion` | Duración mínima en segundos (si no, se ajusta a la voz). |
| `voz`, `velocidad_voz`, `tono` | Cambiar la voz solo en esta escena (p. ej. `"tono": "-12Hz"` para una voz más grave e inquietante). |
| `audio` | Tu propia grabación para esta escena. |

### Personajes (`reparto`)

| Campo | Valores |
|---|---|
| `piel`, `ropa`, `pantalon`, `color_pelo` | Colores en hexadecimal, p. ej. `"#3b5a7a"` |
| `pelo` | `corto`, `largo`, `mono`, `calvo`, `gorra` |
| `detalle` | `corbata`, `chaleco` |
| `lentes` | `true` / `false` |
| `sombra` | `true` → silueta negra (ideal con la expresión `vacio`) |

**Expresiones:** `neutral`, `feliz`, `triste`, `miedo`, `grito`, `enojado`, `sospecha`,
`cansado`, `silencio` (dedo en los labios), `sonrisa_rara`, `vacio` (ojos en blanco).

### Voces en español para `voz`

`es-MX-JorgeNeural`, `es-MX-DaliaNeural`, `es-ES-AlvaroNeural`, `es-ES-ElviraNeural`,
`es-AR-TomasNeural`, `es-CO-GonzaloNeural`. Lista completa: `edge-tts --list-voices`.

---

## Estructura del proyecto

```
generador/
  crear_video.py   ← programa principal (guion → vídeo)
  dibujos.py       ← escenarios y personajes dibujados con código
  sonido.py        ← ambiente y efectos de sonido sintetizados
  tipografia.py    ← carga de fuentes
  fuentes/         ← Inter y JetBrains Mono (licencia OFL)
guiones/
  hotel_medianoche.json   ← guion de ejemplo
salida/            ← aquí aparecen los vídeos (no se sube a git)
```

Para añadir un escenario nuevo, escribe una función `fondo_algo(img, rnd, op)` en
`generador/dibujos.py` y regístrala en el diccionario `FONDOS`.
