# «El último tren»

- `GUION.md` — guion aprobado (zombies). Gancho con acción desde el segundo 0, en orden y sin adelantos: corres con tu
  hermana Sofi por la estación, los zombies bajan por la escalera eléctrica, las puertas del tren se atoran, alcanzan a
  subir; el tren llega a un andén convertido en refugio con tres reglas en la pared; a las 10 suena la sirena, se
  apagan las luces y tu mamá golpea la puerta. Final con dos botones: ABRIR LA PUERTA / DEJARLA AFUERA.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 82.36 s) y `palabras.json`.
- `sfx/` — efectos cortos (`pedidos.json`); `mezcla.py` → `audio/mezcla.wav`: cada efecto solo en su palabra, los de
  la acción del inicio 4 dB más fuertes, dron y latidos solo al final (guía §5). −14 LUFS.
- Animación: `caricatura3d/src/videos/tren/` (composición `Tren`, 2471 cuadros, acabado §8.9). Usa el andén y el
  vagón de `ultimo_vagon/metro.ts` (hojas de puerta como grupos con su hule) y `extra.ts` (escalera eléctrica,
  multitud, refugio con catres, huacales, garrafones, linternas, sirena en la columna, pared de reglas, extintor).
- Zombies con detalle (`zombi`): en la ventana del vagón son tarjetas detalladas en dos filas (el usuario rechazó la
  multitud simple de textura).

## Revisión §8.6c / §8.6d
- Nadie atraviesa puertas ni vidrios: los zombies quedan del otro lado del vidrio; mamá aparece en la ventana de la
  hoja de la puerta (no detrás de la junta).
- `revisar_parpadeo.py` en el video completo: lo marcado son personajes que corren y tiemblan; pisos, paredes,
  letreros y la pared de reglas salen limpios.

## Video final
- 2471 cuadros, 1080×1920, 82.4 s (`caricatura3d/salida/tren/tren.mp4`, no se sube a git).
- Audio: −14.0 LUFS, pico −2.3 dBFS.
- `portada.jpg` — portada para TikTok (composición `TrenPortada`): zombie pegado al vidrio de la puerta del vagón, con el título «DESPUÉS DE LA SIRENA, NADIE SUBE. NI TU MAMÁ».
