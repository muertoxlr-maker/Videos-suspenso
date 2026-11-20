# Personajes 3D con aspecto de caricatura (Blender + MPFB2)

- `personaje3d.py`: arma una persona con la malla base de **MPFB2/MakeHuman** (licencia CC0,
  https://github.com/makehumancommunity/mpfb2; se clona en `/home/user/makehumancommunity/mpfb2`), aplica los ajustes
  de la receta (forma de cabeza, nariz, labios, orejas…), la pinta con sombreado de caricatura (pocos tonos planos,
  luz de lado), le pone contorno negro (casco invertido) y pinta con máscaras el pelo al rape, cejas, bigote fino,
  perilla y camiseta de tirantes. Sale un PNG transparente por ángulo, para girar la cabeza como en los videos de
  referencia y montarlo en Remotion.
- Requisitos instalados en la nube: `apt-get install blender libegl1 libegl-mesa0 libgl1-mesa-dri libgles2`.
- Uso: `blender -b --python herramientas/blender/personaje3d.py -- receta.json salida/prefijo -30,-15,0`
- Receta de CJ (prueba): `historias/16_cj_nacieras/cj3d.json`.
