// carrito.js

const btnHamburguesa = document.getElementById("btnHamburguesa");
const navLinks = document.getElementById("navLinks");
const carritoItemsCol = document.querySelector(".carrito-items-col");
const carritoVacio = document.getElementById("carritoVacio");
const carritoCount = document.querySelector(".carrito-count");
const subtotalEl = document.querySelector(".resumen-linea.subtotal span:last-child");
const descuentoEl = document.querySelector(".resumen-linea.descuento span:last-child");
const totalEl = document.querySelector(".resumen-linea.total span:last-child");
const btnCheckout = document.querySelector(".btn-checkout");

btnHamburguesa?.addEventListener("click", () => navLinks?.classList.toggle("abierto"));

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

function formatearMoneda(valor) {
  return `$${new Intl.NumberFormat("es-CO").format(Number(valor || 0))} COP`;
}

function actualizarItem(id, cambios) {
  const items = carritoAPI.obtener();
  const item = items.find((x) => String(x.id) === String(id));
  if (!item) return;
  Object.assign(item, cambios);
  carritoAPI.guardar(items);
}

// [CARRITO - CALCULAR DURACIÓN RENTA] — calcula días u horas según el tipoPeriodo del item
function calcularDuracion(item) {
  if (item.tipoPeriodo === "hora" && Number(item.horasRenta) > 0) {
    return { unidad: "hora", cantidad: Math.max(1, Math.floor(Number(item.horasRenta))) };
  }
  if (!item.fechaInicio || !item.fechaFin) return null;
  const msInicio = new Date(item.fechaInicio).getTime();
  const msFin = new Date(item.fechaFin).getTime();
  if (!msInicio || !msFin || msFin <= msInicio) return null;
  if (item.tipoPeriodo === "hora") {
    return { unidad: "hora", cantidad: Math.ceil((msFin - msInicio) / (1000 * 60 * 60)) };
  }
  return { unidad: "dia", cantidad: Math.ceil((msFin - msInicio) / (1000 * 60 * 60 * 24)) };
}

// [CARRITO - CALCULAR SUBTOTAL ITEM] — precio × duración × cantidad para un item del carrito
function calcularSubtotalItem(item) {
  const duracion = calcularDuracion(item);
  const precioBase = Number(item.tipoPeriodo === "hora" ? item.precioHora : item.precioDia) || 0;
  const factor = duracion ? duracion.cantidad : 1;
  return precioBase * factor * Number(item.cantidad || 1);
}

// [CARRITO - AGREGAR DESDE URL] — si la URL tiene ?id=X&added=1, agrega ese implemento al carrito automáticamente
async function cargarImplementoDesdeQuerySiHaceFalta() {
  // Protección adicional: si es ADMIN, no permitir agregar
  if (sesion?.esAdmin?.()) return;

  const itemsActuales = carritoAPI.obtener();
  if (itemsActuales.length) return;

  const params = new URLSearchParams(location.search);
  const id = params.get("id");
  const added = params.get("added");
  if (!id || added !== "1") return;

  const res = await fetch(`http://localhost:8080/api/implementos/${id}`);
  if (!res.ok) return;
  const impl = await res.json();

  carritoAPI.agregar({
    id: impl.id,
    nombre: impl.nombre,
    categoria: impl.categoria,
    precioDia: Number(impl.precioDia) || 0,
    precioHora: Number(impl.precioHora) || 0,
    imagen: impl.imagenes?.[0] || impl.imagenUrl || impl.imagenBase64 || impl.imagen || "",
    observaciones: impl.observaciones || "",
    horasRenta: Number(impl.horasRenta) || 1,
  });

  history.replaceState({}, document.title, "carrito.html");
  await ui.toast("Añadido al carrito", "success");
}

// [CARRITO - RENDERIZAR VISTA] — pinta todos los items del carrito y calcula subtotal, descuento y total
function renderCarrito() {
  const items = carritoAPI.obtener();
  let necesitaGuardar = false;
  items.forEach((item) => {
    if (!item.tipoPeriodo) {
      item.tipoPeriodo = "dia";
      necesitaGuardar = true;
    }
  });
  if (necesitaGuardar) carritoAPI.guardar(items);
  const cantidadTotal = items.reduce((acc, item) => acc + Number(item.cantidad || 1), 0);
  const subtotal = items.reduce((acc, item) => acc + calcularSubtotalItem(item), 0);
  const descuento = descuentoEl ? subtotal * 0.1 : 0;
  const total = subtotal - descuento;

  if (carritoCount) carritoCount.textContent = `${cantidadTotal} implemento${cantidadTotal === 1 ? "" : "s"}`;
  if (subtotalEl) subtotalEl.textContent = formatearMoneda(subtotal);
  if (descuentoEl) descuentoEl.textContent = `-${formatearMoneda(descuento).replace(" COP", "")}`;
  if (totalEl) totalEl.textContent = formatearMoneda(total);

  if (!carritoItemsCol) return;

  const itemsHtml = items.map((item) => {
    const precio = Number(item.tipoPeriodo === "hora" ? item.precioHora : item.precioDia) || 0;
    const duracion = calcularDuracion(item);
    const subtotalItem = calcularSubtotalItem(item);
    const fechaInicioVal = item.fechaInicio || "";
    const fechaFinVal = item.fechaFin || "";
    const tipoPeriodoVal = item.tipoPeriodo || "dia";
    const horasVal = Math.max(1, Number(item.horasRenta || 1));
    const imagen = item.imagen
      ? `<div class="item-imagen"><img src="${item.imagen}" alt="${item.nombre}" /></div>`
      : `<div class="item-imagen azul"><i class="fa-solid fa-basketball"></i></div>`;

    return `
      <article class="carrito-item">
        ${imagen}
        <div class="item-info">
          <div class="item-top">
            <div>
              <span class="item-cat">${item.categoria || "Implemento"}</span>
              <h3 class="item-titulo">${item.nombre}</h3>
              <span class="item-ref">${item.observaciones || "Sin observaciones."}</span>
            </div>
            <button class="btn-eliminar-item" data-id="${item.id}"><i class="fa-solid fa-trash"></i></button>
          </div>
          <div class="item-fechas">
            <div class="item-fecha-campo">
              <label>Inicio</label>
              <input type="date" class="input-fecha-item" data-id="${item.id}" data-field="fechaInicio" value="${fechaInicioVal}" />
            </div>
            <span class="fecha-arrow"><i class="fa-solid fa-arrow-right"></i></span>
            <div class="item-fecha-campo ${tipoPeriodoVal === "hora" ? "" : ""}" ${tipoPeriodoVal === "hora" ? 'style="display:none;"' : ""}>
              <label>Fin</label>
              <input type="date" class="input-fecha-item" data-id="${item.id}" data-field="fechaFin" value="${fechaFinVal}" />
            </div>
            <div class="item-fecha-campo" ${tipoPeriodoVal === "hora" ? "" : 'style="display:none;"'}>
              <label>Horas</label>
              <input type="number" min="1" step="1" class="input-horas-item" data-id="${item.id}" data-field="horasRenta" value="${horasVal}" style="height:34px;border:1px solid var(--borde);border-radius:7px;padding:0 0.6rem;font-size:0.78rem;color:var(--gris-principal);outline:none;background-color:#f8f9fb;font-family:var(--font-secundaria);" />
            </div>
            <div class="item-tipo">
              <label>Tipo</label>
              <select class="select-tipo-item" data-id="${item.id}" data-field="tipoPeriodo">
                <option value="dia" ${tipoPeriodoVal === "dia" ? "selected" : ""}>Por dia</option>
                <option value="hora" ${tipoPeriodoVal === "hora" ? "selected" : ""}>Por hora</option>
              </select>
            </div>
          </div>
          <div class="item-bottom">
            <div style="display:flex;align-items:center;gap:.75rem;">
              <label style="font-size:.78rem;color:var(--texto-gris);">Cantidad</label>
              <input type="number" min="1" class="input-cantidad-item" data-id="${item.id}" value="${item.cantidad || 1}" style="width:72px;padding:.35rem;border-radius:6px;border:1px solid var(--borde);background:#f8f9fb;" />
            </div>
            <span class="item-duracion">
              ${duracion
                ? `Renta: ${duracion.cantidad} ${duracion.unidad}${duracion.cantidad > 1 ? "s" : ""}`
                : "Renta: sin fechas"}
            </span>
            <span class="item-subtotal">${formatearMoneda(subtotalItem)}</span>
          </div>
        </div>
      </article>
    `;
  }).join("");

  const lista = carritoItemsCol.querySelector(".carrito-lista") || document.createElement("div");
  lista.className = "carrito-lista";
  lista.innerHTML = itemsHtml;

  const header = carritoItemsCol.querySelector(".carrito-header-titulo");
  const vacio = document.getElementById("carritoVacio");
  const boton = carritoItemsCol.querySelector(".btn-seguir-comprando");

  const listaActual = carritoItemsCol.querySelector(".carrito-lista");
  if (!listaActual) {
    if (boton) carritoItemsCol.insertBefore(lista, boton);
    else carritoItemsCol.appendChild(lista);
  } else {
    carritoItemsCol.replaceChild(lista, listaActual);
  }

  if (vacio) vacio.style.display = items.length ? "none" : "block";

  lista.querySelectorAll(".btn-eliminar-item").forEach((btn) => {
    btn.addEventListener("click", async () => {
      carritoAPI.eliminar(btn.dataset.id);
      await ui.toast("Item eliminado del carrito", "success");
      renderCarrito();
    });
  });

  lista.querySelectorAll(".input-fecha-item").forEach((input) => {
    input.addEventListener("change", () => {
      actualizarItem(input.dataset.id, { [input.dataset.field]: input.value });
      renderCarrito();
    });
  });

  lista.querySelectorAll(".select-tipo-item").forEach((select) => {
    select.addEventListener("change", () => {
      actualizarItem(select.dataset.id, { [select.dataset.field]: select.value });
      renderCarrito();
    });
  });

  lista.querySelectorAll(".input-horas-item").forEach((input) => {
    const id = input.dataset.id;
    input.addEventListener("change", () => {
      let v = parseInt(input.value, 10);
      if (Number.isNaN(v) || v < 1) v = 1;
      input.value = v;
      actualizarItem(id, { horasRenta: v });
      renderCarrito();
    });
    input.addEventListener("input", () => {
      const raw = input.value.replace(/[^0-9]/g, "") || "1";
      input.value = raw;
    });
  });

  lista.querySelectorAll(".input-cantidad-item").forEach((input) => {
    const id = input.dataset.id;
    input.addEventListener("change", () => {
      let v = parseInt(input.value, 10);
      if (Number.isNaN(v) || v < 1) v = 1;
      input.value = v;
      actualizarItem(id, { cantidad: v });
      renderCarrito();
    });
    input.addEventListener("input", () => {
      // allow typing but normalize on blur/change
      const raw = input.value.replace(/[^0-9]/g, "") || "1";
      input.value = raw;
    });
  });
}

// [INICIALIZACIÓN - CARRITO] — punto de entrada de carrito.html; verifica sesión, conecta eventos del checkout
async function initCarrito() {
  await cargarScript("js/api.js", "api");
  if (!window.sesion) return;

  if (!sesion.estaLogueado()) {
    window.location.href = "login.html";
    return;
  }

  // Redirigir a ADMINs a su dashboard (no pueden acceder al carrito)
  if (sesion.esAdmin()) {
    window.location.href = "dashboard.html";
    return;
  }

  const usuario = sesion.getUsuario();
  const btnLogin = document.querySelector(".btn-nav-login");
  const btnRegistro = document.querySelector(".btn-nav-registro");
  if (btnLogin && btnRegistro) {
    btnLogin.textContent = "Mi cuenta";
    btnLogin.href = usuario?.rol === "ADMIN" ? "dashboard.html" : "cliente-dashboard.html";
    btnRegistro.textContent = "Cerrar sesion";
    btnRegistro.href = "#";
    btnRegistro.addEventListener("click", (e) => { e.preventDefault(); authAPI.logout(); });
  }

  const btnCheckout = document.querySelector(".btn-checkout");
  if (btnCheckout) {
    btnCheckout.setAttribute("href", "#");
    // [CARRITO - PROCESAR CHECKOUT] — valida fechas, crea un préstamo por cada item y limpia el carrito
    btnCheckout.addEventListener("click", async (e) => {
      e.preventDefault();
      const items = carritoAPI.obtener();
      if (!items.length) {
        await ui.alert("Carrito vacío", "Agrega un implemento antes de continuar.", "info");
        return;
      }

      const itemsInvalidos = items.filter((item) => {
        const inicio = item.fechaInicio && !Number.isNaN(new Date(`${item.fechaInicio}T00:00:00`).getTime());
        if (!inicio) return true;

        if (item.tipoPeriodo === "hora") {
          return !(Number(item.horasRenta) > 0);
        }

        const fin = item.fechaFin && !Number.isNaN(new Date(`${item.fechaFin}T23:59:59`).getTime());
        if (!fin) return true;

        return new Date(`${item.fechaFin}T23:59:59`) <= new Date(`${item.fechaInicio}T00:00:00`);
      });
      if (itemsInvalidos.length) {
        await ui.alert("Datos incompletos", "Revisa las fechas u horas de los items antes de continuar.", "warning");
        return;
      }

      btnCheckout.setAttribute("aria-busy", "true");
      btnCheckout.classList.add("cargando");

      try {
        const usuario = sesion.getUsuario();
        for (const item of items) {
          const cantidad = Math.max(1, Number(item.cantidad || 1));
          const fechaInicio = item.fechaInicio ? new Date(`${item.fechaInicio}T00:00:00`) : null;
          const horas = Math.max(1, Number(item.horasRenta || 1));

          if (!fechaInicio || Number.isNaN(fechaInicio.getTime())) {
            throw new Error("Hay fechas inválidas en uno de los items del carrito.");
          }

          if (item.tipoPeriodo === "dia") {
            const fechaFin = item.fechaFin ? new Date(`${item.fechaFin}T23:59:59`) : null;
            if (!fechaFin || Number.isNaN(fechaFin.getTime())) {
              throw new Error("Hay fechas inválidas en uno de los items del carrito.");
            }
            if (fechaFin <= fechaInicio) {
              throw new Error("La fecha de fin debe ser posterior a la fecha de inicio.");
            }
          }

          const fechaDevolucionEsperada =
            item.tipoPeriodo === "hora"
              ? new Date(fechaInicio.getTime() + horas * 60 * 60 * 1000)
              : new Date(`${item.fechaFin}T23:59:59`);

          // El backend crea un préstamo por unidad y descuenta el stock allí mismo.
          for (let i = 0; i < cantidad; i += 1) {
            const payload = {
              usuarioId: usuario?.id,
              implementoId: item.id,
              fechaDevolucionEsperada: fechaDevolucionEsperada.toISOString(),
              observaciones: item.observaciones || null,
            };
            console.log("Payload enviado a /prestamos:", payload);
            await prestamosAPI.crear(payload);
          }
        }

        carritoAPI.limpiar();
        renderCarrito();
        await ui.alert("Compra registrada", "Se registró la renta y se actualizó el inventario.", "success");
      } catch (err) {
        console.error(err);
        await ui.alert("No se pudo registrar", err?.message || "Intenta de nuevo.", "error");
      } finally {
        btnCheckout.removeAttribute("aria-busy");
        btnCheckout.classList.remove("cargando");
      }
    });
  }

  if (!carritoAPI.obtener().length) {
    if (carritoVacio) carritoVacio.style.display = "block";
  }

  await cargarImplementoDesdeQuerySiHaceFalta();
  renderCarrito();
}

document.addEventListener("DOMContentLoaded", initCarrito);
