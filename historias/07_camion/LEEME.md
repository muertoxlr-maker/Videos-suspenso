# «El camión escolar»

- `GUION.md` — guion aprobado: tu primer día manejando el camión 7, la hoja con las tres reglas pegada en el tablero,
  tu hija Sofi a bordo y el niño 23 que aparece en el espejo después del puente viejo.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 77.27 s) y `palabras.json` con los tiempos.
- `sfx/` — efectos cortos (pedidos en `sfx/pedidos.json`; golpe de título, whoosh, latidos y dron vienen del velorio):
  camión que pasa, puerta neumática, hoja de papel, lluvia que empieza, limpiaparabrisas, freno de aire, vaho, luz que
  parpadea. Los de aire (puerta, freno, vaho, luz) llevan filtro de 3800 Hz para que no suenen a fuga de gas.
- `mezcla.py` → `audio/mezcla.wav` — voz + efectos, cada uno solo en su palabra; dron y latidos solo en los últimos
  segundos (guía §5). −14.0 LUFS, pico −2.5 dBTP.
- Animación: `caricatura3d/src/videos/camion/` (composición `Camion`, 2319 cuadros; portada `CamionPortada`).
  Escenario en `camion.ts`: camión escolar completo (escalones, puerta de dos hojas que se abre, tablero con relojes y
  la hoja de reglas, volante, palanca, asiento del chofer, mamparas, bancas con respaldo y agarradera, pasamanos,
  espejo interior con reflejo real, limpiadores, extintor, bote, salida de emergencia), carretera del pueblo con casas
  de teja, tiendas, postes, paradas escolares, río, puente de fierro «PUENTE VIEJO 1958» y la casa abandonada.
  Render: `bash scripts/render_por_tramos.sh Camion 2319 salida/camion 250` y luego unir con el audio.

## Revisión §8.6c / §8.6d
- La puerta se abre (las hojas giran hacia adentro) cada vez que sube o baja alguien; nadie atraviesa vidrios ni paredes.
- Tarjetas ≥ 0.2 m de los objetos; capas separadas ≥ 5 mm; respaldos bajados y niños más altos para que ningún
  respaldo tape bocas; volante casi acostado para no tapar al chofer; limpiadores quietos en los acercamientos.
- Los sentados llevan la silla dibujada en la tarjeta; Sofi abraza su mochila.
- `revisar_parpadeo.py` en clips de prueba (0–90, 120–210, 1440–1530, 1690–1780, 2228–2318) y en el video completo:
  lo marcado es movimiento buscado (carretera que corre, lluvia y gotas, reflejo del espejo, vaho, ojos temblando).

## Video final
- 2319 cuadros, 1080×1920, 77.3 s (`caricatura3d/salida/camion/camion.mp4`, no se sube a git).
- Audio: −14.1 LUFS, pico −2.3 dBFS.
