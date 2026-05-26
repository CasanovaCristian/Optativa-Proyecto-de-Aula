const API_URL = "http://localhost:8080/api";

function normalizarRolUsuario(usuario) {
  if (!usuario) return usuario;
  return {
    ...usuario,
    rol: usuario.rol === "ADMIN" ? "ADMIN" : "CLIENTE",
  };
}

// [GESTIÓN DE SESIÓN] — guarda el usuario en localStorage; helpers de rol y login
const sesion = {
  getUsuario:    () => normalizarRolUsuario(JSON.parse(localStorage.getItem("usuario") || "null")),
  guardar:       (usuario) => localStorage.setItem("usuario", JSON.stringify(normalizarRolUsuario(usuario))),
  limpiar:       () => localStorage.removeItem("usuario"),
  estaLogueado:  () => !!localStorage.getItem("usuario"),
  esAdmin:       () => JSON.parse(localStorage.getItem("usuario") || "null")?.rol === "ADMIN",
  esCliente:     () => normalizarRolUsuario(JSON.parse(localStorage.getItem("usuario") || "null"))?.rol === "CLIENTE",
};

// [CARRITO - API LOCAL] — operaciones sobre el carrito almacenado en localStorage
const carritoAPI = {
  clave: "carrito",
  obtener: () => JSON.parse(localStorage.getItem("carrito") || "[]"),
  guardar: (items) => {
    localStorage.setItem("carrito", JSON.stringify(items));
    actualizarContadorCarrito();
  },
  limpiar: () => {
    localStorage.removeItem("carrito");
    actualizarContadorCarrito();
  },
  agregar: (item) => {
    const actual = carritoAPI.obtener();
    const existente = actual.find((x) => String(x.id) === String(item.id));
    if (existente) {
      Object.assign(existente, item, { cantidad: Number(existente.cantidad || 1) + Number(item.cantidad || 1) });
    } else {
      actual.push({ ...item, cantidad: Number(item.cantidad || 1) });
    }
    carritoAPI.guardar(actual);
    return actual;
  },
  eliminar: (id) => {
    const filtrado = carritoAPI.obtener().filter((x) => String(x.id) !== String(id));
    carritoAPI.guardar(filtrado);
    return filtrado;
  },
};

function obtenerCantidadCarrito() {
  return carritoAPI.obtener().reduce((acc, item) => acc + Number(item.cantidad || 1), 0);
}

// [CARRITO - ACTUALIZAR CONTADOR] — actualiza el número del badge del carrito en la navbar
function actualizarContadorCarrito() {
  const cantidad = obtenerCantidadCarrito();
  const nodos = document.querySelectorAll(
    ".carrito-count, .scli-badge, .carrito-badge-top, .carrito-badge-nav"
  );

  nodos.forEach((nodo) => {
    if (!nodo) return;
    if (nodo.classList.contains("carrito-count")) {
      nodo.textContent = `${cantidad} implemento${cantidad === 1 ? "" : "s"}`;
      nodo.style.display = cantidad > 0 ? "inline-flex" : "inline-flex";
      return;
    }
    nodo.textContent = cantidad;
    nodo.style.display = cantidad > 0 ? "inline-flex" : "inline-flex";
  });

  document.dispatchEvent(new CustomEvent("carrito:actualizado", { detail: { cantidad } }));
}

window.addEventListener("storage", (event) => {
  if (event.key === "carrito") actualizarContadorCarrito();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", actualizarContadorCarrito);
} else {
  actualizarContadorCarrito();
}

// [AUTENTICACIÓN - VERIFICAR SESIÓN] — si no hay sesión activa, redirige a login.html
function requerirAuth() {
  if (!sesion.estaLogueado()) window.location.href = "login.html";
}

// [AUTENTICACIÓN - VERIFICAR ROL ADMIN] — si el usuario no es ADMIN, redirige a 403.html
function requerirAdmin() {
  requerirAuth();
  if (!sesion.esAdmin()) window.location.href = "403.html";
}

// [AUTENTICACIÓN - VERIFICAR ROL CLIENTE] — si el usuario no es CLIENTE, redirige a 403.html
function requerirCliente() {
  requerirAuth();
  if (!sesion.esCliente()) window.location.href = "403.html";
}

// [CERRAR SESIÓN - BOTÓN LOGOUT] — conecta todos los botones .btn-salir con la función de logout
function conectarLogout(selector = ".btn-salir, .scli-salir") {
  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      await authAPI.logout();
    });
  });
}

// [API - PETICIÓN HTTP BASE] — función central para todas las llamadas REST al backend
async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body = null,
  } = options;

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const headers = { "Content-Type": "application/json" };
  const config  = { method, headers };

  if (body !== null) config.body = JSON.stringify(body);

  const response = await fetch(url, config);

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const mensaje = data?.error || obtenerMensajeError(response.status);
    const error   = new Error(mensaje);
    error.status  = response.status;
    throw error;
  }

  return data;
}

// [MANEJO DE ERRORES HTTP] — convierte códigos de estado HTTP en mensajes legibles
function obtenerMensajeError(status) {
  switch (status) {
    case 400: return "Solicitud inválida. Revisa los datos enviados.";
    case 401: return "Credenciales inválidas.";
    case 403: return "No tienes permisos para esta acción.";
    case 404: return "Recurso no encontrado.";
    case 409: return "Conflicto en la solicitud.";
    case 500: return "Error interno del servidor.";
    default:  return "Ocurrió un error inesperado.";
  }
}

// [UI - CARGAR SWEETALERT2] — carga la librería de alertas dinámicamente si no está disponible
let _swalPromise = null;

function cargarSweetAlert() {
  if (window.Swal) return Promise.resolve();
  if (_swalPromise) return _swalPromise;

  _swalPromise = new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel   = "stylesheet";
    link.href  = "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css";
    document.head.appendChild(link);

    const script    = document.createElement("script");
    script.src      = "https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.js";
    script.onload   = resolve;
    script.onerror  = () => reject(new Error("No se pudo cargar SweetAlert2"));
    document.head.appendChild(script);
  });

  return _swalPromise;
}

const ui = {
  // [UI - TOAST NOTIFICACIÓN] — muestra una notificación pequeña en la esquina superior derecha
  async toast(mensaje, tipo = "success") {
    try {
      await cargarSweetAlert();
      Swal.fire({
        toast: true, position: "top-end", icon: tipo,
        title: mensaje, showConfirmButton: false,
        timer: 3000, timerProgressBar: true,
      });
    } catch { alert(mensaje); }
  },

  // [UI - ALERTA MODAL] — muestra un cuadro de alerta con ícono, título y mensaje
  async alert(titulo, mensaje = "", tipo = "info") {
    try {
      await cargarSweetAlert();
      return Swal.fire({ icon: tipo, title: titulo, text: mensaje, confirmButtonText: "Aceptar" });
    } catch { alert(`${titulo}\n${mensaje}`); }
  },

  // [UI - CONFIRMACIÓN MODAL] — muestra un cuadro Sí/No; devuelve true si el usuario confirma
  async confirm(titulo, mensaje = "", opciones = {}) {
    const { confirmText = "Sí, continuar", cancelText = "Cancelar", tipo = "warning" } = opciones;
    try {
      await cargarSweetAlert();
      const r = await Swal.fire({
        icon: tipo, title: titulo, text: mensaje,
        showCancelButton: true, confirmButtonText: confirmText,
        cancelButtonText: cancelText, reverseButtons: true,
      });
      return r.isConfirmed;
    } catch { return confirm(`${titulo}\n${mensaje}`); }
  }
};

// [AUTENTICACIÓN - INICIAR SESIÓN] — llama a POST /api/usuarios/login y guarda la sesión
// [AUTENTICACIÓN - REGISTRAR USUARIO] — llama a POST /api/usuarios/registro y guarda la sesión
// [AUTENTICACIÓN - CERRAR SESIÓN] — limpia localStorage y redirige a login.html
const authAPI = {
  async login(email, password) {
    const usuario = await apiRequest("/usuarios/login", {
      method: "POST",
      body: { email, password }
    });
    const normalizado = normalizarRolUsuario(usuario);
    sesion.guardar(normalizado);
    return normalizado;
  },

  async register(nombre, email, password, rol = "CLIENTE") {
    const usuario = await apiRequest("/usuarios/registro", {
      method: "POST",
      body: { nombre, email, password, rol }
    });
    const normalizado = normalizarRolUsuario(usuario);
    sesion.guardar(normalizado);
    return normalizado;
  },

  async logout() {
    sesion.limpiar();
    window.location.href = "login.html";
  }
};

// [USUARIOS - API REST] — métodos: login, registro, crear, obtenerTodos, obtenerPorId, actualizar, eliminar, obtenerPorRol
const usuariosAPI = {
  login:          (email, password)  => authAPI.login(email, password),
  registro:       (n, e, p, r)       => authAPI.register(n, e, p, r),
  crear:          (n, e, p, r)       => apiRequest("/usuarios/registro", { method: "POST", body: { nombre: n, email: e, password: p, rol: r } }),
  obtenerTodos:   ()                 => apiRequest("/usuarios"),
  obtenerPorId:   (id)               => apiRequest(`/usuarios/${id}`),
  actualizar:     (id, u)            => apiRequest(`/usuarios/${id}`, { method: "PUT", body: u }),
  eliminar:       async (id)         => { await apiRequest(`/usuarios/${id}`, { method: "DELETE" }); return true; },
  obtenerPorRol:  (rol)              => apiRequest(`/usuarios/rol/${rol}`),
  obtenerActivos: ()                 => apiRequest("/usuarios/activos/listar"),
};

// [IMPLEMENTOS - API REST] — métodos: obtenerTodos, obtenerPorId, crear, actualizar, eliminar, buscar, obtenerPorCategoria
const implementosAPI = {
  obtenerTodos:       ()          => apiRequest("/implementos"),
  obtenerPorId:       (id)        => apiRequest(`/implementos/${id}`),
  crear:              (impl)      => apiRequest("/implementos", { method: "POST", body: impl }),
  actualizar:         (id, impl)  => apiRequest(`/implementos/${id}`, { method: "PUT", body: impl }),
  eliminar:           async (id)  => { await apiRequest(`/implementos/${id}`, { method: "DELETE" }); return true; },
  obtenerPorCategoria:(cat)       => apiRequest(`/implementos/categoria/${cat}`),
  obtenerPorEstado:   (estado)    => apiRequest(`/implementos/estado/${estado}`),
  buscar:             (nombre)    => apiRequest(`/implementos/buscar/${nombre}`),
};

// [PRÉSTAMOS - API REST] — métodos: obtenerTodos, crear, registrarDevolucion, eliminar, obtenerPorUsuario, obtenerPorImplemento
const prestamosAPI = {
  obtenerTodos:        ()           => apiRequest("/prestamos"),
  obtenerPorId:        (id)         => apiRequest(`/prestamos/${id}`),
  crear:               (p)          => apiRequest("/prestamos", { method: "POST", body: p }),
  registrarDevolucion: (id)         => apiRequest(`/prestamos/${id}/devolver`, { method: "PUT" }),
  eliminar:            async (id)   => { await apiRequest(`/prestamos/${id}`, { method: "DELETE" }); return true; },
  obtenerPorEstado:    (estado)     => apiRequest(`/prestamos/estado/${estado}`),
  obtenerPorUsuario:   (usuarioId)  => apiRequest(`/prestamos/usuario/${usuarioId}`),
  obtenerPorImplemento:(implId)     => apiRequest(`/prestamos/implemento/${implId}`),
};

Object.assign(window, {
  sesion,
  carritoAPI,
  authAPI,
  usuariosAPI,
  implementosAPI,
  prestamosAPI,
  ui,
  requerirCliente,
  actualizarContadorCarrito,
});
