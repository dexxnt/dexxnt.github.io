# Diseño: GIF de Lain en la home

## Objetivo

Ocupar el espacio libre entre las tarjetas principales y `Filesystem` con el
GIF «REAL me?» adaptado a la estética azul del portafolio.

## Implementación

- El GIF original se redimensiona a 640 × 360 y conserva sus 82 fotogramas.
- Una paleta fija transforma el magenta en los tonos `#020617`, `#1e3a8a`,
  `#3b82f6`, `#7dd3fc` y `#dbeafe` del sitio.
- La paleta compartida evita cambios de color entre fotogramas y reduce el peso
  del archivo sin alterar la animación.
- La imagen usa `object-fit: cover` y una proporción horizontal dependiente del
  alto disponible para aprovechar el espacio sin cortar la cara ni el texto.
- Una máscara radial desvanece los cuatro bordes y `mix-blend-mode: screen`
  integra los tonos oscuros en el fondo, como una señal proyectada por el CRT.
- La opacidad, el brillo y la saturación están reducidos para que la animación
  acompañe al contenido sin competir con las acciones principales.
- En móvil usa una composición más horizontal de 120 px de alto: muestra más
  señal en el centro, reduce el espacio vacío y no provoca desbordamiento.
- En móvil se desactiva la viñeta interior porque atravesaba los paneles
  transparentes; el marco exterior y las scanlines mantienen el efecto CRT.

## Accesibilidad y rendimiento

- Es una pieza decorativa con `aria-hidden="true"` y texto alternativo vacío.
- Si `prefers-reduced-motion` está activo, `<picture>` carga un PNG estático en
  lugar del GIF.
- El recurso final pesa aproximadamente 4 MB, frente a los 23 MB del original.
