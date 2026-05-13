import { crearModal } from "./ui-utils.js";

function obtenerImagenImplemento(impl) {
  return impl?.imagenes?.[0] || impl?.imagenUrl || impl?.imagenBase64 || impl?.imagen || "";
}

export async function initImplementos() {
  const tarjetaValores = document.querySelectorAll(".impl-tarjetas .ti-valor");
  const buscador = document.querySelector(".buscador input");
  const filtros = document.querySelectorAll(".select-filtro");
  const btnAgregar = document.querySelector(".btn-accion");
  const tbody = document.querySelector(".tabla-datos tbody");

  let implementos = [];

  const iconoPorCategoria = (cat) => {
    const mapa = {
      Futbol: "fa-futbol",
      Baloncesto: "fa-basketball",
      Voleibol: "fa-volleyball",
      Tenis: "fa-table-tennis-paddle-ball",
      Natacion: "fa-person-swimming",
    };
    return mapa[(cat || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")] || "fa-box";
  };

  const estadoClase = (e) =>
    e === "DISPONIBLE" ? "disponible" : e === "MANTENIMIENTO" ? "mantenimiento" : "prestado";

  const mostrarCargando = () => {
    tarjetaValores.forEach((el) => {
      if (el) el.textContent = "Cargando...";
    });
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-secondary)">Cargando...</td></tr>';
    }
  };

  const render = (lista) => {
    if (!tbody) return;

    tbody.innerHTML = !lista.length
      ? `<tr><td colspan="10" style="text-align:center;padding:2rem;color:var(--text-secondary)">No se encontraron implementos.</td></tr>`
      : "";

    lista.forEach((impl, index) => {
      const imagen = obtenerImagenImplemento(impl);
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${String(index + 1).padStart(3, "0")}</td>
        <td class="celda-imagen-tabla">
          ${imagen
            ? `<div class="tabla-imagen-mini"><img src="${imagen}" alt="${impl.nombre}" loading="lazy"></div>`
            : `<div class="tabla-imagen-mini gris"><i class="fa-solid ${iconoPorCategoria(impl.categoria)}"></i></div>`}
        </td>
        <td><div class="celda-implemento-flex"><span>${impl.nombre}</span></div></td>
        <td>${impl.categoria}</td>
        <td>${impl.cantidadTotal}</td>
        <td>${impl.cantidadDisponible}</td>
        <td>${impl.cantidadEnPrestamo}</td>
        <td>${impl.condicion}</td>
        <td><span class="estado ${estadoClase(impl.estado)}">${impl.estado.replace("_", " ")}</span></td>
        <td class="acciones-celda">
          <button class="btn-tabla editar"   data-id="${impl.id}" data-action="editar"   title="Editar"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-tabla eliminar" data-id="${impl.id}" data-action="eliminar" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(fila);
    });
  };

  const actualizarTarjetas = () => {
    const totalUnidades = implementos.reduce((acc, i) => acc + Number(i.cantidadTotal || 0), 0);
    const disponibles = implementos.reduce((acc, i) => acc + Number(i.cantidadDisponible || 0), 0);
    const enPrestamo = implementos.reduce((acc, i) => acc + Number(i.cantidadEnPrestamo || 0), 0);
    const mantenimiento = implementos
      .filter((i) => i.estado === "MANTENIMIENTO")
      .reduce((acc, i) => acc + Number(i.cantidadTotal || 0), 0);

    [
      totalUnidades,
      disponibles,
      enPrestamo,
      mantenimiento,
    ].forEach((val, i) => {
      if (tarjetaValores[i]) tarjetaValores[i].textContent = val;
    });
  };

  const cargar = async () => {
    implementos = await implementosAPI.obtenerTodos();
    actualizarTarjetas();
    render(implementos);
  };

  mostrarCargando();
  await cargar();

  buscador?.addEventListener("input", (e) => {
    const txt = e.target.value.trim().toLowerCase();
    const filtrado = implementos.filter(
      (i) =>
        i.nombre.toLowerCase().includes(txt) ||
        i.categoria.toLowerCase().includes(txt),
    );
    render(filtrado);
  });

  filtros[0]?.addEventListener("change", (e) => {
    const cat = e.target.value;
    const filtrado = cat ? implementos.filter((i) => i.categoria === cat) : implementos;
    render(filtrado);
  });

  filtros[1]?.addEventListener("change", (e) => {
    const mapa = {
      Disponible: "DISPONIBLE",
      "En Préstamo": "EN_PRESTAMO",
      Mantenimiento: "MANTENIMIENTO",
    };
    const estado = mapa[e.target.value] || null;
    const filtrado = estado ? implementos.filter((i) => i.estado === estado) : implementos;
    render(filtrado);
  });

  tbody?.addEventListener("click", async (e) => {
    const boton = e.target.closest("button[data-action]");
    if (!boton) return;
    const { id, action } = boton.dataset;

    if (action === "eliminar") {
      const ok = await ui.confirm("Eliminar implemento", "Esta acción no se puede deshacer.", {
        confirmText: "Sí, eliminar",
        tipo: "warning",
      });
      if (!ok) return;
      await implementosAPI.eliminar(id);
      await ui.toast("Implemento eliminado", "success");
      await cargar();
      return;
    }

    if (action === "editar") {
      const impl = implementos.find((i) => String(i.id) === String(id));
      if (!impl) return;
      abrirModalImplemento(impl, cargar);
    }
  });

  btnAgregar?.addEventListener("click", () => abrirModalImplemento(null, cargar));
}

export function abrirModalImplemento(impl, onGuardado) {
  const esEdicion = !!impl;
  const titulo = esEdicion ? "Editar implemento" : "Agregar implemento";

  const html = `
    <div class="form-container">
      <div class="form-group">
        <label class="form-label required">Nombre</label>
        <input id="m-nombre" class="form-input" type="text" value="${impl?.nombre || ""}" placeholder="Ej: Balón de fútbol">
      </div>
      <div class="form-group">
        <label class="form-label required">Categoría</label>
        <select id="m-categoria" class="form-select">
          ${["Fútbol", "Baloncesto", "Voleibol", "Tenis", "Atletismo", "Gimnasio", "Natación", "Ciclismo"]
            .map((c) => `<option value="${c}" ${impl?.categoria === c ? "selected" : ""}>${c}</option>`)
            .join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label required">Cantidad total</label>
        <input id="m-cantidad" class="form-input" type="number" min="1" value="${impl?.cantidadTotal || ""}" placeholder="Ej: 10">
      </div>
      <div class="form-group">
        <label class="form-label">Condición</label>
        <select id="m-condicion" class="form-select">
          ${["Excelente", "Buena", "Regular"]
            .map((c) => `<option value="${c}" ${impl?.condicion === c ? "selected" : ""}>${c}</option>`)
            .join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Estado</label>
        <select id="m-estado" class="form-select">
          ${[
            ["DISPONIBLE", "Disponible"],
            ["EN_PRESTAMO", "En Préstamo"],
            ["MANTENIMIENTO", "Mantenimiento"],
          ]
            .map(([val, txt]) => `<option value="${val}" ${impl?.estado === val ? "selected" : ""}>${txt}</option>`)
            .join("")}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Observaciones</label>
        <textarea id="m-obs" class="form-textarea" placeholder="Opcional...">${impl?.observaciones || ""}</textarea>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Precio por día</label>
          <input id="m-precio-dia" class="form-input" type="number" min="0" step="0.01" value="${impl?.precioDia ?? ""}" placeholder="Ej: 8000">
        </div>
        <div class="form-group">
          <label class="form-label">Precio por hora</label>
          <input id="m-precio-hora" class="form-input" type="number" min="0" step="0.01" value="${impl?.precioHora ?? ""}" placeholder="Ej: 1500">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Imagen (archivo)</label>
        <input id="m-imagen-file" class="form-input" type="file" accept="image/*">
        <span class="form-helper">Si subes una imagen se enviará codificada en base64.</span>
      </div>
      <p id="m-error" class="form-error"></p>
    </div>
  `;

  crearModal("modal-implemento", titulo, html, async (cerrar) => {
    const nombre = document.getElementById("m-nombre")?.value.trim();
    const categoria = document.getElementById("m-categoria")?.value;
    const cantidad = Number(document.getElementById("m-cantidad")?.value);
    const condicion = document.getElementById("m-condicion")?.value;
    const estado = document.getElementById("m-estado")?.value;
    const obs = document.getElementById("m-obs")?.value.trim();
    const precioDia = Number(document.getElementById("m-precio-dia")?.value || 0);
    const precioHora = Number(document.getElementById("m-precio-hora")?.value || 0);
    const file = document.getElementById("m-imagen-file")?.files?.[0] || null;
    const errorEl = document.getElementById("m-error");

    if (!nombre || !cantidad || cantidad < 1) {
      errorEl.textContent = "Nombre y cantidad son obligatorios.";
      errorEl.classList.add("visible");
      return;
    } else {
      errorEl.classList.remove("visible");
    }

    try {
      const payload = {
        nombre,
        categoria,
        cantidadTotal: cantidad,
        condicion,
        estado,
        observaciones: obs,
        precioDia: precioDia || undefined,
        precioHora: precioHora || undefined,
      };

      if (file) {
        // leer como base64
        const toBase64 = (f) => new Promise((res, rej) => {
          const reader = new FileReader();
          reader.onload = () => res(reader.result);
          reader.onerror = rej;
          reader.readAsDataURL(f);
        });
        try {
          const dataUrl = await toBase64(file);
          payload.imagenBase64 = dataUrl;
        } catch (err) {
          console.warn("No se pudo leer la imagen:", err);
        }
      }

      if (esEdicion) {
        await implementosAPI.actualizar(impl.id, payload);
        await ui.toast("Implemento actualizado", "success");
      } else {
        await implementosAPI.crear(payload);
        await ui.toast("Implemento creado", "success");
      }
      cerrar();
      await onGuardado();
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.classList.add("visible");
    }
  });
}
