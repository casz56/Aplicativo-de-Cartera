# Sistema de Gestión de Cartera INFIHUILA

## Novedades versión 2.0 – Reboot modular

- Reorganización completa de la experiencia visual en layouts independientes.
- Encabezado principal sin comportamiento fijo: al hacer scroll baja toda la pantalla.
- Panel izquierdo de filtros eliminado como elemento permanente; ahora funciona como panel desplegable.
- Nueva navegación principal compacta: Inicio, Carga y calidad, Cartera, Riesgo, Recaudos, Anexo 1, Cliente 360° y Reportes.
- Inicio ejecutivo con máximo 8 KPI, 3 alertas y tarjetas de acceso rápido.
- Módulo de Cartera agrupado con submódulos internos: Saldos, Concentración, Edad de cartera y Formato 514.
- Módulo de Recaudos agrupado con Pagos/Recaudos y Desembolsos.
- Anexo 1 conserva edición directa, guardado local, exportación y vista tipo Excel, pero en layout dedicado.
- Compatibilidad GitHub Pages con navegación por hash y cache-busting `v=2.0.0`.


## Novedades versión 1.5

- El módulo **Anexo 1** ahora permite **tabular información directamente en el aplicativo**.
- Se agregó **modo edición** para modificar celdas en la vista tipo Excel y registros en el Detalle cartera.
- Se incorporaron botones para **Guardar cambios**, **Agregar fila**, **Eliminar fila seleccionada** y **Descartar cambios**.
- Los cambios se guardan localmente en el navegador mediante `localStorage`, compatible con GitHub Pages.
- La exportación del Anexo 1 incluye la información editada y una hoja de **Historial edición**.
- Se mantiene el botón de borrado específico del Anexo 1 y el borrado general del aplicativo.

> Nota: por tratarse de una aplicación estática en GitHub Pages, el guardado es local al navegador del usuario. Para producción institucional se recomienda conectar esta capa con Firebase/Firestore o backend institucional.


## Novedades versión 1.4

- Se agregó **login institucional** (`login.html`) con estilo similar al Planeador Comercial.
- Se creó **admin.html** para gestión local de usuarios, roles, estados y restablecimiento de clave mediante `js/admin.js`.
- Se incorporó `js/auth.js` como capa de autenticación local para prototipo estático en GitHub Pages.
- Se agregó botón **Borrar datos cargados** para eliminar de la sesión todas las fuentes Excel procesadas.
- Se mantiene el logo oficial incrustado en el aplicativo y la navegación por pestañas compatible con GitHub Pages.

Credenciales demo:

- Admin: `admin@infihuila.gov.co` / `Infihuila2026*`
- Usuario: `carlos.sandoval@infihuila.gov.co` / `Infihuila2026*`

> Nota: la autenticación local es solo para prototipo estático. Para producción debe reemplazarse por Firebase Auth + Firestore o backend institucional.


## Novedades versión 1.2

- Se incrustó el **logo institucional oficial de INFIHUILA directamente en `index.html` como Base64**, por lo que GitHub Pages no depende de rutas externas para mostrarlo.
- Se agregó un **controlador independiente de pestañas** compatible con GitHub Pages, con navegación por hash y funcionamiento aun si una librería CDN tarda en cargar.
- Se adicionó cache-busting en `styles.css`, `app.js` y `demo-data.js` para evitar que GitHub Pages muestre versiones anteriores por caché.
- Se añadieron guardas para Chart.js y SheetJS, evitando que una falla de CDN bloquee la navegación principal del aplicativo.


Aplicativo web prototipo en **HTML5 + JavaScript + CSS** para manejo, seguimiento, validación y gestión integral de la cartera institucional del INFIHUILA.

## Novedades versión 1.1

- Se reemplazó la imagen de encabezado por el **logo oficial de INFIHUILA** cargado en las fuentes del proyecto.
- Se corrigió y activó la **funcionalidad real de las pestañas** del módulo principal, permitiendo navegación completa entre Dashboard, Validación, Saldos, Pagos y Recaudos, Desembolsos, Riesgo y Provisión, Edad de Cartera, Concentración, Formato 514 y Detalle por Cliente.
- Se dejó la navegación preparada para GitHub Pages, incluyendo soporte por hash en la URL (por ejemplo: `#dashboard`, `#concentracion`, `#formato514`).

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
├── login.html
├── admin.html
├── styles.css
├── app.js
├── assets/
│   ├── logo-infihuila-oficial-v12.png
│   ├── logo-infihuila-oficial.png
│   ├── logo-infihuila.svg
│   └── icons/
├── data/
│   └── demo-data.json
└── js/
    ├── auth.js
    ├── admin.js
    └── demo-data.js
```

## Librerías CDN utilizadas

- SheetJS para leer y exportar Excel.
- Chart.js para gráficos interactivos.
- html2canvas y jsPDF para exportación PDF.

## Nota técnica

El prototipo funciona sin backend y está preparado para evolucionar a una versión con autenticación, roles, base de datos, trazabilidad y API.

## Despliegue recomendado en GitHub Pages

Suba el contenido de la carpeta `cartera_infihuila_app/` al root del repositorio o a la rama/carpeta configurada para Pages. La versión 1.2 no requiere ruta de imagen para el logo del encabezado porque está incrustado en el HTML.

## Módulo Anexo 1

El módulo Anexo 1 trabaja con el libro `Anexo_1 febrero.xlsx`, conserva las hojas originales y permite navegar su contenido como grilla tipo Excel o como vista estructurada. Las cifras se muestran en millones de pesos, conforme a las instrucciones del archivo.

## Corrección versión 1.4.1

- Se corrigió el módulo **Anexo 1**: ahora las subpestañas internas funcionan correctamente.
- Se implementaron las funciones faltantes de renderizado, parsing, resumen, validaciones, filtros y exportación del Anexo 1.
- Se corrigió la visualización cuando se carga `Anexo_1 febrero.xlsx`, mostrando información real en vista estructurada y vista tipo Excel.
- Se actualizó el cache-busting a `v=1.4.1` para evitar que GitHub Pages conserve archivos anteriores.
