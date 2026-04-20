// producto.js - SportDeal FET

// Navbar hamburguesa
const btnHamburguesa = document.getElementById('btnHamburguesa');
const navLinks = document.getElementById('navLinks');
btnHamburguesa?.addEventListener('click', () => navLinks.classList.toggle('abierto'));

// Miniaturas galería
const miniaturas = document.querySelectorAll('.miniatura');
miniaturas.forEach(m => {
  m.addEventListener('click', () => {
    miniaturas.forEach(x => x.classList.remove('activa'));
    m.classList.add('activa');
  });
});

// Selector período (día / hora)
const btnsPeriodo = document.querySelectorAll('.btn-periodo');
let tipoPeriodo = 'dia';
const PRECIO_DIA  = 8000;
const PRECIO_HORA = 1500;

btnsPeriodo.forEach(btn => {
  btn.addEventListener('click', () => {
    btnsPeriodo.forEach(b => b.classList.remove('activo'));
    btn.classList.add('activo');
    tipoPeriodo = btn.dataset.tipo;
    calcularTotal();
  });
});

// Calcular total según fechas
const fechaInicio  = document.getElementById('fechaInicio');
const fechaFin     = document.getElementById('fechaFin');
const resumenPrecio = document.getElementById('resumenPrecio');

function calcularTotal() {
  const inicio = fechaInicio.value;
  const fin    = fechaFin.value;

  if (!inicio || !fin) {
    resumenPrecio.innerHTML = '<i class="fa-solid fa-calculator"></i> Selecciona las fechas para ver el total';
    return;
  }

  const msInicio = new Date(inicio).getTime();
  const msFin    = new Date(fin).getTime();

  if (msFin <= msInicio) {
    resumenPrecio.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> La fecha fin debe ser posterior a la de inicio';
    return;
  }

  const dias = Math.ceil((msFin - msInicio) / (1000 * 60 * 60 * 24));

  if (tipoPeriodo === 'dia') {
    const total = dias * PRECIO_DIA;
    resumenPrecio.innerHTML = `<i class="fa-solid fa-calculator"></i> <strong>${dias} día${dias > 1 ? 's' : ''}</strong> × $${PRECIO_DIA.toLocaleString()} = <strong style="color:var(--detalles-azul)">$${total.toLocaleString()} COP</strong>`;
  } else {
    resumenPrecio.innerHTML = `<i class="fa-solid fa-calculator"></i> Indica las horas al agregar al carrito`;
  }
}

fechaInicio.addEventListener('change', calcularTotal);
fechaFin.addEventListener('change', calcularTotal);
