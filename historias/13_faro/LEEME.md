# «El faro»

- `GUION.md` — guion aprobado (zombies). Acción desde el segundo 0, en orden y sin adelantos: corres por el muelle San
  Telmo, saltas a la lancha de don Chema, el motor no arranca, una mano sale del agua y él le da con el remo; navegan
  hasta la isla, una ola los avienta contra las rocas y Elías, el farero, los mete a la torre y atranca la puerta. En la
  pared hay tres reglas. A medianoche oyes nadar, la lámpara parpadea y se apaga, y en la oscuridad cuentas cuatro: junto
  a ti hay alguien chorreando. Final con dos botones: VERLE LA CARA / NO DECIR NADA.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 78.50 s) y `palabras.json`.
- `sfx/` — efectos cortos (`pedidos.json`); `mezcla.py` → `audio/mezcla.wav`: cada efecto solo en su palabra, los de
  la acción más fuertes, dron y latidos solo al final (guía §5). −14 LUFS.
- Animación: `caricatura3d/src/videos/faro/` (composición `Faro`, 2355 cuadros, acabado §8.9): muelle con bodegas y
  lanchas, lancha «La Gaviota» con motor fuera de borda, isla con rocas, casita y torre con escalera de caracol,
  puerta que se abre hacia adentro con tranca, reglas en la pared curva y cuarto de la lámpara con vidrios y lente.
- Zombies con detalle (`zombi`); el ahogado usa `mojado`.

## Revisión §8.6c / §8.6d
- La puerta del faro se abre antes de que entren; nadie atraviesa paredes, vidrios ni el pretil.
- `revisar_parpadeo.py` en el video completo: lo marcado son personajes que corren y la lancha y la cámara en
  movimiento; las escenas quietas (torre, cuarto de la lámpara) salen limpias, solo marcan los ojos al parpadear.

## Video final
- 2355 cuadros, 1080×1920, 78.5 s (`caricatura3d/salida/faro/faro.mp4`, no se sube a git).
- Audio: −14.1 LUFS, pico −2.3 dBFS.
