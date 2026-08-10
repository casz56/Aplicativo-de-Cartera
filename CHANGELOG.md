# CHANGELOG

## 3.3.3 — 2026-08-10 — Premium UI refinement

### Diseño y experiencia
- Refactor visual completo de login y workspace.
- Design system refinado con menor saturación, sombras más finas y radios más consistentes.
- Login recalibrado contra las proporciones del Planeador Comercial.
- Nuevo logo institucional transparente para evitar fondos rectangulares visibles.
- Nuevo isotipo `logo-mark.png` dedicado al sidebar.
- Loader y Auth Guard compactados para una transición más profesional.
- Sidebar reducido y refinado; navegación, badges y perfil con menor ruido visual.
- Topbar compactada; selector de vigencia estabilizado y estado de sincronización suavizado.
- Subnav, cards, KPI, tablas, modales, dropdowns y empty states unificados.
- Reducción de espacios muertos en “Cortes e importaciones”.
- Uso controlado del verde lima como CTA de mayor prioridad.
- Colores de warning/riesgo trasladados a tokens semánticos de baja saturación.
- Responsive ajustado para conservar densidad ejecutiva en escritorio.

### Funcionalidad conservada
- Firebase Authentication y Auth Guard.
- Roles y perfiles de Firestore.
- Vigencias, cortes e importaciones.
- SHA-256 y chunks.
- Reportes Excel/PDF.
- Compatibilidad Firebase Spark.
- Ejecución con Visual Studio Code + Live Server.

## 3.3.1 — 2026-08-10 — Corrección de arranque
- Detecta apertura accidental mediante `file://`.
- Evita loaders infinitos en `index.html` y `admin.html`.
- Añade diagnóstico visible de arranque.
- Refuerza `auth-guard.js` con timeout y manejo de error.
- Configura Visual Studio Code + Live Server.


## v3.3.3 — Corrección de sincronización Firebase / Firestore
- Lectura server-first de `Vigencias` para evitar falsos negativos por caché local.
- Consulta explícita `isActive == true`.
- Fallback directo a `Vigencias/{año actual}`.
- Normalización defensiva del flag `isActive`.
- Health-check de `Config/app`, `Usuarios/{uid}` y vigencias activas.
- Botón premium **Reintentar sincronización**.
- Reconexión automática al recuperar internet.
- Estado de sincronización superior conectado al resultado real del backend.
- Mensajes de diagnóstico más precisos sin bloquear la navegación.
