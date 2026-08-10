# Instalación y ejecución — Cartera INFIHUILA v3.3.3

1. Haga copia de seguridad de la carpeta `Frontend` actual.
2. Reemplace `index.html`, `admin.html` y la carpeta `assets` por los archivos de v3.3.3.
3. Abra la carpeta raíz `Cartera Infi` en Visual Studio Code.
4. Abra `Frontend/index.html`.
5. Clic derecho → **Open with Live Server**.
6. La URL debe iniciar con `http://127.0.0.1:` o `http://localhost:`; nunca con `file://`.
7. Inicie sesión con una cuenta institucional de Firebase ya verificada.
8. `admin.html` debe abrirse automáticamente después de validar el perfil y los permisos.

No necesita Node.js ni npm para ejecutar el frontend.

## Archivos principales
- `index.html`: login institucional.
- `admin.html`: workspace protegido.
- `assets/css/`: design system y estilos.
- `assets/js/`: Firebase, autenticación, Firestore, cartera e importaciones.
- `assets/img/logo-infihuila-transparent.png`: logo sin fondo para login/loaders.
- `assets/img/logo-mark.png`: isotipo para sidebar.
