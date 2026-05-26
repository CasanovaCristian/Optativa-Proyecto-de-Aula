import { formatearFecha } from "./ui-utils.js";

function obtenerImagenImplemento(implemento) {
  if (!implemento) return "";
  const raw =
    implemento.imagen ||
    implemento.imagenUrl ||
    implemento.imagenBase64 ||
    implemento.urlImagen ||
    implemento.foto ||
    implemento.fotoUrl ||
    implemento.picture ||
    implemento.imageUrl ||
    implemento.image ||
    "";

  if (!raw) return "";
  if (raw.startsWith("http") || raw.startsWith("data:")) return raw;
  return `data:image/jpeg;base64,${raw}`;
}

// [REPORTES - INICIALIZAR MÓDULO ESTADÍSTICAS] — calcula y muestra préstamos del año, del mes, implemento más prestado y promedio de días
export async function initReportes() {
  const tarjetas = document.querySelectorAll(".rep-tarjetas .ti-valor");
  const listaTop = document.querySelector(".lista-top");
  const tbody = document.querySelector(".tabla-datos tbody");

  tarjetas.forEach((el) => {
    if (el) el.textContent = "Cargando...";
  });
  if (listaTop) {
    listaTop.innerHTML = "";
    const li = document.createElement("li");
    li.className = "top-item";
    li.textContent = "Cargando...";
    listaTop.appendChild(li);
  }
  if (tbody) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary)">Cargando...</td></tr>';
  }

  // Traer préstamos e implementos en paralelo
  const [prestamos, implementos] = await Promise.all([
    prestamosAPI.obtenerTodos(),
    implementosAPI.obtenerTodos(),
  ]);

  // Mapa implementoId → implemento para acceso rápido
  const mapaImplementos = new Map(implementos.map((impl) => [impl.id, impl]));

  const ahora = new Date();

  const prestamosAnio = prestamos.filter(
    (p) => new Date(p.fechaPrestamo).getFullYear() === ahora.getFullYear()
  );
  const prestamosMes = prestamos.filter(
    (p) => new Date(p.fechaPrestamo).getMonth() === ahora.getMonth()
  );

  const mapaImpl = new Map();
  prestamos.forEach((p) => {
    const k = p.implementoNombre || `Implemento ${p.implementoId}`;
    mapaImpl.set(k, (mapaImpl.get(k) || 0) + 1);
  });
  const topImplementos = Array.from(mapaImpl.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const masPrestado = topImplementos[0]?.[0] || "-";

  const promedioDias = prestamos.length
    ? (
        prestamos.reduce((acc, p) => {
          const diff = Math.max(
            0,
            Math.ceil(
              (new Date(p.fechaDevolucionReal || p.fechaDevolucionEsperada || p.fechaPrestamo) -
                new Date(p.fechaPrestamo)) /
                86400000
            )
          );
          return acc + diff;
        }, 0) / prestamos.length
      ).toFixed(1)
    : 0;

  [prestamosAnio.length, masPrestado, prestamosMes.length, `${promedioDias} dias`].forEach(
    (val, i) => {
      if (tarjetas[i]) tarjetas[i].textContent = val;
    }
  );

  if (listaTop) {
    listaTop.innerHTML = "";
    if (!topImplementos.length) {
      const li = document.createElement("li");
      li.className = "top-item";
      li.textContent = "No hay datos para mostrar.";
      listaTop.appendChild(li);
    } else {
      topImplementos.forEach(([nombre, cantidad], index) => {
        const li = document.createElement("li");
        li.className = "top-item";
        li.innerHTML = `
          <div class="top-rank">${index + 1}</div>
          <div class="top-info">
            <span class="top-nombre"><i class="fa-solid fa-basketball"></i> ${nombre}</span>
            <div class="top-barra-wrap"><div class="top-barra" style="width:${Math.min(100, cantidad * 3)}%"></div></div>
          </div>
          <span class="top-count">${cantidad}</span>
        `;
        listaTop.appendChild(li);
      });
    }
  }

  if (tbody) {
    tbody.innerHTML = "";
    if (!prestamos.length) {
      tbody.innerHTML =
        '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary)">No hay registros para mostrar.</td></tr>';
      return;
    }

    [...prestamos]
      .sort((a, b) => new Date(b.fechaPrestamo) - new Date(a.fechaPrestamo))
      .slice(0, 10)
      .forEach((p) => {
        const fin = p.fechaDevolucionReal || p.fechaDevolucionEsperada;
        const duracion = Math.max(
          1,
          Math.ceil((new Date(fin || p.fechaPrestamo) - new Date(p.fechaPrestamo)) / 86400000)
        );
        const cls =
          p.estado === "DEVUELTO" ? "devuelto" : p.estado === "VENCIDO" ? "vencido" : "activo-badge";

        // Buscar imagen desde el mapa de implementos usando implementoId
        const implemento = mapaImplementos.get(p.implementoId);
        const imagen = obtenerImagenImplemento(implemento);

        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>#P${String(p.id).padStart(3, "0")}</td>
          <td>${p.usuarioNombre}</td>
          <td>
            ${
              imagen
                ? `<div class="tabla-imagen-mini">
                     <img
                       src="${imagen}"
                       alt="${p.implementoNombre}"
                       loading="lazy"
                       onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-basketball\\'></i>'; this.parentElement.classList.add('gris');"
                     >
                   </div>`
                : `<div class="tabla-imagen-mini gris"><i class="fa-solid fa-basketball"></i></div>`
            }
          </td>
          <td><div class="celda-implemento-flex"><span>${p.implementoNombre}</span></div></td>
          <td>${formatearFecha(p.fechaPrestamo)}</td>
          <td>${formatearFecha(fin)}</td>
          <td>${duracion} dias</td>
          <td><span class="estado ${cls}">${p.estado}</span></td>
        `;
        tbody.appendChild(fila);
      });
  }
}
