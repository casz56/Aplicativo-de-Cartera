# Cartera INFIHUILA v3.4.0 — Editor Operativo

La versión incorpora edición directa para `analista_cartera` (visible como **Profesional de Cartera**), `jefe_cartera` y `admin`.

## Funciones
- edición tabular de filas y celdas;
- agregar filas y columnas;
- eliminación/restauración trazable;
- carga masiva de hojas de cálculo y archivos tabulados;
- selector de pestaña/hoja del libro;
- acceso al editor desde Cartera, Clientes, Recaudos, Riesgo, Vencimientos y Datos;
- auditoría en Firestore;
- compatibilidad con Firebase Spark.

## Integridad
Los cortes publicados permanecen inmutables. La edición se realiza sobre un corte `draft`.

Los cambios sobre datos importados se guardan en `CarteraRowEdits`.
Las filas ingresadas directamente se guardan en `CarteraManualRows`.
El dato importado original permanece disponible para trazabilidad.

## Formatos de carga
XLSX, XLSM, XLSB, XLS, CSV, TSV/TXT, ODS, FODS, XML SpreadsheetML, SLK/SYLK, DIF, PRN y DBF, además de otros formatos que SheetJS pueda detectar.
