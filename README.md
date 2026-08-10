# Cartera INFIHUILA v3.3.3

Frontend institucional del aplicativo de Cartera, diseñado como producto hermano del Planeador Comercial INFIHUILA.

## Arquitectura

- `index.html`: login institucional con Firebase Authentication.
- `admin.html`: workspace autenticado tipo SPA ligera.
- Firebase project: `cartera-infi`.
- Cloud Firestore: base `(default)`.
- Compatible con plan Firebase Spark: no usa Cloud Functions ni Firebase Storage.
- Pruebas locales: Visual Studio Code + Live Server.
- Despliegue: GitHub Pages con rutas relativas.

## Estructura

```text
/
├── index.html
├── admin.html
├── assets/
│   ├── css/
│   │   ├── tokens.css
│   │   ├── global.css
│   │   ├── login.css
│   │   ├── admin.css
│   │   ├── responsive.css
│   │   └── print.css
│   ├── js/
│   │   ├── firebase-config.js
│   │   ├── firebase-init.js
│   │   ├── auth.js
│   │   ├── auth-guard.js
│   │   ├── firestore.js
│   │   ├── imports.js
│   │   ├── portfolio.js
│   │   ├── reports.js
│   │   ├── formatters.js
│   │   ├── utils.js
│   │   ├── login.js
│   │   └── admin.js
│   └── img/logo-infihuila.png
├── firebase/
│   ├── firestore.rules
│   └── firestore.indexes.json
├── CHANGELOG.md
└── QA_V3_3.md
```

## Ejecución en Visual Studio Code

1. Descomprima el paquete.
2. Abra la carpeta completa en VS Code.
3. Abra `index.html`.
4. Clic derecho → **Open with Live Server**.
5. La URL debe verse similar a `http://127.0.0.1:5500/index.html`.
6. Inicie sesión con una cuenta institucional ya creada en Firebase Authentication.

No necesita `node`, `npm` ni archivos `.bat` para ejecutar el frontend.

## Flujo de seguridad

`index.html` realiza:

1. `signInWithEmailAndPassword()`.
2. Verificación de dominio `@infihuila.gov.co`.
3. Verificación de `emailVerified`.
4. Lectura de `Usuarios/{uid}`.
5. Validación de `isActive` y rol.
6. Redirección a `./admin.html`.

`admin.html` vuelve a ejecutar un Auth Guard antes de mostrar el workspace. La seguridad definitiva continúa en Firestore Security Rules.

## Roles soportados

- `admin`
- `asesor_gerencia`
- `jefe_cartera`
- `analista_cartera`
- `auditor`
- `consulta`

## Backend existente

La interfaz utiliza las colecciones ya preparadas:

- `Usuarios`
- `Config`
- `Vigencias`
- `CarteraCycles`
- `ImportJobs`
- `CarteraChunks`
- `CarteraAggregates`
- `CarteraValidations`
- `AuditLogs`

## Carga Excel

Desde **Cortes e importaciones**:

1. Crear un corte en borrador.
2. Seleccionar la fuente.
3. Elegir Excel/CSV.
4. Analizar localmente.
5. Calcular SHA-256.
6. Generar vista previa.
7. Guardar `ImportJob` y chunks en Firestore.
8. Validar fuentes.
9. Publicar cuando todas las fuentes requeridas estén presentes.

El archivo original no se sube a Firebase Storage.

## Dashboard sin datos simulados

El dashboard solo muestra valores financieros cuando existe un corte publicado y la fuente `ACRESC_P1` contiene campos reconocibles de cartera. Si no hay información real, se presentan estados vacíos; no se crean cifras demo.

## Informes

- Resumen ejecutivo a Excel.
- Resumen ejecutivo a PDF mediante impresión del navegador.
- Detalle de cartera a Excel.

Las exportaciones usan el corte publicado y los filtros activos del detalle.

## GitHub Pages

Todos los enlaces son relativos (`./admin.html`, `./assets/...`). Antes de publicar, asegúrese de que `casz56.github.io` permanezca en los dominios autorizados de Firebase Authentication.

## Importante

`assets/js/firebase-config.js` contiene únicamente la configuración pública de la app web Firebase. Nunca agregue archivos de cuenta de servicio, claves privadas, contraseñas o credenciales de Admin SDK al repositorio.
