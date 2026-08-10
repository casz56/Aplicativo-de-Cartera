# Auditoría visual — Cartera INFIHUILA v3.3.2

## Objetivo
Elevar el frontend al mismo lenguaje visual del Planeador Comercial INFIHUILA, reduciendo ruido, sobreexposición cromática y proporciones impropias de una interfaz financiera institucional.

## Correcciones ejecutadas

### Login
- Reducción de escala del bloque institucional para mejorar equilibrio con el formulario.
- Logo institucional con fondo transparente para eliminar el rectángulo visual del archivo original.
- Título, subtítulo y badge recalibrados para una jerarquía más ejecutiva.
- Inputs, botones, notas y estados de foco homogeneizados.
- Uso más controlado del verde lima; queda como acento y no como superficie dominante.
- Tarjeta general con sombra más fina y radios más cercanos al Planeador Comercial.

### Pantallas de carga
- Loader y Auth Guard compactados.
- Logo reducido y sin bloque de fondo visible.
- Spinner más fino y menor peso visual.
- Mensajes de seguridad con jerarquía contenida.

### Sidebar
- Nuevo recurso `logo-mark.png` para usar únicamente el isotipo en navegación.
- Ancho reducido para acercarse a las proporciones del Planeador Comercial.
- Navegación más compacta, mejor ritmo vertical y badges menos invasivos.
- Perfil inferior más compacto.
- Corrección del modo colapsado manteniendo disponible el control para volver a expandir.

### Topbar
- Altura, gaps y controles reducidos.
- Selector de vigencia con ancho estable para evitar la vista de “solo flecha”.
- Indicador de sincronización con colores semánticos de baja saturación.
- Mejor balance entre breadcrumb, buscador y acciones.
- Único CTA lima principal en la barra superior para evitar competencia cromática.

### Subnavegación
- Altura y tipografía refinadas.
- Estado activo con fondo institucional suave y subrayado fino.
- Menor peso visual de tabs inactivos.

### Contenido, cards y empty states
- Cards con radios, bordes y sombras más discretos.
- Reducción de espacios muertos.
- Empty states más compactos y ejecutivos.
- Tablas con densidad financiera, encabezados sobrios y mejor legibilidad.
- KPI cards reducidas para mejorar densidad gerencial.

### Colores
- Semántica de riesgo, warning y error desaturada.
- Eliminación de naranjas intensos hardcodeados en gráficas; ahora se usan tokens semánticos.
- Verde lima reservado para acciones de mayor prioridad.

### Responsive
- Ajustes específicos para 1366, 1440, 1600 y 1920 px.
- Conservación de 4 KPIs y grids ejecutivos mientras haya espacio real.
- Cambio a layouts de 2 columnas/1 columna únicamente cuando el viewport lo exige.

## Resultado esperado
La interfaz debe percibirse como un producto del mismo ecosistema del Planeador Comercial: sobrio, institucional, financiero, compacto, consistente y sin elementos visualmente improvisados.
