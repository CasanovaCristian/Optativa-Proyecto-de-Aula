# SportDeal FET - Frontend Documentation

## Descripción General
Frontend de un sistema de renta de implementos deportivos con carrito de compras, autenticación de usuarios y panel de administración.

---

## 1. 📦 Cargar Productos en `productos.html`

### Flujo de Funcionamiento

**Archivos involucrados:**
- `productos.html` → HTML principal
- `js/index.js` → Lógica de carga y filtrado
- `js/api.js` → Función `apiRequest()` para consumir API
- `css/index.css` + `css/indexMediaQuery.css` → Estilos

### Proceso paso a paso:

1. **Inicialización (`initCatalogo()` en index.js)**
   ```
   - Se ejecuta al cargar la página
   - Llama a: fetch("http://localhost:8080/api/implementos")
   - Obtiene array de todos los productos disponibles
   ```

2. **Renderización de tarjetas (`implementos.forEach()`)**
   ```
   - Por cada implemento recibido se crea una tarjeta HTML dinámicamente
   - Se asignan atributos data: nombre, categoría, precio, estado
   - Se mapea el estado (DISPONIBLE → "Disponible", EN_PRESTAMO → "En renta", etc)
   ```

3. **Filtrado en tiempo real (`aplicarFiltros()`)**
   - **Por categoría:** Botones `.btn-cat` actualizan categoría activa
   - **Por disponibilidad:** Dropdown `#filtroDisponibilidad` filtra por estado
   - **Por búsqueda:** Input `#buscadorCatalogo` busca en nombre/descripción
   - **Por precio:** Dropdown `#filtroPrecio` ordena ascendente/descendente

4. **Actualización de UI pública**
   - `actualizarNavPublica()` cambia botones de login según sesión del usuario
   - Si está logueado: botón cambia a "Mi cuenta" y "Cerrar sesión"

### Funciones clave:
- `initCatalogo()` → Carga todos los productos desde API
- `aplicarFiltros()` → Filtra tarjetas según criterios activos
- `mapEstado()` → Convierte estado del servidor en badge visual
- `normalizarCategoria()` → Normaliza texto para comparación

---

## 2. 🔐 Login de Usuario/Admin

### Archivos involucrados:
- `login.html` → Formulario login
- `js/api.js` → Objeto `authAPI` y `usuariosAPI`
- `js/toggle.js` → Toggle password visibility
- `css/default.css` → Estilos formulario

### Flujo de autenticación:

1. **Envío de credenciales**
   ```
   Usuario ingresa email y password → Formulario envía POST
   Endpoint: POST http://localhost:8080/api/usuarios/login
   ```

2. **Validación en backend**
   ```
   Backend verifica credenciales en BD
   Retorna: { id, nombre, email, rol: "ADMIN" | "CLIENTE" }
   ```

3. **Almacenamiento en sesión (`sesion.guardar(usuario)`)**
   ```
   - Guarda usuario completo en localStorage con clave "usuario"
   - Normaliza el rol a "ADMIN" o "CLIENTE"
   - Se persiste entre recargas de página
   ```

4. **Redirección según rol**
   ```
   - Si rol === "ADMIN" → redirige a dashboard.html
   - Si rol === "CLIENTE" → redirige a cliente-dashboard.html
   - Si error → muestra mensaje en #mensajeError
   ```

### Funciones clave:
- `usuariosAPI.login(email, password)` → Autentica y guarda sesión
- `sesion.getUsuario()` → Obtiene usuario actual del localStorage
- `sesion.estaLogueado()` → Verifica si hay sesión activa
- `sesion.esAdmin()` / `sesion.esCliente()` → Verifica rol del usuario
- `sesion.limpiar()` → Borra sesión al cerrar (logout)

### Protección de rutas:
```javascript
requerirAuth()        // Redirige a login si NO está logueado
requerirAdmin()       // Redirige a login si NO es ADMIN
requerirCliente()     // Redirige a login si NO es CLIENTE
```

---

## 3. 🛒 Carrito de Compras

### Archivos involucrados:
- `carrito.html` → Página del carrito
- `js/api.js` → Objeto `carritoAPI`
- `js/carrito.js` → Lógica de carro completa
- `css/carrito.css` + `css/carritoMediaQuery.css` → Estilos

### Estructura del carrito en `localStorage`:

```javascript
carrito: [
  {
    id: 1,
    nombre: "Balón",
    categoria: "Balones",
    precioDia: 5000,
    precioHora: 1000,
    cantidad: 2,
    tipoPeriodo: "dia",
    fechaInicio: "2026-05-15",
    fechaFin: "2026-05-17",
    imagen: "url_imagen",
    observaciones: "Inflado"
  }
]
```

### Operaciones principales (`carritoAPI`):

| Función | Descripción |
|---------|-------------|
| `obtener()` | Lee carrito actual desde localStorage |
| `guardar(items)` | Persiste carrito y actualiza contador |
| `agregar(item)` | Agrega o incrementa cantidad de producto |
| `eliminar(id)` | Elimina producto por ID |
| `limpiar()` | Vacía todo el carrito |

### Cálculo de precios (`carrito.js`):

1. **Identificar período de renta**
   ```javascript
   - tipoPeriodo: "dia" → usa fechaInicio y fechaFin
   - tipoPeriodo: "hora" → usa horasRenta y precioHora
   ```

2. **Calcular duración (`calcularDuracion(item)`)**
   ```javascript
   - Por día: (fechaFin - fechaInicio) / ms_por_dia
   - Por hora: horasRenta o (fechaFin - fechaInicio) / ms_por_hora
   ```

3. **Calcular subtotal (`calcularSubtotalItem(item)`)**
   ```javascript
   subtotal = (precio_diario_u_horario × duracion × cantidad)
   ```

4. **Resumen completo (`renderCarrito()`)**
   ```
   Subtotal: suma de todos los items
   Descuento: se aplica si existe
   Total: Subtotal - Descuento
   ```

### UI del carrito:
- **Contador en navbar:** Muestra cantidad de items (`.carrito-badge`)
- **Badge dinámico:** Se actualiza en tiempo real al agregar/eliminar
- **Sincronización entre pestañas:** Usa evento `storage` para actualizar si carrito cambia en otra pestaña

### Funciones clave:
- `renderCarrito()` → Renderiza todos los items del carrito
- `actualizarContadorCarrito()` → Actualiza badge con cantidad total
- `calcularDuracion()` → Calcula días/horas de renta
- `calcularSubtotalItem()` → Calcula precio individual
- `cargarImplementoDesdeQuerySiHaceFalta()` → Auto-agrega producto al carrito si viene desde página de producto

---

## 4. 🔗 Consumo de la API

### Base URL
```
http://localhost:8080/api
```

### Sistema de peticiones (`apiRequest(path, options)`)

**Parámetros:**
```javascript
apiRequest(path, {
  method: "GET" | "POST" | "PUT" | "DELETE",  // default: GET
  body: {...}                                   // JSON para POST/PUT
})
```

**Proceso interno:**
1. Construye URL completa: `API_URL + path`
2. Añade headers: `Content-Type: application/json`
3. Serializa body a JSON si existe
4. Hace fetch
5. Parsea respuesta JSON
6. Maneja errores con mensajes personalizados por status HTTP

**Manejo de errores:**
```
400 → "Solicitud inválida"
401 → "Credenciales inválidas"
403 → "No tienes permisos"
404 → "Recurso no encontrado"
409 → "Conflicto"
500 → "Error interno del servidor"
```

### Endpoints disponibles:

#### Usuarios
```javascript
usuariosAPI.login(email, password)              // POST /usuarios/login
usuariosAPI.registro(nombre, email, pwd, rol)  // POST /usuarios/registro
usuariosAPI.obtenerTodos()                      // GET /usuarios
usuariosAPI.obtenerPorId(id)                    // GET /usuarios/{id}
usuariosAPI.actualizar(id, usuario)             // PUT /usuarios/{id}
usuariosAPI.eliminar(id)                        // DELETE /usuarios/{id}
usuariosAPI.obtenerPorRol(rol)                  // GET /usuarios/rol/{rol}
```

#### Implementos
```javascript
implementosAPI.obtenerTodos()                   // GET /implementos
implementosAPI.obtenerPorId(id)                 // GET /implementos/{id}
implementosAPI.crear(implemento)                // POST /implementos
implementosAPI.actualizar(id, implemento)       // PUT /implementos/{id}
implementosAPI.eliminar(id)                     // DELETE /implementos/{id}
implementosAPI.obtenerPorCategoria(cat)         // GET /implementos/categoria/{cat}
implementosAPI.obtenerPorEstado(estado)         // GET /implementos/estado/{estado}
implementosAPI.buscar(nombre)                   // GET /implementos/buscar/{nombre}
```

#### Préstamos
```javascript
prestamosAPI.obtenerTodos()                     // GET /prestamos
prestamosAPI.obtenerPorId(id)                   // GET /prestamos/{id}
prestamosAPI.crear(prestamo)                    // POST /prestamos
prestamosAPI.registrarDevolucion(id)            // PUT /prestamos/{id}/devolver
prestamosAPI.eliminar(id)                       // DELETE /prestamos/{id}
prestamosAPI.obtenerPorEstado(estado)           // GET /prestamos/estado/{estado}
prestamosAPI.obtenerPorUsuario(usuarioId)       // GET /prestamos/usuario/{usuarioId}
prestamosAPI.obtenerPorImplemento(implId)       // GET /prestamos/implemento/{implId}
```

### Ejemplo de uso:

```javascript
// Obtener todos los productos
const productos = await implementosAPI.obtenerTodos();

// Crear un nuevo préstamo
const prestamo = await prestamosAPI.crear({
  usuarioId: 5,
  implementoId: 12,
  fechaInicio: "2026-05-15",
  fechaFin: "2026-05-17",
  observaciones: "Sin daños"
});

// Manejar error
try {
  await implementosAPI.actualizar(999, {nombre: "Nuevo"});
} catch (error) {
  console.error(error.message); // "Recurso no encontrado"
}
```

### Notificaciones UI (`ui` object):

```javascript
ui.toast(mensaje, tipo)           // Toast (esquina superior derecha)
                                  // tipos: "success", "error", "warning", "info"

ui.alert(titulo, mensaje, tipo)   // Alerta bloqueante

ui.confirm(titulo, mensaje, opciones) // Confirmación con Sí/No
```

---

## 🔄 Integración general entre componentes

```
LOGIN USUARIO
     ↓
Credenciales → usuariosAPI.login() → API Backend
     ↓
localStorage["usuario"] ← Sesión guardada
     ↓
Redirección a dashboard según rol
     ↓
NAVEGAR A PRODUCTOS
     ↓
initCatalogo() → implementosAPI.obtenerTodos() → API Backend
     ↓
Renderizar tarjetas dinámicamente
     ↓
Usuario aplica filtros → aplicarFiltros() (sin API)
     ↓
Usuario selecciona producto
     ↓
carritoAPI.agregar() → localStorage["carrito"]
     ↓
actualizarContadorCarrito() actualiza navbar
     ↓
Usuario va a carrito.html
     ↓
renderCarrito() → lee localStorage["carrito"]
     ↓
Calcula totales y muestra resumen
     ↓
Usuario confirma compra → prestamosAPI.crear() → API Backend
```

---

## 📁 Estructura de archivos clave

```
Frontend/
├── *.html              # Páginas principales
├── js/
│   ├── api.js          # Definición de todos los objetos API
│   ├── index.js        # Lógica de catálogo y filtros
│   ├── carrito.js      # Lógica completa del carrito
│   ├── producto.js     # Lógica de página de producto individual
│   └── toggle.js       # Toggle password visibility
├── css/
│   ├── base.css        # Estilos generales
│   ├── index.css       # Estilos catálogo
│   ├── carrito.css     # Estilos carrito
│   └── *MediaQuery.css # Responsive design
└── img/                # Imágenes (logos, productos)
```

