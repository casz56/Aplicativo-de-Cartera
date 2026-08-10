# Cartera INFIHUILA v3.3.5 — GitHub Pages Single-File

Esta edición elimina la dependencia de la carpeta `assets` durante el despliegue.

Publique en la fuente REAL configurada en GitHub Pages únicamente:
- `index.html`
- `admin.html`
- `.nojekyll`

Los CSS, JavaScript locales e imágenes INFIHUILA están embebidos dentro de ambos HTML.

## Verificación
Abra el código fuente de la página publicada y confirme que aparece:
`<meta name="cartera-build" content="3.3.5-single-file">`

Si no aparece, GitHub Pages está publicando otra rama o carpeta.
