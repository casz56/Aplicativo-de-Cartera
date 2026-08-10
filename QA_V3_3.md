# QA Cartera INFIHUILA v3.3.2

| Componente | Prueba | Resultado esperado | Estado técnico |
|---|---|---|---|
| Archivos | Existen `index.html` y `admin.html` en raíz | Ambos disponibles | PASS |
| Rutas | Enlaces y assets relativos | Compatible Live Server/GitHub Pages | PASS |
| JS | Validación sintáctica de módulos | Sin errores de sintaxis | PASS |
| Login | Firebase Email/Password | Usa Authentication real | PASS - implementación |
| Login | Dominio institucional | Rechaza dominios distintos | PASS - implementación |
| Login | Correo no verificado | Impide acceso y permite reenvío | PASS - implementación |
| Login | Reset password | Ejecuta Firebase reset | PASS - implementación |
| Admin | Auth Guard | Redirige a login sin sesión válida | PASS - implementación |
| Roles | UI por rol | Oculta gestión/admin cuando no corresponde | PASS - implementación |
| Firestore | Usuarios list | Query limitada a 200 | PASS |
| Firestore | Chunks | Query limitada a 200 y por `jobId` | PASS |
| Dashboard | Sin corte publicado | Empty state, no `$0` ficticio | PASS |
| Dashboard | Con corte | Lee fuente real y detecta campos | PASS - implementación |
| Importación | SHA-256 | Web Crypto | PASS - implementación |
| Importación | Chunking | Máx. 250 filas / objetivo ~620 KB | PASS - implementación |
| Publicación | Validación fuentes | Exige todas las `sourceTypes` | PASS - implementación |
| Reporte | Excel detalle | Generación SheetJS | PASS - implementación |
| Reporte | PDF | Vista ejecutiva + impresión navegador | PASS - implementación |
| Responsive | 1366×768+ | Sidebar/topbar adaptables | PASS - CSS |
| Datos demo | Búsqueda | No existen cifras hardcodeadas | PASS |

## Pruebas de aceptación que deben realizarse con Firebase real

1. Login con el administrador verificado.
2. Logout y redirección.
3. Login con contraseña errada.
4. Reset password.
5. Crear un corte de prueba/borrador con fecha real.
6. Importar cada fuente oficial.
7. Verificar documentos creados en Firestore.
8. Validar y publicar el corte.
9. Confirmar que el dashboard use el corte publicado.
10. Probar Excel/PDF con los datos oficiales.
11. Publicar en GitHub Pages y repetir login desde el dominio público.
