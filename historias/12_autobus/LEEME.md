# «El autobús escolar»

- `GUION.md` — guion aprobado (zombies). Acción desde el segundo 0, en orden y sin adelantos: corres en el parque
  Los Fresnos, los zombies salen por la entrada, el autobús escolar te recoge, un zombie se pega a la ventana, volantazo,
  el camión sube a la banqueta y tumba un puesto; llega a la escuela (portón con cadena), y en el salón hay tres reglas
  en el pizarrón. Mateo, el número once, falta. A las 9:00 tocan la puerta y alguien contesta «presente» con tu voz. Final con
  dos botones: CONTESTAR / QUEDARTE CALLADO.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 81.99 s) y `palabras.json`.
- `sfx/` — efectos cortos (`pedidos.json`); `mezcla.py` → `audio/mezcla.wav`: cada efecto solo en su palabra, los de
  la acción más fuertes, dron y latidos solo al final (guía §5). −14 LUFS.
- Animación: `caricatura3d/src/videos/autobus/` (composición `Autobus`, 2460 cuadros, acabado §8.9). Reusa la avenida
  de `ambulancia.ts` y el camión de `camion.ts`; agrega parque, puesto que se tumba, escuela con portón de reja y
  salón con pizarrón en tres columnas, pupitres numerados, lista en el escritorio y puerta con vidrio esmerilado.
- Zombies con detalle (`zombi`), salen del parque por la entrada (no atraviesan la reja).

## Revisión §8.6c / §8.6d
- Nadie atraviesa rejas, puertas ni vidrios: el portón se abre y la silueta queda detrás del vidrio esmerilado.
- `revisar_parpadeo.py` en el video completo: lo marcado son zombies y el fondo de la calle en movimiento; paredes,
  salón, pizarrón y puerta salen limpios.

## Video final
- 2460 cuadros, 1080×1920, 82.0 s (`caricatura3d/salida/autobus/autobus.mp4`, no se sube a git).
- Audio: −14.0 LUFS, pico −2.2 dBFS.
