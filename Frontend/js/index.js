// index.js - SportDeal FET
// Filtros del catálogo público y toggle de navbar

// --- Hamburguesa navbar ---
const btnHamburguesa = document.getElementById('btnHamburguesa');
const navLinks = document.getElementById('navLinks');

btnHamburguesa?.addEventListener('click', () => {
  navLinks.classList.toggle('abierto');
});

// --- Filtro por categoría ---
const btnsCat = document.querySelectorAll('.btn-cat');
const tarjetas = document.querySelectorAll('.tarjeta-producto');

btnsCat.forEach(btn => {
  btn.addEventListener('click', () => {
    btnsCat.forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');

    const cat = btn.dataset.cat;
    tarjetas.forEach(t => {
      const mostrar = cat === 'todos' || t.dataset.cat === cat;
      t.style.display = mostrar ? 'flex' : 'none';
    });
  });
});

// --- Filtro por disponibilidad ---
const filtroDisp = document.getElementById('filtroDisponibilidad');
filtroDisp?.addEventListener('change', () => {
  const val = filtroDisp.value;
  tarjetas.forEach(t => {
    const mostrar = !val || t.dataset.estado === val;
    t.style.display = mostrar ? 'flex' : 'none';
  });
  // Resetear categoría al usar filtro de disponibilidad
  btnsCat.forEach(b => b.classList.remove('activo'));
  btnsCat[0]?.classList.add('activo');
});
