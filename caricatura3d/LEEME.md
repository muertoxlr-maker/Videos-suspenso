# Caricatura 3D: personajes 2D en escenarios 3D

Personajes planos de caricatura (como recortes de papel) dentro de escenarios en 3D con luces,
niebla y movimiento de cámara. Hecho con **Three.js** (el 3D), **React Three Fiber** (Three.js
dentro de React) y **Remotion** (convierte todo en vídeo).

## Base del tutorial (Alejandro Magno)

La base de caricatura viene del tutorial **«Cómo hacer shorts animados virales con Claude»** de Crea con LuisPa
(basado en *claude-animated-shorts* de Mr omi, licencia MIT). La copia original intacta, con su `LICENSE`,
`SKILL.md` y la `BIBLIA_DE_ESTILO.md`, está en `../tutorial-caricatura/` (lee `ORIGEN.md` ahí).

La plantilla de Alejandro funciona aquí en `src/videos/alejandro/` (composición `Alejandro`, 9.8 s):

```bash
npm run alejandro:foto   # cuadro 20 → salida/alejandro_f020.png (sin audio)
```

La voz original (`public/voz/voz2_final.wav`) no viene en el tutorial, por eso la foto se saca con `mute`.

## Uso

Necesitas **Node.js 18 o más nuevo**.

```bash
cd caricatura3d
npm install            # solo la primera vez
npm run prueba         # un fotograma de prueba → salida/prueba.png
npm run video          # el vídeo de la plantilla (5 s) → salida/plantilla.mp4
npm run estudio        # editor visual en el navegador (en tu ordenador)
```

## Sin tarjeta gráfica

El 3D se dibuja por software (`swangle`), así funciona también en la nube, aunque más lento
(unos 17 s por cada segundo de vídeo con 4 núcleos). Con GPU puedes acelerar:

```bash
REMOTION_GL=angle npm run video
```

Si Remotion no puede descargar su navegador, usa el de Playwright (`/opt/pw-browsers`) o el que
indiques con `REMOTION_CHROME=/ruta/al/chrome-headless-shell`.

## Archivos

```
src/
  Plantilla.tsx               ← la escena de prueba: cámara, escenario, personajes y textos
  escenarios/Pasillo.tsx      ← pasillo de hotel en 3D (paredes, puertas, lámparas, niebla)
  personajes/Personaje2D.tsx  ← coloca un personaje plano dentro del 3D y lo anima
  personajes/dibujarPersonaje.ts ← dibuja al personaje (cara, ojos, boca, expresiones)
remotion.config.ts            ← render por software y búsqueda del navegador
```
