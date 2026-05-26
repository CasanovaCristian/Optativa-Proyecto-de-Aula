const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");

export function abrirSidebar() {
  sidebar?.classList.add("abierto");
  overlay?.classList.add("visible");
}

export function cerrarSidebar() {
  sidebar?.classList.remove("abierto");
  overlay?.classList.remove("visible");
}

// [UI - SIDEBAR ADMIN] — conecta el menú lateral del panel admin (abrir, cerrar, overlay)
export function initSidebar() {
  const btnAbrir = document.getElementById("btnAbrirSidebar");
  const btnCerrar = document.getElementById("btnCerrarSidebar");
  const navItems = document.querySelectorAll(".nav-item");

  btnAbrir?.addEventListener("click", abrirSidebar);
  btnCerrar?.addEventListener("click", cerrarSidebar);
  overlay?.addEventListener("click", cerrarSidebar);
  navItems.forEach((link) =>
    link.addEventListener("click", () => {
      navItems.forEach((i) => i.classList.remove("activo"));
      cerrarSidebar();
    })
  );
}

// [UI - OBTENER INICIALES] — extrae las iniciales del nombre para mostrarlas en avatares
export function obtenerIniciales(nombre) {
  if (!nombre) return "??";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

// [UI - FORMATEAR FECHA] — convierte una fecha ISO a formato legible en español (ej: 12 may. 2025)
export function formatearFecha(fechaIso) {
  if (!fechaIso) return "-";
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "-";
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// [UI - MODAL GENÉRICO] — construye y muestra un modal con título, cuerpo HTML y botones Cancelar/Guardar
export function crearModal(id, titulo, contenidoHTML, onConfirm) {
  document.getElementById(id)?.remove();

  const modal = document.createElement("div");
  modal.id = id;
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,.5);
    display:flex; align-items:center; justify-content:center; z-index:9999;
  `;
  modal.innerHTML = `
    <div style="background:var(--bg-card,#1e2130); border-radius:12px; padding:2rem;
                width:min(480px,90vw); max-height:90vh; overflow-y:auto;
                box-shadow:0 8px 32px rgba(0,0,0,.4);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
        <h3 style="margin:0; color:var(--text-primary,#fff); font-size:1.1rem;">${titulo}</h3>
        <button id="${id}-cerrar" style="background:none; border:none; color:var(--text-secondary,#aaa); cursor:pointer; font-size:1.2rem;">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div id="${id}-body">${contenidoHTML}</div>
      <div style="display:flex; gap:.75rem; margin-top:1.5rem; justify-content:flex-end;">
        <button id="${id}-cancelar" style="padding:.6rem 1.2rem; border-radius:8px; border:1px solid var(--border,#333);
                background:transparent; color:var(--text-secondary,#aaa); cursor:pointer;">
          Cancelar
        </button>
        <button id="${id}-confirmar" style="padding:.6rem 1.4rem; border-radius:8px; border:none;
                background:var(--detalles-azul,#3b82f6); color:#fff; cursor:pointer; font-weight:600;">
          Guardar
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cerrar = () => modal.remove();
  modal.addEventListener("click", (e) => {
    if (e.target === modal) cerrar();
  });
  document.getElementById(`${id}-cerrar`)?.addEventListener("click", cerrar);
  document.getElementById(`${id}-cancelar`)?.addEventListener("click", cerrar);
  document.getElementById(`${id}-confirmar`)?.addEventListener("click", async () => {
    await onConfirm(cerrar);
  });
}
