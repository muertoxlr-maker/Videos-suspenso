# «La ambulancia»

- `GUION.md` — guion aprobado (zombies). Gancho con acción desde el segundo 0, en orden y sin adelantos: manejas una
  ambulancia con tu hermanito Beto atrás, los zombies golpean los costados, uno se trepa al cofre, otro rompe la
  ventana; llegas al mercado, suben por una escalera a la azotea, tres reglas pintadas en la pared, y a media noche
  Beto tiene fiebre. Final con dos botones: DECIRLE / ESCONDERLO.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 74.91 s) y `palabras.json`.
- `sfx/` — efectos cortos (`pedidos.json`): motor, gruñidos, golpes en la lámina, cuerpo en el cofre, frenazo, caída,
  vidrio, acelerón, escalera, patada, escalera que suben, uñas en la pared, linterna y pasos.
- `mezcla.py` → `audio/mezcla.wav` — cada efecto solo en su palabra; los de la acción del inicio van 4 dB más fuertes
  que los demás; dron y latidos solo al final (guía §5). −14 LUFS.
- Animación: `caricatura3d/src/videos/ambulancia/` (composición `Ambulancia`, 2248 cuadros). Acabado §8.9.
  Escenario en `ambulancia.ts`: avenida que corre (edificios, postes, coches abandonados, uno ardiendo), ambulancia
  por fuera (torreta, letreros, faros, puertas de atrás con ventanas) y por dentro (camilla, banca, gabinete, tanque
  de oxígeno, tablero y volante), mercado con letrero, cortinas y marquesina, escalera de aluminio, y azotea con
  pretil, cuarto con la pared de reglas, tinaco, tanque de gas, tendedero, lona con catres, catre con cuerdas,
  huacales, garrafones, linternas y cobija.
- Zombies con detalle (`zombi` en `prueba_pasillo/personaje.ts`, pedido del usuario): piel gris con manchas, cicatriz
  cosida, grieta, cuencas hundidas, párpado de enojo, dientes en pico, ropa rota con jirones, manchas y parches.

## Revisión §8.6c / §8.6d
- Nadie atraviesa paredes ni vidrios: el zombie de la ventana queda afuera (el vidrio se rompe), el del cofre sube por
  el frente; la cobija nunca llega a la boca de Beto; el volante va bajo y no tapa la boca.
- Beto se recarga en ti inclinando toda su tarjeta (antes se corría el dibujo y la cabeza quedaba cortada en línea
  recta; lo vio el usuario). Se rehicieron solo los tramos 1500–2247.
- La torreta alterna rojo y azul con una onda suave (no estroboscópica).
- `revisar_parpadeo.py` en el video (primero en los 50 s iniciales, luego completo): lo marcado es movimiento buscado
  (la avenida que corre, sacudidas de la ambulancia, ojos y manos que tiemblan); nada en tomas quietas.

## Video final
- 2248 cuadros, 1080×1920, 74.9 s (`caricatura3d/salida/ambulancia/ambulancia.mp4`, no se sube a git).
- Audio: −14.1 LUFS, pico −2.3 dBFS.
