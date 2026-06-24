# Sistema de Gestión de Cartera INFIHUILA

Aplicativo web prototipo en **HTML5 + JavaScript + CSS** para manejo, seguimiento, validación y gestión integral de la cartera institucional del INFIHUILA.

## Cómo usar

1. Abra `index.html` en un navegador moderno.
2. El sistema inicia con datos demo extraídos y validados de las fuentes anexas del ZIP `proyecto erika.zip`.
3. Para actualizar información, use el botón **Cargar Excel** o arrastre los archivos al panel lateral.
4. Aplique filtros globales por cliente, línea, calificación, mora, monto o sector.
5. Revise el módulo **Carga y Validación** para conciliación entre fuentes.
6. Use **Exportar Excel** para descargar tablas y validaciones, o **Exportar PDF** para exportar el dashboard ejecutivo.

## Archivos reconocidos

- `ACREPC1.xlsx`: pagos y recaudos.
- `ACREPC_DES1.xlsx`: desembolsos.
- `ACRESC_C1.xlsx`: calificación y provisión.
- `ACRESC_COC1.xlsx`: concentración por deudor.
- `ACRESC_EDAD1.xlsx`: edad de cartera y mora.
- `ACRESC_P1.xlsx`: saldos de cartera.
- `Datos indicadores de calidad.xlsx`: indicadores por sector.
- `Formato_5141 febrero.xlsx`: reporte regulatorio Formato 514 SFC.
- `Resultados.xlsx`: consolidado por pagaré, cliente, concepto y calificación.

## Validaciones incluidas

- Capital ACRESC saldos vs calificación y concentración.
- Capital ACRESC vs Resultados.xlsx.
- Capital ACRESC vs Formato 514.
- Detección de duplicados por pagaré + concepto.
- Clientes o NIT incompletos.
- Cartera crítica por calificación E/K o mora superior a 720 días.
- Concentración individual máxima.

## Alerta de conciliación detectada

El aplicativo deja visible una diferencia aproximada de **$719.040.867,5** entre las fuentes ACRESC y las fuentes `Resultados.xlsx` / `Formato_5141 febrero.xlsx`:

- ACRESC_C1 / ACRESC_COC1 / ACRESC_EDAD1 / ACRESC_P1: capital aproximado de **$40.568.358.965,5**.
- Resultados.xlsx / Formato_5141 febrero.xlsx: capital de **$39.849.318.098**.

Esta diferencia se muestra como advertencia de conciliación y no se oculta.

## Estructura

```text
cartera_infihuila_app/
├── index.html
├── styles.css
├── app.js
├── assets/
│   ├── logo-infihuila.svg
│   └── icons/
├── data/
│   └── demo-data.json
└── js/
    └── demo-data.js
```

## Librerías CDN utilizadas

- SheetJS para leer y exportar Excel.
- Chart.js para gráficos interactivos.
- html2canvas y jsPDF para exportación PDF.

## Nota técnica

El prototipo funciona sin backend y está preparado para evolucionar a una versión con autenticación, roles, base de datos, trazabilidad y API.
