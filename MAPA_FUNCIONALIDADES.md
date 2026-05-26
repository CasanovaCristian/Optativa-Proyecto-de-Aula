# 🗺️ Mapa de Funcionalidades — SportDeal FET

> **¿Cómo usar este archivo?**
> Cada funcionalidad tiene una etiqueta en corchetes, p. ej. `[CARGAR PRODUCTOS]`.
> Esa misma etiqueta está como comentario dentro del código fuente.
> Busca con **Ctrl + F** la etiqueta → te lleva directo a la función.

---

## 📂 Estructura General del Proyecto

```
Proyecto de Aula/
├── Frontend/
│   ├── js/
│   │   ├── api.js              ← Capa de comunicación (REST + sesión + carrito)
│   │   ├── index.js            ← Catálogo público de implementos
│   │   ├── producto.js         ← Detalle de un implemento y agregar al carrito
│   │   ├── carrito.js          ← Vista del carrito y checkout (crear préstamos)
│   │   ├── dashboard-main.js   ← Orquestador del panel de administración
│   │   ├── inventario.js       ← CRUD de implementos (admin)
│   │   ├── usuarios.js         ← CRUD de usuarios (admin)
│   │   ├── prestamos.js        ← Gestión de préstamos (admin)
│   │   ├── reportes.js         ← Estadísticas y reportes (admin)
│   │   └── ui-utils.js         ← Utilidades: sidebar, modal, fechas, iniciales
│   ├── index.html              ← Catálogo público (página de inicio)
│   ├── login.html              ← Inicio de sesión
│   ├── register.html           ← Registro de nuevo cliente
│   ├── producto.html           ← Detalle del implemento
│   ├── carrito.html            ← Carrito de renta
│   ├── dashboard.html          ← Panel principal del administrador
│   ├── implementos.html        ← Inventario (admin)
│   ├── usuarios.html           ← Gestión de usuarios (admin)
│   ├── prestamos.html          ← Gestión de préstamos (admin)
│   └── reportes.html           ← Reportes (admin)
│
└── Backend/  (Spring Boot — puerto 8080)
    └── src/main/java/com/backend/optativa_backend/
        ├── controllers/        ← Endpoints REST (reciben peticiones HTTP)
        │   ├── UsuarioController.java
        │   ├── ImplementoController.java
        │   └── PrestamoController.java
        ├── services/           ← Lógica de negocio
        │   ├── UsuarioService.java
        │   ├── ImplementoService.java
        │   └── PrestamoService.java
        ├── entities/           ← Modelos de base de datos (JPA)
        ├── dtos/               ← Objetos de transferencia de datos
        └── repositories/       ← Acceso a base de datos (JpaRepository)
```

---

## 🔐 AUTENTICACIÓN Y SESIÓN

| Etiqueta para buscar | Archivo | Qué hace |
|---|---|---|
| `[AUTENTICACIÓN - INICIAR SESIÓN]` | `Frontend/js/api.js` | `authAPI.login()` — llama a `POST /api/usuarios/login`, guarda el usuario en localStorage |
| `[AUTENTICACIÓN - REGISTRAR USUARIO]` | `Frontend/js/api.js` | `authAPI.register()` — llama a `POST /api/usuarios/registro`, guarda sesión automáticamente |
| `[AUTENTICACIÓN - CERRAR SESIÓN]` | `Frontend/js/api.js` | `authAPI.logout()` — limpia localStorage y redirige a `login.html` |
| `[AUTENTICACIÓN - VERIFICAR SESIÓN]` | `Frontend/js/api.js` | `requerirAuth()` — si no hay sesión, redirige a `login.html` |
| `[AUTENTICACIÓN - VERIFICAR ROL ADMIN]` | `Frontend/js/api.js` | `requerirAdmin()` — si no es ADMIN, redirige a `403.html` |
| `[AUTENTICACIÓN - VERIFICAR ROL CLIENTE]` | `Frontend/js/api.js` | `requerirCliente()` — si no es CLIENTE, redirige a `403.html` |
| `[CERRAR SESIÓN - BOTÓN LOGOUT]` | `Frontend/js/api.js` | `conectarLogout()` — conecta todos los botones `.btn-salir` con logout |
| `[GESTIÓN DE SESIÓN]` | `Frontend/js/api.js` | Objeto `sesion` — helpers para leer/guardar/limpiar usuario en localStorage |

**Backend:**
| Archivo | Método HTTP | Endpoint | Qué hace |
|---|---|---|---|
| `UsuarioController.java` línea 23 | `POST` | `/api/usuarios/login` | Valida email + password, devuelve el usuario |
| `UsuarioController.java` línea 33 | `POST` | `/api/usuarios/registro` | Crea usuario, previene duplicados de email |
| `UsuarioService.java` línea 20 | — | — | Lógica de login (compara password y verifica `activo = true`) |
| `UsuarioService.java` línea 26 | — | — | Lógica de registro (verifica email duplicado, asigna rol) |

---

## 👤 USUARIOS (CRUD)

| Etiqueta para buscar | Archivo | Qué hace |
|---|---|---|
| `[USUARIOS - INICIALIZAR MÓDULO ADMIN]` | `Frontend/js/usuarios.js` | `initUsuarios()` — carga la tabla de usuarios en el panel admin |
| `[USUARIOS - CARGAR DATOS DEL SERVIDOR]` | `Frontend/js/usuarios.js` | Función `cargar()` dentro de `initUsuarios` — trae todos los usuarios y préstamos |
| `[USUARIOS - RENDERIZAR TABLA]` | `Frontend/js/usuarios.js` | Función `render()` — pinta la tabla con nombre, email, rol, estado, préstamos |
| `[USUARIOS - MODAL CREAR/EDITAR]` | `Frontend/js/usuarios.js` | `abrirModalUsuario()` — abre un modal para crear un usuario nuevo o editar uno existente |
| `[USUARIOS - API REST]` | `Frontend/js/api.js` | Objeto `usuariosAPI` — métodos: `obtenerTodos`, `crear`, `actualizar`, `eliminar`, `obtenerPorRol` |

**Backend:**
| Archivo | Método HTTP | Endpoint | Qué hace |
|---|---|---|---|
| `UsuarioController.java` línea 43 | `GET` | `/api/usuarios` | Lista todos los usuarios |
| `UsuarioController.java` línea 48 | `GET` | `/api/usuarios/{id}` | Obtiene un usuario por ID |
| `UsuarioController.java` línea 54 | `PUT` | `/api/usuarios/{id}` | Actualiza nombre, rol, password o estado activo |
| `UsuarioController.java` línea 62 | `DELETE` | `/api/usuarios/{id}` | Elimina un usuario |
| `UsuarioController.java` línea 69 | `GET` | `/api/usuarios/rol/{rol}` | Filtra por rol (ADMIN / CLIENTE) |
| `UsuarioController.java` línea 74 | `GET` | `/api/usuarios/activos/listar` | Solo usuarios con `activo = true` |

---

## 🏀 IMPLEMENTOS / PRODUCTOS (CRUD)

| Etiqueta para buscar | Archivo | Qué hace |
|---|---|---|
| `[IMPLEMENTOS - INICIALIZAR MÓDULO ADMIN]` | `Frontend/js/inventario.js` | `initImplementos()` — carga la tabla del inventario en el panel admin |
| `[IMPLEMENTOS - CARGAR DATOS DEL SERVIDOR]` | `Frontend/js/inventario.js` | Función `cargar()` — trae todos los implementos desde el backend |
| `[IMPLEMENTOS - RENDERIZAR TABLA]` | `Frontend/js/inventario.js` | Función `render()` — pinta la tabla con imagen, nombre, categoría, stock, estado |
| `[IMPLEMENTOS - ACTUALIZAR TARJETAS RESUMEN]` | `Frontend/js/inventario.js` | `actualizarTarjetas()` — calcula totales, disponibles, en préstamo y en mantenimiento |
| `[IMPLEMENTOS - MODAL CREAR/EDITAR]` | `Frontend/js/inventario.js` | `abrirModalImplemento()` — abre el modal con el formulario de implemento (nombre, categoría, cantidad, precio, imagen) |
| `[IMPLEMENTOS - API REST]` | `Frontend/js/api.js` | Objeto `implementosAPI` — métodos: `obtenerTodos`, `crear`, `actualizar`, `eliminar`, `buscar`, `obtenerPorCategoria` |
| `[CATÁLOGO - CARGAR PRODUCTOS]` | `Frontend/js/index.js` | `initCatalogo()` — fetcha todos los implementos y los pinta como tarjetas en la página pública |
| `[CATÁLOGO - FILTRAR PRODUCTOS]` | `Frontend/js/index.js` | `aplicarFiltros()` — filtra las tarjetas por categoría, estado y texto de búsqueda |

**Backend:**
| Archivo | Método HTTP | Endpoint | Qué hace |
|---|---|---|---|
| `ImplementoController.java` línea 22 | `GET` | `/api/implementos` | Lista todos los implementos |
| `ImplementoController.java` línea 27 | `GET` | `/api/implementos/{id}` | Obtiene un implemento por ID |
| `ImplementoController.java` línea 33 | `POST` | `/api/implementos` | Crea un implemento nuevo (stock inicial = cantidadTotal) |
| `ImplementoController.java` línea 38 | `PUT` | `/api/implementos/{id}` | Actualiza los datos del implemento |
| `ImplementoController.java` línea 44 | `DELETE` | `/api/implementos/{id}` | Elimina un implemento |
| `ImplementoController.java` línea 52 | `GET` | `/api/implementos/categoria/{cat}` | Filtra por categoría |
| `ImplementoController.java` línea 58 | `GET` | `/api/implementos/estado/{estado}` | Filtra por estado (DISPONIBLE / EN_PRESTAMO / MANTENIMIENTO) |
| `ImplementoController.java` línea 63 | `GET` | `/api/implementos/buscar/{nombre}` | Búsqueda por nombre (contains, ignora mayúsculas) |
| `ImplementoService.java` línea 33 | — | — | Lógica de creación: `cantidadDisponible = cantidadTotal`, `cantidadEnPrestamo = 0` |

---

## 🛒 CARRITO DE RENTA

| Etiqueta para buscar | Archivo | Qué hace |
|---|---|---|
| `[CARRITO - API LOCAL]` | `Frontend/js/api.js` | Objeto `carritoAPI` — `obtener`, `guardar`, `limpiar`, `agregar`, `eliminar` usando localStorage |
| `[CARRITO - ACTUALIZAR CONTADOR]` | `Frontend/js/api.js` | `actualizarContadorCarrito()` — actualiza el número del badge en la navbar |
| `[CARRITO - RENDERIZAR VISTA]` | `Frontend/js/carrito.js` | `renderCarrito()` — pinta todos los items del carrito, calcula subtotal y total |
| `[CARRITO - CALCULAR DURACIÓN RENTA]` | `Frontend/js/carrito.js` | `calcularDuracion()` — calcula días u horas según `tipoPeriodo` |
| `[CARRITO - CALCULAR SUBTOTAL ITEM]` | `Frontend/js/carrito.js` | `calcularSubtotalItem()` — precio × duración × cantidad |
| `[CARRITO - AGREGAR DESDE URL]` | `Frontend/js/carrito.js` | `cargarImplementoDesdeQuerySiHaceFalta()` — si venía `?id=X&added=1` en la URL, agrega ese implemento |
| `[CARRITO - PROCESAR CHECKOUT]` | `Frontend/js/carrito.js` | Handler del botón `.btn-checkout` — valida fechas, llama `prestamosAPI.crear()` por cada item, limpia el carrito |
| `[INICIALIZACIÓN - CARRITO]` | `Frontend/js/carrito.js` | `initCarrito()` — punto de entrada de carrito.html: verifica sesión, conecta eventos |

---

## 📋 DETALLE DE IMPLEMENTO (página producto.html)

| Etiqueta para buscar | Archivo | Qué hace |
|---|---|---|
| `[PRODUCTO - CARGAR DETALLE]` | `Frontend/js/producto.js` | `initProducto()` — carga los datos del implemento desde la URL `?id=X` y los pinta en la página |
| `[PRODUCTO - CALCULAR TOTAL RENTA]` | `Frontend/js/producto.js` | `calcularTotal()` — muestra el precio estimado según días u horas seleccionadas |
| `[PRODUCTO - CAMBIAR MODO PERIODO]` | `Frontend/js/producto.js` | `actualizarModoPeriodo()` — muestra/oculta el campo de fecha fin o el campo de horas |
| `[CARRITO - AGREGAR IMPLEMENTO]` | `Frontend/js/producto.js` | Dentro del click de `.btn-rentar-prod` — empaqueta el implemento y lo pasa a `carritoAPI.agregar()` |

---

## 📦 PRÉSTAMOS (CRUD + DEVOLUCIÓN)

| Etiqueta para buscar | Archivo | Qué hace |
|---|---|---|
| `[PRÉSTAMOS - INICIALIZAR MÓDULO ADMIN]` | `Frontend/js/prestamos.js` | `initPrestamos()` — carga la tabla de préstamos en el panel admin |
| `[PRÉSTAMOS - CARGAR DATOS DEL SERVIDOR]` | `Frontend/js/prestamos.js` | Función `cargar()` — trae préstamos e implementos en paralelo |
| `[PRÉSTAMOS - RENDERIZAR TABLA]` | `Frontend/js/prestamos.js` | Función `render()` — pinta la tabla con usuario, implemento, fechas y estado |
| `[PRÉSTAMOS - RENDERIZAR ACTIVOS EN DASHBOARD]` | `Frontend/js/prestamos.js` | `renderPrestamosActivos()` — muestra los 6 préstamos próximos a vencer en el dashboard |
| `[PRÉSTAMOS - REGISTRAR DEVOLUCIÓN]` | `Frontend/js/prestamos.js` | Handler del botón "devolver" — llama `prestamosAPI.registrarDevolucion()` |
| `[PRÉSTAMOS - API REST]` | `Frontend/js/api.js` | Objeto `prestamosAPI` — métodos: `obtenerTodos`, `crear`, `registrarDevolucion`, `eliminar`, `obtenerPorUsuario` |

**Backend:**
| Archivo | Método HTTP | Endpoint | Qué hace |
|---|---|---|---|
| `PrestamoController.java` línea 22 | `GET` | `/api/prestamos` | Lista todos los préstamos |
| `PrestamoController.java` línea 27 | `GET` | `/api/prestamos/{id}` | Obtiene un préstamo por ID |
| `PrestamoController.java` línea 33 | `POST` | `/api/prestamos` | Crea un préstamo: descuenta stock, cambia estado del implemento |
| `PrestamoController.java` línea 47 | `PUT` | `/api/prestamos/{id}/devolver` | Registra la devolución: devuelve stock, marca DEVUELTO o VENCIDO |
| `PrestamoController.java` línea 58 | `DELETE` | `/api/prestamos/{id}` | Elimina un préstamo |
| `PrestamoController.java` línea 65 | `GET` | `/api/prestamos/estado/{estado}` | Filtra por estado (ACTIVO / DEVUELTO / VENCIDO) |
| `PrestamoController.java` línea 71 | `GET` | `/api/prestamos/usuario/{usuarioId}` | Préstamos de un usuario específico |
| `PrestamoController.java` línea 76 | `GET` | `/api/prestamos/implemento/{implementoId}` | Préstamos de un implemento específico |
| `PrestamoService.java` línea 50 | — | — | Lógica de creación: valida usuario, implemento y disponibilidad; descuenta stock |
| `PrestamoService.java` línea 82 | — | — | Lógica de devolución: devuelve stock, decide DEVUELTO vs VENCIDO según la fecha |

---

## 📊 DASHBOARD Y REPORTES

| Etiqueta para buscar | Archivo | Qué hace |
|---|---|---|
| `[DASHBOARD - INICIALIZAR PANEL ADMIN]` | `Frontend/js/dashboard-main.js` | `iniciarAdmin()` — punto de entrada del área admin: verifica rol, conecta logout, despacha a cada módulo |
| `[DASHBOARD - CARGAR MÉTRICAS]` | `Frontend/js/dashboard-main.js` | `initDashboard()` — carga implementos, usuarios y préstamos en paralelo; llena las tarjetas de resumen |
| `[DASHBOARD - TABLA IMPLEMENTOS]` | `Frontend/js/dashboard-main.js` | `renderTablaImplementosDashboard()` — muestra los primeros 8 implementos en la tabla del dashboard |
| `[DASHBOARD - TABLA PRÉSTAMOS RECIENTES]` | `Frontend/js/dashboard-main.js` | `renderTablaPrestamosDashboard()` — muestra los 10 préstamos más recientes ordenados por fecha |
| `[REPORTES - INICIALIZAR MÓDULO ESTADÍSTICAS]` | `Frontend/js/reportes.js` | `initReportes()` — calcula préstamos del año, del mes, implemento más prestado y promedio de días |

---

## 🧰 UTILIDADES COMPARTIDAS

| Etiqueta para buscar | Archivo | Qué hace |
|---|---|---|
| `[UI - MODAL GENÉRICO]` | `Frontend/js/ui-utils.js` | `crearModal()` — construye y muestra un modal con título, cuerpo HTML y botones Cancelar/Guardar |
| `[UI - SIDEBAR ADMIN]` | `Frontend/js/ui-utils.js` | `initSidebar()` — conecta el menú lateral del panel admin (abrir/cerrar) |
| `[UI - TOAST NOTIFICACIÓN]` | `Frontend/js/api.js` | `ui.toast()` — muestra una notificación pequeña en la esquina (SweetAlert2) |
| `[UI - ALERTA MODAL]` | `Frontend/js/api.js` | `ui.alert()` — muestra un cuadro de alerta con ícono y mensaje |
| `[UI - CONFIRMACIÓN MODAL]` | `Frontend/js/api.js` | `ui.confirm()` — muestra un cuadro Sí/No; devuelve `true` si el usuario confirma |
| `[API - PETICIÓN HTTP BASE]` | `Frontend/js/api.js` | `apiRequest()` — función base para todas las peticiones HTTP; maneja errores y parseo de JSON |
| `[MANEJO DE ERRORES HTTP]` | `Frontend/js/api.js` | `obtenerMensajeError()` — convierte códigos HTTP en mensajes amigables |
| `[NAVEGACIÓN - ACTUALIZAR NAVBAR PÚBLICA]` | `Frontend/js/index.js` | `actualizarNavPublica()` — cambia los botones de la barra de navegación según el estado de sesión |

---

## 🔄 Flujo Completo de una Renta (de punta a punta)

```
1. Cliente ve el catálogo      → index.html + [CATÁLOGO - CARGAR PRODUCTOS]
2. Hace clic en "Ver detalle"  → producto.html + [PRODUCTO - CARGAR DETALLE]
3. Elige fechas y precio       → [PRODUCTO - CALCULAR TOTAL RENTA]
4. Clic en "Rentar"            → [CARRITO - AGREGAR IMPLEMENTO]
5. Va al carrito               → carrito.html + [CARRITO - RENDERIZAR VISTA]
6. Ajusta cantidad/fechas      → [CARRITO - CALCULAR SUBTOTAL ITEM]
7. Clic en "Confirmar renta"   → [CARRITO - PROCESAR CHECKOUT]
8. Backend crea el préstamo    → POST /api/prestamos → [PrestamoService.java:crear()]
   └── Descuenta stock del implemento automáticamente
9. Admin ve el préstamo        → prestamos.html + [PRÉSTAMOS - INICIALIZAR MÓDULO ADMIN]
10. Admin registra devolución  → [PRÉSTAMOS - REGISTRAR DEVOLUCIÓN]
    └── Backend devuelve stock → PUT /api/prestamos/{id}/devolver
```

---

## 🌐 API Base URL

```
http://localhost:8080/api
```

Configurada en `Frontend/js/api.js` línea 1: `const API_URL = "http://localhost:8080/api";`

---

## 📌 Estados posibles

### Implemento
| Estado | Significado |
|---|---|
| `DISPONIBLE` | Hay al menos 1 unidad disponible |
| `EN_PRESTAMO` | Todas las unidades están en préstamo |
| `MANTENIMIENTO` | Fuera de servicio temporalmente |

### Préstamo
| Estado | Significado |
|---|---|
| `ACTIVO` | El implemento está actualmente en manos del cliente |
| `DEVUELTO` | Fue devuelto dentro del plazo esperado |
| `VENCIDO` | Fue devuelto pero fuera del plazo esperado |

### Usuario
| Rol | Acceso |
|---|---|
| `ADMIN` | Panel administrativo completo (no puede rentar) |
| `CLIENTE` | Catálogo, carrito y renta de implementos |
