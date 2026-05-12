const btnHamburguesa = document.getElementById("btnHamburguesa");
const navLinks = document.getElementById("navLinks");
const btnsCat = document.querySelectorAll(".btn-cat");
const filtroDisp = document.getElementById("filtroDisponibilidad");
const filtroPrecio = document.getElementById("filtroPrecio");
const productosGrid = document.getElementById("productosGrid");
const totalProductos = document.querySelector(".total-productos");
const catalogoVacio = document.getElementById("catalogoVacio");
const paginaActual = (location.pathname.split("/").pop() || "").toLowerCase();

btnHamburguesa?.addEventListener("click", () => {
  navLinks?.classList.toggle("abierto");
});

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

function normalizarCategoria(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "");
}

function mapEstado(estado) {
  if (estado === "DISPONIBLE")  return { badge: "Disponible",    clase: "disponible",    data: "disponible" };
  if (estado === "EN_PRESTAMO") return { badge: "En renta",      clase: "prestado",      data: "prestado" };
  return                               { badge: "Mantenimiento", clase: "mantenimiento", data: "mantenimiento" };
}

function actualizarNavPublica() {
  const btnLogin    = document.querySelector(".btn-nav-login");
  const btnRegistro = document.querySelector(".btn-nav-registro");
  if (!btnLogin || !btnRegistro) return;

  if (sesion?.estaLogueado?.()) {
    const usuario = sesion.getUsuario();
    const destino = usuario?.rol === "ADMIN" ? "dashboard.html" : "cliente-dashboard.html";
    btnLogin.textContent = "Mi cuenta";
    btnLogin.href = destino;
    btnRegistro.textContent = "Cerrar sesion";
    btnRegistro.href = "#";
    btnRegistro.addEventListener("click", (e) => { e.preventDefault(); authAPI.logout(); });
  } else {
    btnLogin.textContent    = "Iniciar Sesion";
    btnLogin.href           = "login.html";
    btnRegistro.textContent = "Crear Cuenta";
    btnRegistro.href        = "register.html";
  }
}

function aplicarFiltros() {
  const catActiva = document.querySelector(".btn-cat.activo")?.dataset?.cat || "todos";
  const estado    = filtroDisp?.value || "";
  let tarjetas    = Array.from(document.querySelectorAll(".tarjeta-producto"));

  tarjetas.forEach((t) => {
    const matchCat    = catActiva === "todos" || t.dataset.cat === catActiva;
    const matchEstado = !estado || t.dataset.estado === estado;
    t.style.display   = matchCat && matchEstado ? "flex" : "none";
  });

  if (catalogoVacio) {
    const visibles = tarjetas.filter((t) => t.style.display !== "none");
    if (visibles.length) {
      catalogoVacio.style.display = "none";
    } else {
      catalogoVacio.textContent = "No hay implementos con esos filtros.";
      catalogoVacio.style.display = "block";
    }
  }

  const orden = filtroPrecio?.value || "";
  if (orden && productosGrid) {
    tarjetas = tarjetas.sort((a, b) => {
      const aVal = Number(a.dataset.disponible || 0);
      const bVal = Number(b.dataset.disponible || 0);
      return orden === "asc" ? aVal - bVal : bVal - aVal;
    });
    tarjetas.forEach((t) => productosGrid.appendChild(t));
  }
}

btnsCat.forEach((btn) => {
  btn.addEventListener("click", () => {
    btnsCat.forEach((b) => b.classList.remove("activo"));
    btn.classList.add("activo");
    aplicarFiltros();
  });
});

filtroDisp?.addEventListener("change", () => {
  btnsCat.forEach((b) => b.classList.remove("activo"));
  btnsCat[0]?.classList.add("activo");
  aplicarFiltros();
});

filtroPrecio?.addEventListener("change", aplicarFiltros);

async function initCatalogo() {
  if (!productosGrid) return;

  if (catalogoVacio) {
    catalogoVacio.textContent = "Cargando...";
    catalogoVacio.style.display = "block";
  }
  if (totalProductos) totalProductos.textContent = "Cargando...";

  const res = await fetch("http://localhost:8080/api/implementos");
  if (!res.ok) throw new Error("No se pudo cargar el catálogo");
  const implementos = await res.json();

  productosGrid.innerHTML = "";

  if (!implementos.length) {
    if (catalogoVacio) {
      catalogoVacio.textContent = "No hay implementos disponibles.";
      catalogoVacio.style.display = "block";
    }
    if (totalProductos) totalProductos.textContent = "0 implementos disponibles";
    return;
  }

  if (catalogoVacio) catalogoVacio.style.display = "none";

  implementos.forEach((impl) => {
    const { badge, clase, data } = mapEstado(impl.estado);
    const categoriaSlug = normalizarCategoria(impl.categoria);
    const articulo      = document.createElement("article");
    articulo.className  = "tarjeta-producto";
    articulo.dataset.cat        = categoriaSlug;
    articulo.dataset.estado     = data;
    articulo.dataset.disponible = impl.cantidadDisponible;

    const disponible  = impl.estado === "DISPONIBLE";
    // Si está logueado va al detalle; si no, al login
    const accionHref  = sesion.estaLogueado() ? `producto.html?id=${impl.id}` : "login.html";

    articulo.innerHTML = `
      <div class="tp-imagen">
        <div class="tp-img-placeholder azul">
          <i class="fa-solid fa-basketball"></i>
        </div>
        <span class="tp-badge ${clase}">${badge}</span>
        <span class="tp-cat">${impl.categoria}</span>
      </div>
      <div class="tp-info">
        <h3 class="tp-titulo">${impl.nombre}</h3>
        <p class="tp-desc">${impl.observaciones || "Implemento deportivo disponible para renta."}</p>
        <div class="tp-precios">
          <span class="tp-precio-principal"><strong>${impl.cantidadDisponible}</strong> disponibles</span>
          <span class="tp-precio-secundario">Total: ${impl.cantidadTotal}</span>
        </div>
        <div class="tp-acciones">
          <a href="producto.html?id=${impl.id}" class="btn-ver-detalle">Ver detalle</a>
          ${disponible
            ? `<a href="${accionHref}" class="btn-rentar">Rentar <i class="fa-solid fa-arrow-right"></i></a>`
            : `<button class="btn-rentar deshabilitado" disabled>No disponible</button>`}
        </div>
      </div>
    `;
    productosGrid.appendChild(articulo);
  });

  if (totalProductos) totalProductos.textContent = `${implementos.length} implementos disponibles`;
  aplicarFiltros();
}

async function initPaginaPublica() {
  await cargarScript("js/api.js", "api");
  actualizarNavPublica();

  if (paginaActual === "carrito.html") {
    requerirAuth();
    return;
  }

  // El catálogo siempre carga, con o sin sesión
  try {
    await initCatalogo();
  } catch (error) {
    ui.toast(error.message || "No se pudo cargar el catálogo", "error");
  }
}

document.addEventListener("DOMContentLoaded", initPaginaPublica);
