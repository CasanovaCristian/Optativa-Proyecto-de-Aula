// cliente.js - SportDeal FET
// Toggle sidebar del dashboard del cliente

const sidebarCli    = document.getElementById('sidebarCli');
const overlay       = document.getElementById('overlay');
const btnAbrir      = document.getElementById('btnAbrirSidebar');
const btnCerrar     = document.getElementById('btnCerrarSidebar');

function abrirSidebar() {
  sidebarCli.classList.add('abierto');
  overlay.classList.add('visible');
}

function cerrarSidebar() {
  sidebarCli.classList.remove('abierto');
  overlay.classList.remove('visible');
}

btnAbrir?.addEventListener('click', abrirSidebar);
btnCerrar?.addEventListener('click', cerrarSidebar);
overlay?.addEventListener('click', cerrarSidebar);
