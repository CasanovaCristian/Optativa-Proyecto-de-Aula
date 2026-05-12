import { crearModal } from "./ui-utils.js";

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
        '<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-secondary)">Cargando...</td></tr>';
    }
  };

  const render = (lista) => {
    if (!tbody) return;
    tbody.innerHTML = !lista.length
      ? `<tr><td colspan="9" style="text-align:center;padding:2rem;color:var(--text-secondary)">No se encontraron implementos.</td></tr>`
      : "";

    lista.forEach((impl, index) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${String(index + 1).padStart(3, "0")}</td>
        <td><i class="fa-solid ${iconoPorCategoria(impl.categoria)} icono-tabla"></i>${impl.nombre}</td>
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
    [
      implementos.length,
      implementos.filter((i) => i.estado === "DISPONIBLE").length,
      implementos.filter((i) => i.estado === "EN_PRESTAMO").length,
      implementos.filter((i) => i.estado === "MANTENIMIENTO").length,
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
    render(
      implementos.filter(
        (i) => i.nombre.toLowerCase().includes(txt) || i.categoria.toLowerCase().includes(txt)
      )
    );
  });

  filtros[0]?.addEventListener("change", (e) => {
    const cat = e.target.value;
    render(cat ? implementos.filter((i) => i.categoria === cat) : implementos);
  });

  filtros[1]?.addEventListener("change", (e) => {
    const mapa = {
      Disponible: "DISPONIBLE",
      "En Préstamo": "EN_PRESTAMO",
      Mantenimiento: "MANTENIMIENTO",
    };
    const estado = mapa[e.target.value] || null;
    render(estado ? implementos.filter((i) => i.estado === estado) : implementos);
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
    <div style="display:grid; gap:1rem;">
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Nombre *</label>
        <input id="m-nombre" type="text" value="${impl?.nombre || ""}" placeholder="Ej: Balón de fútbol"
          style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                 background:var(--bg-input,#111827); color:var(--text-primary,#fff); box-sizing:border-box;">
      </div>
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Categoría *</label>
        <select id="m-categoria" style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                background:var(--bg-input,#111827); color:var(--text-primary,#fff); box-sizing:border-box;">
          ${["Fútbol", "Baloncesto", "Voleibol", "Tenis", "Atletismo", "Gimnasio", "Natación", "Ciclismo"]
            .map((c) => `<option value="${c}" ${impl?.categoria === c ? "selected" : ""}>${c}</option>`)
            .join("")}
        </select>
      </div>
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Cantidad total *</label>
        <input id="m-cantidad" type="number" min="1" value="${impl?.cantidadTotal || ""}" placeholder="Ej: 10"
          style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                 background:var(--bg-input,#111827); color:var(--text-primary,#fff); box-sizing:border-box;">
      </div>
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Condición</label>
        <select id="m-condicion" style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                background:var(--bg-input,#111827); color:var(--text-primary,#fff); box-sizing:border-box;">
          ${["Excelente", "Buena", "Regular"]
            .map((c) => `<option value="${c}" ${impl?.condicion === c ? "selected" : ""}>${c}</option>`)
            .join("")}
        </select>
      </div>
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Estado</label>
        <select id="m-estado" style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                background:var(--bg-input,#111827); color:var(--text-primary,#fff); box-sizing:border-box;">
          ${[
            ["DISPONIBLE", "Disponible"],
            ["EN_PRESTAMO", "En Préstamo"],
            ["MANTENIMIENTO", "Mantenimiento"],
          ]
            .map(([val, txt]) => `<option value="${val}" ${impl?.estado === val ? "selected" : ""}>${txt}</option>`)
            .join("")}
        </select>
      </div>
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Observaciones</label>
        <textarea id="m-obs" rows="2" placeholder="Opcional..."
          style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                 background:var(--bg-input,#111827); color:var(--text-primary,#fff); resize:vertical; box-sizing:border-box;">${impl?.observaciones || ""}</textarea>
      </div>
      <p id="m-error" style="color:#ef4444; font-size:.85rem; margin:0; display:none;"></p>
    </div>
  `;

  crearModal("modal-implemento", titulo, html, async (cerrar) => {
    const nombre = document.getElementById("m-nombre")?.value.trim();
    const categoria = document.getElementById("m-categoria")?.value;
    const cantidad = Number(document.getElementById("m-cantidad")?.value);
    const condicion = document.getElementById("m-condicion")?.value;
    const estado = document.getElementById("m-estado")?.value;
    const obs = document.getElementById("m-obs")?.value.trim();
    const errorEl = document.getElementById("m-error");

    if (!nombre || !cantidad || cantidad < 1) {
      errorEl.textContent = "Nombre y cantidad son obligatorios.";
      errorEl.style.display = "block";
      return;
    }

    try {
      if (esEdicion) {
        await implementosAPI.actualizar(impl.id, {
          nombre,
          categoria,
          cantidadTotal: cantidad,
          condicion,
          estado,
          observaciones: obs,
        });
        await ui.toast("Implemento actualizado", "success");
      } else {
        await implementosAPI.crear({
          nombre,
          categoria,
          cantidadTotal: cantidad,
          condicion,
          estado,
          observaciones: obs,
        });
        await ui.toast("Implemento creado", "success");
      }
      cerrar();
      await onGuardado();
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.style.display = "block";
    }
  });
}
