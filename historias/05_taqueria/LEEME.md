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
- Audio: −14.0 LUFS, pico −1.5 dBFS.
- Revisión §8.6c: sombras de silueta a 6 mm del piso; billete, charco y gotas sin encimarse;
  `revisar_parpadeo.py` solo marca movimiento buscado (personajes hablando y caminando, gotas, temblor de ojos al final).
