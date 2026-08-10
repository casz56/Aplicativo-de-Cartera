# Cartera INFIHUILA v3.4.1 — Eliminar cortes de trabajo

## Nueva función
Los usuarios con rol `admin` o `jefe_cartera` pueden eliminar cortes en estado **Borrador**.

La acción está disponible:
- en la tarjeta **Corte en trabajo**;
- en la columna **Acciones** del **Historial de cortes**.

## Seguridad
- Los cortes `published` están protegidos y no pueden eliminarse.
- Se exige escribir `ELIMINAR` antes de confirmar.
- La aplicación elimina primero los documentos dependientes y el corte al final.
- `AuditLogs` NO se borra: permanece un evento `DRAFT_CYCLE_DELETED`.

## Limpieza asociada
Al eliminar un borrador se limpian:
- `CarteraChunks`
- `ImportJobs`
- `CarteraRowEdits`
- `CarteraManualRows`
- `Anexo1Overrides`
- `CarteraAggregates`
- `CarteraValidations`
- `CarteraCycles/{cycleId}`

## Roles
- `admin`: puede eliminar borradores.
- `jefe_cartera`: puede eliminar borradores.
- `analista_cartera` / Profesional de Cartera: puede editar y cargar información, pero no eliminar un corte completo.
