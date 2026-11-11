# «La taquería de las 2 AM»

- `GUION.md` — guion aprobado (205 palabras). Todos tienen sombra bajo el foco menos el papá (nota del usuario).
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 72.39 s) y `palabras.json` con los tiempos.
- `sfx/` — 19 efectos grabados con ElevenLabs (`herramientas/sfx_elevenlabs.py`, pedidos en `sfx/pedidos.json`).
- `mezcla.py` → `audio/mezcla.wav` — voz + calle de noche, comal (hasta que se apaga), zumbido del foco (se corta en
  el apagón), cuchillo, taxi y puertas, perro, goteo, apagón, perilla del gas, respiración, vuelve la luz,
  dron y latidos al final. Sin música. Fondo −13 dB bajo la voz.
- Animación: `caricatura3d/src/videos/taqueria/` (composición `Taqueria`, 2172 cuadros; portada `TaqueriaPortada`).
  Render: `bash scripts/render_por_tramos.sh Taqueria 2172 salida/taqueria 250` y luego unir con el audio.

## Video final
- Render completo: 2172 cuadros, 1080×1920, 72.4 s (`caricatura3d/salida/taqueria/taqueria.mp4`, no se sube a git).
- Audio: −14.0 LUFS, pico −2.4 dBFS. Unir con
  `-af "aresample=48000,alimiter=limit=0.75:level=false:attack=1:release=50" -c:a aac -b:a 192k` (sin eso el AAC
  pasaba de 0 dB).
- v2: el comal sonaba a **fuga de gas** (chisporroteo parejo, 93 % de la energía arriba de 4 kHz). Se grabó de nuevo,
  se filtra a 250–4000 Hz y va 11 dB más bajo; el zumbido del foco se cambió por uno grave de 60 Hz (el anterior era
  siseo). Los originales quedan en `sfx/descartados/`.
- Revisión §8.6c: sombras de silueta a 6 mm del piso; billete, charco y gotas sin encimarse;
  `revisar_parpadeo.py` solo marca movimiento buscado (personajes hablando y caminando, gotas, temblor de ojos al final).
- v3: la sombra del perro salía **al revés** (cuando caía hacia la cámara, la cabeza quedaba del lado de la cola).
  `comun/sombra.ts` ahora la voltea para que conserve la izquierda/derecha del dibujo. Render completo de nuevo,
  2172 cuadros; `revisar_parpadeo.py` solo marca al perro moviéndose.
