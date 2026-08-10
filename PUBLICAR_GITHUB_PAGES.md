# PUBLICACIÓN GITHUB PAGES — Cartera INFIHUILA v3.3.4

## Causa corregida
La aplicación v3.3.x no es un solo `index.html`. Necesita esta estructura EXACTA en la raíz del repositorio:

```text
Aplicativo-de-Cartera/
├── index.html
├── admin.html
├── .nojekyll
└── assets/
    ├── css/
    │   ├── tokens.css
    │   ├── global.css
    │   ├── login.css
    │   ├── admin.css
    │   ├── responsive.css
    │   └── print.css
    ├── img/
    │   ├── logo-infihuila-transparent.png
    │   ├── logo-infihuila.png
    │   └── logo-mark.png
    └── js/
        ├── login.js
        ├── admin.js
        ├── auth.js
        ├── auth-guard.js
        ├── firebase-config.js
        ├── firebase-init.js
        ├── firestore.js
        ├── formatters.js
        ├── imports.js
        ├── portfolio.js
        ├── reports.js
        └── utils.js
```

## MUY IMPORTANTE
No suba únicamente `index.html` y `admin.html`.

No suba la carpeta completa como:
`Aplicativo-de-Cartera/Frontend/assets/...`
si `index.html` está en la raíz.

Los HTML usan rutas:
- `./assets/css/...`
- `./assets/js/...`
- `./assets/img/...`

Por eso `assets` debe quedar al mismo nivel de `index.html`.

## Publicación desde VS Code + Git
Desde la carpeta local del repositorio:

```powershell
git status
git add index.html admin.html assets .nojekyll
git commit -m "Cartera INFIHUILA v3.3.4 - GitHub Pages production"
git push origin main
```

## Limpieza recomendada
Una vez confirme v3.3.4 funcional, retire del despliegue los archivos legacy que ya no use el nuevo frontend, por ejemplo:
- `login.html`
- `styles.css`
- `app.js`
- `js/` antiguo
- `data/` demo

No elimine archivos hasta verificar que no sean utilizados por otra rama o versión que quiera conservar.

## Firebase
En Firebase Authentication > Configuración > Dominios autorizados debe existir:
`casz56.github.io`

## Prueba
Abra:
`https://casz56.github.io/Aplicativo-de-Cartera/`

Luego haga Ctrl+F5.

Si faltan assets, v3.3.4 mostrará un diagnóstico de despliegue en lugar de una página HTML sin estilos.
