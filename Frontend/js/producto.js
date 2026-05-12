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

const btnsPeriodo = document.querySelectorAll(".btn-periodo");
let tipoPeriodo   = "dia";
let precioDiaVal  = 0;
let precioHoraVal = 0;
let implementoActual = null;

btnsPeriodo.forEach((btn) => {
  btn.addEventListener("click", () => {
    btnsPeriodo.forEach((b) => b.classList.remove("activo"));
    btn.classList.add("activo");
    tipoPeriodo = btn.dataset.tipo;
    calcularTotal();
  });
});

const fechaInicio   = document.getElementById("fechaInicio");
const fechaFin      = document.getElementById("fechaFin");
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

  if (tipoPeriodo === "dia") {
    const dias  = Math.ceil((msFin - msInicio) / (1000 * 60 * 60 * 24));
    const total = dias * (Number(precioDiaVal) || 0);
    if (resumenPrecio)
      resumenPrecio.innerHTML = `<i class="fa-solid fa-calculator"></i> <strong>${dias} dia${dias > 1 ? "s" : ""}</strong> x $${Number(precioDiaVal || 0).toLocaleString()} = <strong style="color:var(--detalles-azul)">$${total.toLocaleString()} COP</strong>`;
  } else {
    const horas = Math.ceil((msFin - msInicio) / (1000 * 60 * 60));
    const total = horas * (Number(precioHoraVal) || 0);
    if (resumenPrecio)
      resumenPrecio.innerHTML = `<i class="fa-solid fa-calculator"></i> <strong>${horas} hora${horas > 1 ? "s" : ""}</strong> x $${Number(precioHoraVal || 0).toLocaleString()} = <strong style="color:var(--detalles-azul)">$${total.toLocaleString()} COP</strong>`;
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
    btnLogin.textContent    = "Mi cuenta";
    btnLogin.href           = destino;
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

  const params    = new URLSearchParams(location.search);
  const id        = params.get("id");
  const btnRentar = document.querySelector(".btn-rentar-prod");
  const aviso     = document.querySelector(".prod-aviso");

  if (btnRentar) {
    btnRentar.setAttribute("href", "#");
    btnRentar.addEventListener("click", async (e) => {
      e.preventDefault();

      if (!sesion.estaLogueado()) {
        window.location.href = "login.html";
        return;
      }

      if (!implementoActual) {
        if (!id) {
          await ui.toast("No se pudo identificar el implemento.", "error");
          return;
        }
        try {
          const res = await fetch(`http://localhost:8080/api/implementos/${id}`);
          if (res.ok) implementoActual = await res.json();
        } catch (err) {
          console.error(err);
        }
        if (!implementoActual) {
          await ui.toast("Cargando datos del implemento...", "info");
          return;
        }
      }

      const inicio = fechaInicio?.value || "";
      const fin = fechaFin?.value || "";
      if (!inicio || !fin) {
        await ui.alert("Faltan fechas", "Selecciona fechas de renta antes de continuar.", "warning");
        return;
      }

      const msInicio = new Date(inicio).getTime();
      const msFin = new Date(fin).getTime();
      if (Number.isNaN(msInicio) || Number.isNaN(msFin) || msFin <= msInicio) {
        await ui.alert("Fechas invalidas", "La fecha fin debe ser posterior a la de inicio.", "warning");
        return;
      }

      carritoAPI.agregar({
        id: implementoActual.id,
        nombre: implementoActual.nombre,
        categoria: implementoActual.categoria,
        precioDia: Number(precioDiaVal) || 0,
        precioHora: Number(precioHoraVal) || 0,
        imagen: implementoActual.imagenes?.[0] || implementoActual.imagenUrl || implementoActual.imagenBase64 || implementoActual.imagen || "",
        observaciones: implementoActual.observaciones || "",
        tipoPeriodo: tipoPeriodo || "dia",
        fechaInicio: fechaInicio?.value || "",
        fechaFin: fechaFin?.value || "",
      });

      await ui.toast("Añadido al carrito", "success");
      window.location.href = `carrito.html?added=1&id=${encodeURIComponent(implementoActual.id)}`;
    });
  }

  if (sesion.estaLogueado()) {
    if (aviso) aviso.style.display = "none";
  }

  if (!id) return;

  try {
    const res = await fetch(`http://localhost:8080/api/implementos/${id}`);
    if (!res.ok) throw new Error("Implemento no encontrado");
    const impl = await res.json();
    implementoActual = impl;

    const { badge, clase } = mapEstado(impl.estado);
    const categoria        = impl.categoria || "Implemento";
    const catNorm          = categoria.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const categoriaIcono   = catNorm === "futbol" ? "fa-futbol" : "fa-basketball";

    document.title = `${impl.nombre} | SportDeal FET`;
    const categoriaTag = document.querySelector(".prod-categoria-tag");
    const tituloProducto = document.querySelector(".prod-titulo");
    const refProducto = document.querySelector(".prod-ref");
    if (categoriaTag) categoriaTag.innerHTML = `<i class="fa-solid ${categoriaIcono}"></i> ${categoria}`;
    if (tituloProducto) tituloProducto.textContent = impl.nombre;
    if (refProducto) {
      refProducto.textContent =
        `Referencia: #IMP-${String(impl.id).padStart(3, "0")}` +
        (impl.marca ? ` · Marca: ${impl.marca}` : "") +
        (impl.talla ? ` · Talla: ${impl.talla}` : "");
    }

    const observaciones = document.querySelector(".prod-observaciones");
    if (observaciones) {
      observaciones.textContent = impl.observaciones || "Sin descripción adicional registrada por el admin.";
    }

    const badgeEl = document.querySelector(".gal-badge");
    if (badgeEl) {
      badgeEl.classList.remove("disponible", "prestado", "mantenimiento");
      badgeEl.classList.add(clase);
      badgeEl.textContent = badge;
    }

    const condicionTexto = document.querySelector(".condicion-texto");
    if (condicionTexto)
      condicionTexto.innerHTML = `Estado actual: <strong>${impl.condicion}</strong>`;

    const barra = document.querySelector(".condicion-barra");
    if (barra) {
      const mapa = { "Excelente": 100, "Buena": 75, "Regular": 45 };
      barra.style.width = `${mapa[impl.condicion] || 60}%`;
    }

    //Galería 
    const galGrande = document.querySelector(".galeria-img-grande");
    const galMini   = document.querySelector(".galeria-miniaturas");

    const imgs = [];
    if (impl.imagenes && Array.isArray(impl.imagenes) && impl.imagenes.length) {
      imgs.push(...impl.imagenes);
    } else {
      const src = impl.imagenBase64 || impl.imagenUrl || impl.imagen || "";
      if (src) imgs.push(src);
    }

    if (galGrande) {
      if (imgs.length) galGrande.innerHTML = `<img src="${imgs[0]}" alt="${impl.nombre}" />`;
      else galGrande.innerHTML = `<div class="galeria-img-placeholder azul"><i class="fa-solid fa-basketball"></i></div>`;
    }

    if (galMini) {
      galMini.innerHTML = imgs.length
        ? imgs.map((s, i) => `
        <div class="miniatura ${i === 0 ? "activa" : ""}">
          <img src="${s}" alt="mini-${i}" />
        </div>`).join("")
        : `<div class="miniatura activa azul"><i class="fa-solid fa-basketball"></i></div>`;

      document.querySelectorAll(".miniatura").forEach((m) => {
        m.addEventListener("click", () => {
          document.querySelectorAll(".miniatura").forEach((x) => x.classList.remove("activa"));
          m.classList.add("activa");
          const img = m.querySelector("img");
          if (img && galGrande) galGrande.innerHTML = `<img src="${img.src}" alt="${impl.nombre}" />`;
        });
      });
    }

    // Precios
    precioDiaVal  = impl.precioDia  || 0;
    precioHoraVal = impl.precioHora || 0;

    const fmt      = (v) => new Intl.NumberFormat("es-CO").format(Number(v || 0));
    const precioEls = document.querySelectorAll(".precio-valor");
    if (precioEls[0]) precioEls[0].innerHTML = `$${fmt(precioDiaVal)} <small>COP</small>`;
    if (precioEls[1]) precioEls[1].innerHTML = `$${fmt(precioHoraVal)} <small>COP</small>`;

    calcularTotal();

  } catch (error) {
    ui.toast(error.message || "No se pudo cargar el producto", "error");
  }
}

document.addEventListener("DOMContentLoaded", initProducto);