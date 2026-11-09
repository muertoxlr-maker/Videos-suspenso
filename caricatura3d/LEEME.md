# Caricatura 3D: personajes 2D en escenarios 3D

Personajes planos de caricatura (como recortes de papel) dentro de escenarios en 3D con luces,
niebla y movimiento de cámara. Hecho con **Three.js** (el 3D), **React Three Fiber** (Three.js
dentro de React) y **Remotion** (convierte todo en vídeo).

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
