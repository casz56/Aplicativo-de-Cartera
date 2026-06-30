# Validación funcional – Versión 2.0

Reboot visual y estructural aplicado: header y filtros sin comportamiento sticky/fixed, navegación modular por layouts, panel de filtros desplegable, dashboard compacto, módulos agrupados y preservación funcional del Anexo 1 editable. Se validó sintaxis JavaScript con `node --check app.js`.

# Validación funcional – Versión 1.5

Se habilitó edición directa del Anexo 1, guardado local en navegador, agregado/eliminación de filas, descarte de cambios, navegación por tabulación y exportación del Excel actualizado con historial de edición.

# Validación funcional – Versión 1.4.1

Corrección del módulo Anexo 1: subpestañas internas operativas, renderizado de contenido, parsing desde Excel, resumen, filtros, validaciones y exportación funcional.

# Validación funcional – Versión 1.4

Actualización aplicada: módulo Anexo 1 con lectura de seis hojas del archivo `Anexo_1 febrero.xlsx`, demo precargada, vista tipo Excel, resumen KPI, filtros, validaciones, conciliación y borrado independiente.

# Validación funcional – Versión 1.3

Actualización aplicada: login institucional, módulo admin.html con script de administración local, botón de borrado total de información cargada, control de sesión y cache-busting v1.3.

# Validación funcional – Versión 1.2

Actualización aplicada para GitHub Pages: logo oficial incrustado en HTML, pestañas funcionales mediante controlador independiente, cache-busting de recursos y guardas frente a fallas de CDN.

# Validación de fuentes – Versión 1.1

Actualización funcional del aplicativo con logo oficial y pestañas operativas para despliegue en GitHub Pages.

# Validación de fuentes anexas

Fuentes revisadas del ZIP `proyecto erika.zip`:

| Archivo | Registros válidos | Validación principal |
|---|---:|---|
| ACREPC1.xlsx | 27 | Total pagado: $1.322.062.107; capital pagado: $1.079.961.387; interés corriente: $242.018.568 |
| ACREPC_DES1.xlsx | 5 | Monto desembolsado: $8.300.000.000; saldo capital fecha válida: $7.785.022.024 |
| ACRESC_C1.xlsx | 50 | Saldo capital: $40.568.358.965,5; saldo interés: $254.327.124; total: $40.822.686.089,5 |
| ACRESC_COC1.xlsx | 29 | Saldo capital: $40.568.358.965,5; mayor deudor: EPN E.S.P. 23,21%; top 5: ~64,07%; top 10: ~89,15% |
| ACRESC_EDAD1.xlsx | 50 | Capital al día: ~$39.934.932.463,5; capital >720 días: ~$613.635.002; saldo total: ~$41.449.389.115 |
| ACRESC_P1.xlsx | 50 | Capital: $40.568.358.965,5; interés corriente: ~$246.592.344; interés mora: ~$626.703.025; total: ~$41.449.389.114,5 |
| Datos indicadores de calidad.xlsx | 6 | Sectores: servicios públicos, territoriales, salud, otros, transporte y comercio, minero energético |
| Formato_5141 febrero.xlsx | 4 | Total cartera comercial: $39.849.318.098 |
| Resultados.xlsx | 73 | Capital por concepto: $39.849.318.098; capital vencido: ~$120.177.506; mora máxima: 1.598 días |

## Diferencia de conciliación

- Capital ACRESC: **$40.568.358.965,5**.
- Capital Resultados / Formato 514: **$39.849.318.098**.
- Diferencia: **$719.040.867,5**.

Posibles causas: diferencias de fecha de corte, depuración por fuente ERP, conceptos incluidos/excluidos, estructura regulatoria o clasificación de saldos.
