import { formatearFecha, obtenerIniciales } from "./ui-utils.js";

function obtenerImagenImplemento(impl) {
  return (
    impl?.imagenes?.[0] ||
    impl?.imagenUrl ||
    impl?.imagenBase64 ||
    impl?.imagen ||
    ""
  );
}

// [PRÉSTAMOS - RENDERIZAR ACTIVOS EN DASHBOARD] — muestra los 6 préstamos activos más próximos a vencer
export function renderPrestamosActivos(prestamos) {
  const lista = document.querySelector(".lista-prestamos-rapidos");
  if (!lista) return;
  const activos = prestamos
    .filter((p) => p.estado === "ACTIVO")
    .sort(
      (a, b) => new Date(a.fechaDevolucionEsperada) - new Date(b.fechaDevolucionEsperada)
    )
    .slice(0, 6);

  lista.innerHTML = activos.length ? "" : "<li>No hay prestamos activos.</li>";
  activos.forEach((p) => {
    const diff = Math.ceil(
      (new Date(p.fechaDevolucionEsperada) - new Date()) / (1000 * 60 * 60 * 24)
    );
    const venceText = diff <= 0 ? "Vence hoy" : `Vence en ${diff} dias`;
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="prestamo-usuario">
        <div class="mini-avatar azul">${obtenerIniciales(p.usuarioNombre)}</div>
        <div>
          <span class="p-nombre">${p.usuarioNombre}</span>
          <span class="p-item">${p.implementoNombre}</span>
        </div>
      </div>
      <span class="p-fecha ${diff <= 1 ? "vence-pronto" : ""}">${venceText}</span>
    `;
    lista.appendChild(li);
  });
}

// [PRÉSTAMOS - INICIALIZAR MÓDULO ADMIN] — punto de entrada del módulo de préstamos en el panel admin
export async function initPrestamos() {
  const tbody = document.querySelector(".tabla-datos tbody");
  const tarjetaValores = document.querySelectorAll(".prest-tarjetas .ti-valor");
  const buscador = document.querySelector(".buscador input");
  const filtros = document.querySelectorAll(".select-filtro");
  let prestamos = [];
  let implementosCargados = [];

  // [PRÉSTAMOS - CARGAR DATOS DEL SERVIDOR] — trae préstamos e implementos del backend en paralelo
  const cargar = async () => {
    const [data, implementos] = await Promise.all([
      prestamosAPI.obtenerTodos(),
      implementosAPI.obtenerTodos(),
    ]);
    prestamos = data;
    implementosCargados = implementos;

    [
      prestamos.length,
      prestamos.filter((p) => p.estado === "ACTIVO").length,
      prestamos.filter((p) => p.estado === "DEVUELTO").length,
      prestamos.filter((p) => p.estado === "VENCIDO").length,
    ].forEach((val, i) => {
      if (tarjetaValores[i]) tarjetaValores[i].textContent = val;
    });

    render(prestamos, implementosCargados);
  };

  // [PRÉSTAMOS - RENDERIZAR TABLA] — pinta la tabla con usuario, implemento, fechas, estado y acciones
  const render = (lista, implementos = []) => {
    if (!tbody) return;
    tbody.innerHTML = !lista.length
      ? `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary)">No se encontraron préstamos.</td></tr>`
      : "";

    lista.forEach((p) => {
      const cls =
        p.estado === "ACTIVO" ? "activo-badge" : p.estado === "DEVUELTO" ? "devuelto" : "vencido";

      const implEncontrado = implementos.find(
        (i) => i.id === p.implementoId || i.nombre === p.implementoNombre
      );
      const imagen = obtenerImagenImplemento(implEncontrado);

      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>#P${String(p.id).padStart(3, "0")}</td>
        <td>
          <div class="usuario-celda">
            <div class="mini-av azul">${obtenerIniciales(p.usuarioNombre)}</div>
            <span>${p.usuarioNombre}</span>
          </div>
        </td>
        <td>
          ${imagen
            ? `<div class="tabla-imagen-mini"><img src="${imagen}" alt="${p.implementoNombre}" loading="lazy"></div>`
            : `<div class="tabla-imagen-mini gris"><i class="fa-solid fa-basketball"></i></div>`}
        </td>
        <td><div class="celda-implemento-flex"><span>${p.implementoNombre}</span></div></td>
        <td>${formatearFecha(p.fechaPrestamo)}</td>
        <td>${formatearFecha(p.fechaDevolucionReal || p.fechaDevolucionEsperada)}</td>
        <td><span class="estado ${cls}">${p.estado}</span></td>
        <td class="acciones-celda">
          <button class="btn-tabla ver"     data-action="ver"      data-id="${p.id}"><i class="fa-solid fa-eye"></i></button>
          <button class="btn-tabla editar"  data-action="devolver" data-id="${p.id}" ${
            p.estado !== "ACTIVO" ? "disabled style='opacity:.4;cursor:not-allowed'" : ""
          }><i class="fa-solid fa-rotate-left"></i></button>
          <button class="btn-tabla eliminar" data-action="eliminar" data-id="${p.id}"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(fila);
    });
  };

  const mostrarCargando = () => {
    tarjetaValores.forEach((el) => {
      if (el) el.textContent = "Cargando...";
    });
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary)">Cargando...</td></tr>';
    }
  };

  mostrarCargando();
  await cargar();

  buscador?.addEventListener("input", (e) => {
    const txt = e.target.value.trim().toLowerCase();
    render(
      prestamos.filter(
        (p) =>
          p.usuarioNombre.toLowerCase().includes(txt) ||
          p.implementoNombre.toLowerCase().includes(txt)
      ),
      implementosCargados
    );
  });

  filtros[0]?.addEventListener("change", (e) => {
    const estado = e.target.value ? e.target.value.toUpperCase() : null;
    render(
      estado ? prestamos.filter((p) => p.estado === estado) : prestamos,
      implementosCargados
    );
  });

  tbody?.addEventListener("click", async (e) => {
    const boton = e.target.closest("button[data-action]");
    if (!boton || boton.disabled) return;
    const { id, action } = boton.dataset;

    if (action === "ver") {
      const p = prestamos.find((x) => String(x.id) === String(id));
      if (!p) return;
      ui.alert(
        `Préstamo #P${String(p.id).padStart(3, "0")}`,
        `${p.usuarioNombre} → ${p.implementoNombre} | Estado: ${p.estado}`,
        "info"
      );
      return;
    }

    // [PRÉSTAMOS - REGISTRAR DEVOLUCIÓN] — marca el préstamo como devuelto y actualiza el stock del implemento
    if (action === "devolver") {
      const ok = await ui.confirm(
        "Registrar devolución",
        "¿Confirmas la devolución de este préstamo?",
        { confirmText: "Sí, devolver" }
      );
      if (!ok) return;
      await prestamosAPI.registrarDevolucion(id);
      await ui.toast("Devolución registrada", "success");
      await cargar();
      return;
    }

    if (action === "eliminar") {
      const ok = await ui.confirm("Eliminar préstamo", "Esta acción no se puede deshacer.", {
        confirmText: "Sí, eliminar",
      });
      if (!ok) return;
      await prestamosAPI.eliminar(id);
      await ui.toast("Préstamo eliminado", "success");
      await cargar();
    }
  });
}
