import { initSidebar } from "./ui-utils.js";
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
      existente.addEventListener("error", () => reject(new Error(`No se pudo cargar ${src}`)));
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

async function initDashboard() {
  const tarjetaValores = document.querySelectorAll(".seccion-tarjetas .tarjeta-valor");
  tarjetaValores.forEach((el) => {
    el.textContent = "Cargando...";
  });
  const lista = document.querySelector(".lista-prestamos-rapidos");
  if (lista) lista.innerHTML = "<li>Cargando...</li>";
  const tbody = document.querySelector(".tabla-card .tabla-datos tbody");
  if (tbody) {
    tbody.innerHTML =
      "<tr><td colspan=\"7\" style=\"text-align:center;padding:2rem;color:var(--text-secondary)\">Cargando...</td></tr>";
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

  [
    implementos.length,
    implementos.filter((i) => i.estado === "DISPONIBLE").length,
    implementos.filter((i) => i.estado === "EN_PRESTAMO").length,
    implementos.filter((i) => i.estado === "MANTENIMIENTO").length,
    usuarios.length,
    devolucionesHoy,
  ].forEach((val, i) => {
    if (tarjetaValores[i]) tarjetaValores[i].textContent = val;
  });

  renderPrestamosActivos(prestamos);
  renderTablaImplementosDashboard(implementos);
}

function renderTablaImplementosDashboard(implementos) {
  const tbody = document.querySelector(".tabla-card .tabla-datos tbody");
  if (!tbody) return;
  if (!implementos.length) {
    tbody.innerHTML =
      "<tr><td colspan=\"7\" style=\"text-align:center;padding:2rem;color:var(--text-secondary)\">No hay implementos para mostrar.</td></tr>";
    return;
  }

  tbody.innerHTML = "";
  implementos.slice(0, 8).forEach((impl, index) => {
    const fila = document.createElement("tr");
    const cls =
      impl.estado === "DISPONIBLE"
        ? "disponible"
        : impl.estado === "MANTENIMIENTO"
          ? "mantenimiento"
          : "prestado";
    fila.innerHTML = `
      <td>${String(index + 1).padStart(3, "0")}</td>
      <td><i class="fa-solid fa-box icono-tabla"></i> ${impl.nombre}</td>
      <td>${impl.categoria}</td>
      <td>${impl.cantidadTotal}</td>
      <td>${impl.cantidadDisponible}</td>
      <td><span class="estado ${cls}">${impl.estado.replace("_", " ")}</span></td>
    `;
    tbody.appendChild(fila);
  });
}

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
