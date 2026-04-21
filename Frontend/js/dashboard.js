// dashboard.js - SportDeal FET
// Toggle del sidebar en móvil/tablet

const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const btnAbrir = document.getElementById("btnAbrirSidebar");
const btnCerrar = document.getElementById("btnCerrarSidebar");

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

forEach((link) => {
  link.addEventListener("click", () => {
    // Quitar activo de todos
    navItems.forEach((item) => item.classList.remove("activo"));
    cerrarSidebar();
  });
});
