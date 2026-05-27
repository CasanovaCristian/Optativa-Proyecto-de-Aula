import { crearModal, formatearFecha, obtenerIniciales } from "./ui-utils.js";

// [USUARIOS - INICIALIZAR MÓDULO ADMIN] — punto de entrada del módulo de usuarios en el panel admin
export async function initUsuarios() {
  const tbody = document.querySelector(".tabla-datos tbody");
  const tarjetaValores = document.querySelectorAll(".user-tarjetas .ti-valor");
  const buscador = document.querySelector(".buscador input");
  const filtros = document.querySelectorAll(".select-filtro");
  const btnAgregar = document.querySelector(".btn-accion");
  let usuarios = [];
  let prestamos = [];

  // [USUARIOS - CARGAR DATOS DEL SERVIDOR] — trae todos los usuarios y préstamos del backend en paralelo
  const cargar = async () => {
    [usuarios, prestamos] = await Promise.all([
      usuariosAPI.obtenerTodos(),
      prestamosAPI.obtenerTodos(),
    ]);
    usuarios = usuarios.map((u) => ({ ...u, rol: u.rol === "ADMIN" ? "ADMIN" : "CLIENTE" }));
    const estaActivo = (usuario) => usuario.activo !== false;
    [
      usuarios.length,
      usuarios.filter((u) => estaActivo(u)).length,
      usuarios.filter((u) => u.rol === "ADMIN").length,
      usuarios.filter((u) => !estaActivo(u)).length,
    ].forEach((val, i) => {
      if (tarjetaValores[i]) tarjetaValores[i].textContent = val;
    });
    render(usuarios);
  };

  const prestamosPorUsuario = () => {
    const mapa = new Map();
    prestamos.forEach((p) => mapa.set(p.usuarioId, (mapa.get(p.usuarioId) || 0) + 1));
    return mapa;
  };

  // [USUARIOS - RENDERIZAR TABLA] — pinta la tabla con nombre, email, rol, estado activo y cantidad de préstamos
  const render = (lista) => {
    if (!tbody) return;
    const conteo = prestamosPorUsuario();
    tbody.innerHTML = !lista.length
      ? `<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-secondary)">No se encontraron usuarios.</td></tr>`
      : "";

    lista.forEach((u, index) => {
      const fila = document.createElement("tr");
      fila.innerHTML = `
        <td>${String(index + 1).padStart(3, "0")}</td>
        <td>
          <div class="usuario-celda">
            <div class="avatar-tabla ${u.rol === "ADMIN" ? "azul" : "verde"}">${obtenerIniciales(u.nombre)}</div>
            <div>
              <span class="u-nombre">${u.nombre}</span>
              <span class="u-sub">${u.rol === "ADMIN" ? "Administrador" : "Cliente"}</span>
            </div>
          </div>
        </td>
        <td>${u.email}</td>
        <td><span class="estado ${u.rol === "ADMIN" ? "admin" : "cliente"}">${u.rol === "ADMIN" ? "Admin" : "Cliente"}</span></td>
        <td>${conteo.get(u.id) || "—"}</td>
        <td>${formatearFecha(u.fechaRegistro)}</td>
        <td><span class="estado ${(u.activo !== false) ? "disponible" : "mantenimiento"}">${(u.activo !== false) ? "Activo" : "Inactivo"}</span></td>
        <td class="acciones-celda">
          <button class="btn-tabla editar"   data-action="editar"   data-id="${u.id}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn-tabla eliminar" data-action="eliminar" data-id="${u.id}"><i class="fa-solid fa-trash"></i></button>
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
      usuarios.filter(
        (u) => u.nombre.toLowerCase().includes(txt) || u.email.toLowerCase().includes(txt)
      )
    );
  });

  filtros[0]?.addEventListener("change", (e) => {
    const rol =
      e.target.value === "Administrador"
        ? "ADMIN"
        : e.target.value === "Cliente"
          ? "CLIENTE"
          : null;
    render(rol ? usuarios.filter((u) => u.rol === rol) : usuarios);
  });

  filtros[1]?.addEventListener("change", (e) => {
    const activo = e.target.value === "Activo" ? true : e.target.value === "Inactivo" ? false : null;
    render(activo === null ? usuarios : usuarios.filter((u) => (u.activo !== false) === activo));
  });

  tbody?.addEventListener("click", async (e) => {
    const boton = e.target.closest("button[data-action]");
    if (!boton) return;
    const { id, action } = boton.dataset;

    if (action === "eliminar") {
      const ok = await ui.confirm("Eliminar usuario", "Esta acción no se puede deshacer.", {
        confirmText: "Sí, eliminar",
      });
      if (!ok) return;
      await usuariosAPI.eliminar(id);
      await ui.toast("Usuario eliminado", "success");
      await cargar();
      return;
    }

    if (action === "editar") {
      const usuario = usuarios.find((u) => String(u.id) === String(id));
      if (!usuario) return;
      abrirModalUsuario(usuario, cargar);
    }
  });

  btnAgregar?.addEventListener("click", () => abrirModalUsuario(null, cargar));
}

// [USUARIOS - MODAL CREAR/EDITAR] — abre el formulario modal para crear un usuario nuevo o editar uno existente
export function abrirModalUsuario(usuario, onGuardado) {
  const esEdicion = !!usuario;
  const titulo = esEdicion ? "Editar usuario" : "Agregar usuario";

  const html = `
    <div style="display:grid; gap:1rem;">
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Nombre completo *</label>
        <input id="mu-nombre" type="text" value="${usuario?.nombre || ""}" placeholder="Ej: Juan Pérez"
          style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                 background:var(--bg-input,#111827); color:var(--text-primary,#fff); box-sizing:border-box;">
      </div>
      ${!esEdicion
        ? `
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Email *</label>
        <input id="mu-email" type="email" placeholder="correo@ejemplo.com"
          style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                 background:var(--bg-input,#111827); color:var(--text-primary,#fff); box-sizing:border-box;">
      </div>
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Contraseña *</label>
        <input id="mu-password" type="password" placeholder="Mínimo 8 caracteres, una mayúscula, un número y un catacter especial"
          style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                 background:var(--bg-input,#111827); color:var(--text-primary,#fff); box-sizing:border-box;">
      </div>
      `
        : ""}
      <div>
        <label style="color:var(--text-secondary,#aaa); font-size:.85rem; display:block; margin-bottom:.4rem;">Rol</label>
        <select id="mu-rol" style="width:100%; padding:.6rem .8rem; border-radius:8px; border:1px solid var(--border,#333);
                background:var(--bg-input,#111827); color:var(--text-primary,#fff); box-sizing:border-box;">
          <option value="CLIENTE" ${usuario?.rol === "CLIENTE" ? "selected" : ""}>Cliente</option>
          <option value="ADMIN"    ${usuario?.rol === "ADMIN" ? "selected" : ""}>Admin</option>
        </select>
      </div>
      ${esEdicion
        ? `
      <div style="display:flex; align-items:center; gap:.5rem;">
        <input id="mu-activo" type="checkbox" ${usuario?.activo ? "checked" : ""} style="width:16px; height:16px; cursor:pointer;">
        <label for="mu-activo" style="color:var(--text-secondary,#aaa); font-size:.85rem; cursor:pointer;">Usuario activo</label>
      </div>
      `
        : ""}
      <p id="mu-error" style="color:#ef4444; font-size:.85rem; margin:0; display:none;"></p>
    </div>
  `;

  crearModal("modal-usuario", titulo, html, async (cerrar) => {
    const nombre = document.getElementById("mu-nombre")?.value.trim();
    const rol = document.getElementById("mu-rol")?.value;
    const errorEl = document.getElementById("mu-error");

    if (!nombre) {
      errorEl.textContent = "El nombre es obligatorio.";
      errorEl.style.display = "block";
      return;
    }

    try {
      if (esEdicion) {
        const activo = document.getElementById("mu-activo")?.checked ?? usuario.activo;
        await usuariosAPI.actualizar(usuario.id, { nombre, rol, activo });
        await ui.toast("Usuario actualizado", "success");
      } else {
        const email = document.getElementById("mu-email")?.value.trim();
        const password = document.getElementById("mu-password")?.value;
        if (!email || !password) {
          errorEl.textContent = "Email y contraseña son obligatorios.";
          errorEl.style.display = "block";
          return;
        }
        await usuariosAPI.crear(nombre, email, password, rol);
        await ui.toast("Usuario creado", "success");
      }
      cerrar();
      await onGuardado();
    } catch (error) {
      errorEl.textContent = error.message;
      errorEl.style.display = "block";
    }
  });
}
