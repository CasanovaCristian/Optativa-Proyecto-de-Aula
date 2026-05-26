import { initSidebar, formatearFecha, obtenerIniciales } from "./ui-utils.js";
import { initImplementos } from "./inventario.js";
import { initUsuarios } from "./usuarios.js";
import { initPrestamos, renderPrestamosActivos } from "./prestamos.js";
import { initReportes } from "./reportes.js";

const paginaActual = (location.pathname.split("/").pop() || "").toLowerCase();

function cargarScript(src, id) {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(`script[data-script-id="${id}"]`);
    if (existente) {
      if (window.sesion) return resolve();
      existente.addEventListener("load", () => resolve());
      existente.addEventListener("error", () =>
        reject(new Error(`No se pudo cargar ${src}`)),
      );
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.scriptId = id;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

function actualizarTopbar() {
  const nombre = sesion.getUsuario()?.nombre || "Usuario";
  document.querySelectorAll(".topbar-nombre").forEach((el) => {
    el.textContent = nombre;
  });
}

function mapearEstadoPrestamo(estado) {
  if (estado === "ACTIVO") return { clase: "activo-badge", texto: "ACTIVO" };
  if (estado === "DEVUELTO") return { clase: "devuelto", texto: "DEVUELTO" };
  return { clase: "vencido", texto: "VENCIDO" };
}

function obtenerImagenImplemento(impl) {
  return (
    impl?.imagenes?.[0] ||
    impl?.imagenUrl ||
    impl?.imagenBase64 ||
    impl?.imagen ||
    ""
  );
}

// [DASHBOARD - CARGAR MÉTRICAS] — carga implementos, usuarios y préstamos; llena las tarjetas de resumen del dashboard
async function initDashboard() {
  const tarjetaValores = document.querySelectorAll(
    ".seccion-tarjetas .tarjeta-valor",
  );
  tarjetaValores.forEach((el) => {
    el.textContent = "Cargando...";
  });
  const lista = document.querySelector(".lista-prestamos-rapidos");
  if (lista) lista.innerHTML = "<li>Cargando...</li>";
  const tbody = document.querySelector(".tabla-card .tabla-datos tbody");
  if (tbody) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary)">Cargando...</td></tr>';
  }

  const [implementos, usuarios, prestamos] = await Promise.all([
    implementosAPI.obtenerTodos(),
    usuariosAPI.obtenerTodos(),
    prestamosAPI.obtenerTodos(),
  ]);

  const hoy = new Date();
  const devolucionesHoy = prestamos.filter((p) => {
    if (!p.fechaDevolucionReal) return false;
    const f = new Date(p.fechaDevolucionReal);
    return (
      f.getDate() === hoy.getDate() &&
      f.getMonth() === hoy.getMonth() &&
      f.getFullYear() === hoy.getFullYear()
    );
  }).length;

  const prestamosActivos = prestamos.filter(
    (p) => p.estado === "ACTIVO",
  ).length;
  const disponiblesTotal = implementos.reduce(
    (acc, impl) => acc + Number(impl.cantidadDisponible || 0),
    0,
  );

  [
    implementos.length,
    disponiblesTotal,
    prestamosActivos,
    implementos.filter((i) => i.estado === "MANTENIMIENTO").length,
    usuarios.length,
    devolucionesHoy,
  ].forEach((val, i) => {
    if (tarjetaValores[i]) tarjetaValores[i].textContent = val;
  });

  renderPrestamosActivos(prestamos);
  renderTablaImplementosDashboard(implementos);
  renderTablaPrestamosDashboard(prestamos);
}

// [DASHBOARD - TABLA IMPLEMENTOS] — muestra los primeros 8 implementos en la tabla resumen del dashboard
function renderTablaImplementosDashboard(implementos) {
  const tbody = document.querySelector(".tabla-card .tabla-datos tbody");
  if (!tbody) return;
  if (!implementos.length) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary)">No hay implementos para mostrar.</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  implementos.slice(0, 8).forEach((impl, index) => {
    const imagen = obtenerImagenImplemento(impl);
    const fila = document.createElement("tr");
    const cls =
      impl.estado === "DISPONIBLE"
        ? "disponible"
        : impl.estado === "MANTENIMIENTO"
          ? "mantenimiento"
          : "prestado";
    fila.innerHTML = `
      <td>${String(index + 1).padStart(3, "0")}</td>
      <td class="celda-imagen-tabla">
        ${
          imagen
            ? `<div class="tabla-imagen-mini"><img src="${imagen}" alt="${impl.nombre}" loading="lazy"></div>`
            : `<div class="tabla-imagen-mini gris"><i class="fa-solid fa-box"></i></div>`
        }
      </td>
      <td><div class="celda-implemento-flex"><span>${impl.nombre}</span></div></td>
      <td>${impl.categoria}</td>
      <td>${impl.cantidadTotal}</td>
      <td>${impl.cantidadDisponible}</td>
      <td><span class="estado ${cls}">${impl.estado.replace("_", " ")}</span></td>
    `;
    tbody.appendChild(fila);
  });
}

// [DASHBOARD - TABLA PRÉSTAMOS RECIENTES] — muestra los 10 préstamos más recientes ordenados por fecha
function renderTablaPrestamosDashboard(prestamos) {
  const tbody = document.querySelector(".tabla-prestamos-dashboard tbody");
  if (!tbody) return;

  if (!prestamos.length) {
    tbody.innerHTML =
      '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-secondary)">No hay préstamos para mostrar.</td></tr>';
    return;
  }

  const lista = prestamos
    .slice()
    .sort(
      (a, b) =>
        new Date(b.fechaPrestamo || b.fechaCreado || 0) -
        new Date(a.fechaPrestamo || a.fechaCreado || 0),
    )
    .slice(0, 10);

  tbody.innerHTML = "";
  lista.forEach((p, index) => {
    const estado = mapearEstadoPrestamo(p.estado);
    const imagen =
      p.implementoImagen ||
      p.imagen ||
      p.implementoImagenUrl ||
      p.implementoImagenBase64 ||
      p.implemento?.imagen ||
      "";
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>#P${String(p.id).padStart(3, "0")}</td>
      <td>
        <div class="usuario-celda">
          <div class="mini-av azul">${obtenerIniciales(p.usuarioNombre)}</div>
          <span>${p.usuarioNombre}</span>
        </div>
      </td>
      <td>
        ${
          imagen
            ? `<div class="tabla-imagen-mini"><img src="${imagen}" alt="${p.implementoNombre}" loading="lazy"></div>`
            : `<div class="tabla-imagen-mini gris"><i class="fa-solid fa-basketball"></i></div>`
        }
      </td>
      <td>
        <div class="celda-implemento-flex">
          <span>${p.implementoNombre}</span>
        </div>
      </td>
      <td>${formatearFecha(p.fechaPrestamo)}</td>
      <td>${formatearFecha(p.fechaDevolucionReal || p.fechaDevolucionEsperada)}</td>
      <td><span class="estado ${estado.clase}">${estado.texto}</span></td>
    `;
    tbody.appendChild(fila);
  });
}

// [DASHBOARD - INICIALIZAR PANEL ADMIN] — punto de entrada del área admin; verifica rol, conecta logout y despacha a cada módulo según la página
export async function iniciarAdmin() {
  initSidebar();
  try {
    await cargarScript("js/api.js", "api");
  } catch (e) {
    console.error(e);
    return;
  }
  if (!window.sesion) return;

  requerirAdmin();
  conectarLogout();
  actualizarTopbar();

  try {
    if (paginaActual === "implementos.html") await initImplementos();
    if (paginaActual === "usuarios.html") await initUsuarios();
    if (paginaActual === "prestamos.html") await initPrestamos();
    if (paginaActual === "dashboard.html") await initDashboard();
    if (paginaActual === "reportes.html") await initReportes();
  } catch (error) {
    ui.toast(error.message || "Error al cargar datos", "error");
  }
}

document.addEventListener("DOMContentLoaded", iniciarAdmin);
