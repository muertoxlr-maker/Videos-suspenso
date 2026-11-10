# Videos de suspenso — instrucciones para Claude

- **Antes de escribir guiones, diseñar escenas, personajes, cámara, subtítulos, voz o sonido, lee
  `GUIA_DE_ESTILO_SUSPENSO.md`.** Tiene las medidas de los videos de referencia y lo que ya está comprobado o
  pendiente. Si contradice a `tutorial-caricatura/` (cortes, subtítulos, ritmo de la voz, brillo), manda la guía.
- **Estándar visual aprobado: §8 de la guía** (prueba del pasillo v2, en `referencias/aprobado/` y
  `caricatura3d/src/videos/prueba_pasillo/`). Todo video nuevo parte de ese código y esos valores: se adaptan
  escenario y personajes a la historia, pero se mantienen proporciones, contorno, iluminación, color medido y forma de
  animar. Compara siempre con `referencias/aprobado/` y con las medidas antes de entregar.
- **Antes de entregar cualquier video, cumple la lista de §8.6c de la guía**: nada atraviesa paredes/puertas/vidrios
  (las puertas se abren), ningún objeto se mete en un personaje ni le tapa la boca, y nada parpadea
  (`herramientas/revisar_parpadeo.py` en clips de prueba antes del render largo y en el video final).
- La base técnica de caricatura (Three.js + Remotion) está en `caricatura3d/`; su origen y licencia, en
  `tutorial-caricatura/ORIGEN.md` y `tutorial-caricatura/LICENSE` (MIT: conserva los avisos de copyright).
- Las referencias son solo para el estilo: **nunca copies sus historias, frases, personajes ni tomas**. No subas a
  GitHub transcripciones, cuadros ni videos de terceros (`referencias_privadas/` está ignorada por git).
- El usuario es principiante y trabaja desde el celular: explica en español sencillo y pregunta antes de generar
  historias, voces o videos nuevos.
- En la nube, el render 3D va por software (`swangle`) y algunas escenas necesitan `--timeout` alto
  (ver `caricatura3d/LEEME.md`).
