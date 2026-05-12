const API_URL = "http://localhost:8080/api";

// ─────────────────────────────────────────────────────────────────────────────
// SESIÓN — guarda solo el usuario en localStorage (sin tokens)
// ─────────────────────────────────────────────────────────────────────────────

const sesion = {
  getUsuario:    () => JSON.parse(localStorage.getItem("usuario") || "null"),
  guardar:       (usuario) => localStorage.setItem("usuario", JSON.stringify(usuario)),
  limpiar:       () => localStorage.removeItem("usuario"),
  estaLogueado:  () => !!localStorage.getItem("usuario"),
  esAdmin:       () => JSON.parse(localStorage.getItem("usuario") || "null")?.rol === "ADMIN",
  esEmpleado:    () => JSON.parse(localStorage.getItem("usuario") || "null")?.rol === "EMPLEADO",
};

// ─────────────────────────────────────────────────────────────────────────────
// PROTECCIÓN DE PÁGINAS
// ─────────────────────────────────────────────────────────────────────────────

function requerirAuth() {
  if (!sesion.estaLogueado()) window.location.href = "login.html";
}

function requerirAdmin() {
  requerirAuth();
  if (!sesion.esAdmin()) window.location.href = "403.html";
}

function requerirEmpleado() {
  requerirAuth();
  if (!sesion.esEmpleado()) window.location.href = "403.html";
}

function conectarLogout(selector = ".btn-salir, .scli-salir") {
  document.querySelectorAll(selector).forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      await authAPI.logout();
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FETCH SIMPLE — sin JWT
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// UI — SweetAlert2 (carga dinámica)
// ─────────────────────────────────────────────────────────────────────────────

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

  async alert(titulo, mensaje = "", tipo = "info") {
    try {
      await cargarSweetAlert();
      return Swal.fire({ icon: tipo, title: titulo, text: mensaje, confirmButtonText: "Aceptar" });
    } catch { alert(`${titulo}\n${mensaje}`); }
  },

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

// ─────────────────────────────────────────────────────────────────────────────
// AUTH API
// ─────────────────────────────────────────────────────────────────────────────

const authAPI = {
  async login(email, password) {
    const usuario = await apiRequest("/usuarios/login", {
      method: "POST",
      body: { email, password }
    });
    sesion.guardar(usuario);
    return usuario;
  },

  async register(nombre, email, password, rol = "EMPLEADO") {
    const usuario = await apiRequest("/usuarios/registro", {
      method: "POST",
      body: { nombre, email, password, rol }
    });
    sesion.guardar(usuario);
    return usuario;
  },

  async logout() {
    sesion.limpiar();
    window.location.href = "login.html";
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// USUARIOS API
// ─────────────────────────────────────────────────────────────────────────────

const usuariosAPI = {
  login:          (email, password)  => authAPI.login(email, password),
  registro:       (n, e, p, r)       => authAPI.register(n, e, p, r),
  obtenerTodos:   ()                 => apiRequest("/usuarios"),
  obtenerPorId:   (id)               => apiRequest(`/usuarios/${id}`),
  actualizar:     (id, u)            => apiRequest(`/usuarios/${id}`, { method: "PUT", body: u }),
  eliminar:       async (id)         => { await apiRequest(`/usuarios/${id}`, { method: "DELETE" }); return true; },
  obtenerPorRol:  (rol)              => apiRequest(`/usuarios/rol/${rol}`),
  obtenerActivos: ()                 => apiRequest("/usuarios/activos/listar"),
};

// ─────────────────────────────────────────────────────────────────────────────
// IMPLEMENTOS API
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// PRÉSTAMOS API
// ─────────────────────────────────────────────────────────────────────────────

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