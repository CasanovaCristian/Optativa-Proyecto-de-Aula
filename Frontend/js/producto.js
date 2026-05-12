// producto.js - SportDeal FET

const btnHamburguesa = document.getElementById("btnHamburguesa");
const navLinks       = document.getElementById("navLinks");
btnHamburguesa?.addEventListener("click", () => navLinks?.classList.toggle("abierto"));

// Miniaturas galeria
const miniaturas = document.querySelectorAll(".miniatura");
miniaturas.forEach((m) => {
  m.addEventListener("click", () => {
    miniaturas.forEach((x) => x.classList.remove("activa"));
    m.classList.add("activa");
  });
});

// Selector periodo
const btnsPeriodo = document.querySelectorAll(".btn-periodo");
let tipoPeriodo   = "dia";
const PRECIO_DIA  = 8000;

btnsPeriodo.forEach((btn) => {
  btn.addEventListener("click", () => {
    btnsPeriodo.forEach((b) => b.classList.remove("activo"));
    btn.classList.add("activo");
    tipoPeriodo = btn.dataset.tipo;
    calcularTotal();
  });
});

const fechaInicio  = document.getElementById("fechaInicio");
const fechaFin     = document.getElementById("fechaFin");
const resumenPrecio = document.getElementById("resumenPrecio");

function calcularTotal() {
  const inicio = fechaInicio?.value;
  const fin    = fechaFin?.value;

  if (!inicio || !fin) {
    if (resumenPrecio) resumenPrecio.innerHTML = '<i class="fa-solid fa-calculator"></i> Selecciona las fechas para ver el total';
    return;
  }

  const msInicio = new Date(inicio).getTime();
  const msFin    = new Date(fin).getTime();

  if (msFin <= msInicio) {
    if (resumenPrecio) resumenPrecio.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> La fecha fin debe ser posterior a la de inicio';
    return;
  }

  const dias = Math.ceil((msFin - msInicio) / (1000 * 60 * 60 * 24));
  if (resumenPrecio) {
    if (tipoPeriodo === "dia") {
      const total = dias * PRECIO_DIA;
      resumenPrecio.innerHTML = `<i class="fa-solid fa-calculator"></i> <strong>${dias} dia${dias > 1 ? "s" : ""}</strong> x $${PRECIO_DIA.toLocaleString()} = <strong style="color:var(--detalles-azul)">$${total.toLocaleString()} COP</strong>`;
    } else {
      resumenPrecio.innerHTML = '<i class="fa-solid fa-calculator"></i> Indica las horas al agregar al carrito';
    }
  }
}

fechaInicio?.addEventListener("change", calcularTotal);
fechaFin?.addEventListener("change", calcularTotal);

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
    script.src   = src;
    script.async = true;
    script.dataset.scriptId = id;
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(script);
  });
}

function mapEstado(estado) {
  if (estado === "DISPONIBLE")  return { badge: "Disponible",    clase: "disponible" };
  if (estado === "EN_PRESTAMO") return { badge: "En renta",      clase: "prestado" };
  return                               { badge: "Mantenimiento", clase: "mantenimiento" };
}

function actualizarNavPublica() {
  const btnLogin    = document.querySelector(".btn-nav-login");
  const btnRegistro = document.querySelector(".btn-nav-registro");
  if (!btnLogin || !btnRegistro) return;

  if (sesion?.estaLogueado?.()) {
    const usuario = sesion.getUsuario();
    const destino = usuario?.rol === "ADMIN" ? "dashboard.html" : "cliente-dashboard.html";
    btnLogin.textContent = "Mi cuenta";
    btnLogin.href        = destino;
    btnRegistro.textContent = "Cerrar sesion";
    btnRegistro.href        = "#";
    btnRegistro.addEventListener("click", (e) => { e.preventDefault(); authAPI.logout(); });
  } else {
    btnLogin.textContent    = "Iniciar Sesion";
    btnLogin.href           = "login.html";
    btnRegistro.textContent = "Crear Cuenta";
    btnRegistro.href        = "register.html";
  }
}

async function initProducto() {
  try {
    await cargarScript("js/api.js", "api");
  } catch (error) {
    console.error(error);
    return;
  }

  if (!window.sesion) return;

  actualizarNavPublica();

  const params     = new URLSearchParams(location.search);
  const id         = params.get("id");
  const btnRentar  = document.querySelector(".btn-rentar-prod");
  const aviso      = document.querySelector(".prod-aviso");

  // Botón rentar: si hay sesión va al carrito, si no va al login
  if (sesion.estaLogueado()) {
    btnRentar?.setAttribute("href", "carrito.html");
    if (aviso) aviso.style.display = "none";
  } else {
    btnRentar?.setAttribute("href", "login.html");
  }

  // ✅ El producto siempre carga, con o sin sesión
  if (!id) return;

  try {
    const res = await fetch(`http://localhost:8080/api/implementos/${id}`);
    if (!res.ok) throw new Error("Implemento no encontrado");
    const impl = await res.json();

    const { badge, clase } = mapEstado(impl.estado);
    const categoria        = impl.categoria || "Implemento";
    const catNorm          = (categoria).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const categoriaIcono   = catNorm === "futbol" ? "fa-futbol" : "fa-basketball";

    document.title = `${impl.nombre} | SportDeal FET`;
    document.querySelector(".prod-categoria-tag")?.innerHTML = `<i class="fa-solid ${categoriaIcono}"></i> ${categoria}`;
    document.querySelector(".prod-titulo")?.textContent  = impl.nombre;
    document.querySelector(".prod-ref")?.textContent     = `Referencia: #IMP-${String(impl.id).padStart(3, "0")} · Condicion: ${impl.condicion}`;

    const badgeEl = document.querySelector(".gal-badge");
    if (badgeEl) {
      badgeEl.classList.remove("disponible", "prestado", "mantenimiento");
      badgeEl.classList.add(clase);
      badgeEl.textContent = badge;
    }

    const condicionTexto = document.querySelector(".condicion-texto");
    if (condicionTexto) condicionTexto.innerHTML = `Estado actual: <strong>${impl.condicion}</strong>`;

    const barra = document.querySelector(".condicion-barra");
    if (barra) {
      const mapa = { "Excelente": 100, "Buena": 75, "Regular": 45 };
      barra.style.width = `${mapa[impl.condicion] || 60}%`;
    }
  } catch (error) {
    ui.toast(error.message || "No se pudo cargar el producto", "error");
  }
}

document.addEventListener("DOMContentLoaded", initProducto);
