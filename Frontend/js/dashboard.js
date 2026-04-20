// dashboard.js - SportDeal FET
// Toggle del sidebar en móvil/tablet

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const btnAbrir = document.getElementById("btnAbrirSidebar");
const btnCerrar = document.getElementById("btnCerrarSidebar");
const tituloSeccion = document.getElementById("tituloSeccion");

function abrirSidebar() {
  sidebar.classList.add("abierto");
  overlay.classList.add("visible");
}

function cerrarSidebar() {
  sidebar.classList.remove("abierto");
  overlay.classList.remove("visible");
}

btnAbrir.addEventListener("click", abrirSidebar);
btnCerrar.addEventListener("click", cerrarSidebar);
overlay.addEventListener("click", cerrarSidebar);

// Actualizar título del topbar al hacer clic en nav
const navLinks = document.querySelectorAll(".nav-link");
const navItems = document.querySelectorAll(".nav-item");

const titulos = {
  dashboard: "Dashboard",
  implementos: "Implementos",
  prestamos: "Préstamos",
  usuarios: "Usuarios",
  reportes: "Reportes",
};

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    // Quitar activo de todos
    navItems.forEach((item) => item.classList.remove("activo"));
    // Activar el clickeado
    link.closest(".nav-item").classList.add("activo");
    // Cambiar título
    const seccion = link.dataset.seccion;
    tituloSeccion.textContent = titulos[seccion] || "Dashboard";
    // Cerrar sidebar en móvil
    cerrarSidebar();
  });
});
