const sidebarCli = document.getElementById("sidebarCli");
const overlay    = document.getElementById("overlay");
const btnAbrir   = document.getElementById("btnAbrirSidebar");
const btnCerrar  = document.getElementById("btnCerrarSidebar");
const paginaActual = (location.pathname.split("/").pop() || "").toLowerCase();

function abrirSidebar()  { sidebarCli?.classList.add("abierto");    overlay?.classList.add("visible"); }
function cerrarSidebar() { sidebarCli?.classList.remove("abierto"); overlay?.classList.remove("visible"); }

btnAbrir?.addEventListener("click", abrirSidebar);
btnCerrar?.addEventListener("click", cerrarSidebar);
overlay?.addEventListener("click", cerrarSidebar);

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

function obtenerIniciales(nombre) {
  if (!nombre) return "??";
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[1][0]}`.toUpperCase();
}

function formatearFecha(fechaIso) {
  if (!fechaIso) return "-";
  const fecha = new Date(fechaIso);
  if (Number.isNaN(fecha.getTime())) return "-";
  return fecha.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function actualizarSidebarCliente(usuario) {
  document.querySelectorAll(".scli-user").forEach((el)    => { el.textContent = usuario?.nombre || "Usuario"; });
  document.querySelectorAll(".scli-email").forEach((el)   => { el.textContent = usuario?.email || ""; });
  document.querySelectorAll(".scli-avatar").forEach((el)  => { el.textContent = obtenerIniciales(usuario?.nombre || ""); });
}

async function initCliente() {
  try {
    await cargarScript("js/api.js", "api");
  } catch (error) {
    console.error(error);
    return;
  }

  if (!window.sesion) return;
  requerirEmpleado();
  conectarLogout();

  const usuario = sesion.getUsuario();
  actualizarSidebarCliente(usuario);

  if (paginaActual === "cliente-dashboard.html") await initClienteDashboard(usuario);
  if (paginaActual === "perfil.html")            initPerfil(usuario);
}

async function initClienteDashboard(usuario) {
  const tarjetas = document.querySelectorAll(".cli-tarjetas .cli-valor");
  tarjetas.forEach((el) => {
    if (el) el.textContent = "Cargando...";
  });

  const cards = document.querySelectorAll(".cli-card");
  const cardActivas = cards[0];
  const cardHistorial = cards[1];

  if (cardActivas) {
    cardActivas.querySelectorAll(".renta-item").forEach((item) => item.remove());
    cardActivas.querySelectorAll(".estado-vacio").forEach((item) => item.remove());
    const vacio = document.createElement("div");
    vacio.className = "estado-vacio";
    vacio.textContent = "Cargando...";
    cardActivas.appendChild(vacio);
  }

  if (cardHistorial) {
    const tbody = cardHistorial.querySelector(".tabla-cli tbody");
    if (tbody) {
      tbody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;padding:1.5rem;color:var(--text-secondary)">Cargando...</td></tr>';
    }
  }

  try {
    const [prestamos, implementos] = await Promise.all([
      prestamosAPI.obtenerPorUsuario(usuario.id),
      implementosAPI.obtenerTodos(),
    ]);

    const implementoMap = new Map(implementos.map((i) => [i.id, i]));

    const total       = prestamos.length;
    const enUso       = prestamos.filter((p) => p.estado === "ACTIVO").length;
    const vencidos    = prestamos.filter((p) => p.estado === "VENCIDO").length;
    const finalizadas = prestamos.filter((p) => p.estado === "DEVUELTO").length;

    [total, enUso, vencidos, finalizadas].forEach((val, i) => {
      if (tarjetas[i]) tarjetas[i].textContent = val;
    });

    if (cardActivas) {
      const badge = cardActivas.querySelector(".cli-badge-num");
      if (badge) badge.textContent = enUso + vencidos;

      cardActivas.querySelectorAll(".renta-item").forEach((item) => item.remove());
      cardActivas.querySelectorAll(".estado-vacio").forEach((item) => item.remove());

      const activas = prestamos.filter((p) => p.estado === "ACTIVO" || p.estado === "VENCIDO");
      if (!activas.length) {
        const vacio = document.createElement("div");
        vacio.className = "estado-vacio";
        vacio.textContent = "No tienes rentas activas por ahora.";
        cardActivas.appendChild(vacio);
      }
      activas.forEach((p) => {
        const impl         = implementoMap.get(p.implementoId);
        const categoria    = impl?.categoria || "Implemento";
        const estadoClase  = p.estado === "VENCIDO" ? "por-devolver" : "en-uso";
        const estadoBadge  = p.estado === "VENCIDO" ? "por-devolver-badge" : "en-uso-badge";
        const estadoTexto  = p.estado === "VENCIDO" ? "Por Devolver" : "En Uso";

        const item = document.createElement("div");
        item.className = `renta-item ${estadoClase}`;
        item.innerHTML = `
          <div class="ri-imagen azul"><i class="fa-solid fa-basketball"></i></div>
          <div class="ri-info">
            <div class="ri-top">
              <div>
                <span class="ri-cat">${categoria}</span>
                <h4 class="ri-titulo">${p.implementoNombre}</h4>
                <span class="ri-ref">Ref: #IMP-${String(p.implementoId).padStart(3, "0")} · Renta #R-${String(p.id).padStart(4, "0")}</span>
              </div>
              <div class="ri-estado-wrap">
                <span class="ri-estado ${estadoBadge}">
                  <i class="fa-solid fa-play"></i> ${estadoTexto}
                </span>
              </div>
            </div>
            <div class="ri-fechas">
              <div class="ri-fecha-item">
                <i class="fa-solid fa-calendar-plus"></i>
                <span>Inicio: <strong>${formatearFecha(p.fechaPrestamo)}</strong></span>
              </div>
              <div class="ri-fecha-item">
                <i class="fa-solid fa-calendar-xmark"></i>
                <span>Devolucion: <strong>${formatearFecha(p.fechaDevolucionEsperada)}</strong></span>
              </div>
            </div>
          </div>
        `;
        cardActivas.appendChild(item);
      });
    }

    if (cardHistorial) {
      const badge = cardHistorial.querySelector(".cli-badge-num");
      if (badge) badge.textContent = prestamos.length - enUso;

      const tbody    = cardHistorial.querySelector(".tabla-cli tbody");
      if (!tbody) return;
      const historial = prestamos.filter((p) => p.estado !== "ACTIVO");
      tbody.innerHTML = "";

      if (!historial.length) {
        tbody.innerHTML =
          "<tr><td colspan=\"4\" style=\"text-align:center;padding:1.5rem;color:var(--text-secondary)\">No hay historial de rentas.</td></tr>";
        return;
      }

      historial.forEach((p) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>
            <div class="hist-prod">
              <div class="hist-ico azul"><i class="fa-solid fa-basketball"></i></div>
              <div>
                <span class="hist-titulo">${p.implementoNombre}</span>
                <span class="hist-ref">#R-${String(p.id).padStart(4, "0")}</span>
              </div>
            </div>
          </td>
          <td><span class="hist-fecha">${formatearFecha(p.fechaPrestamo)} → ${formatearFecha(p.fechaDevolucionReal || p.fechaDevolucionEsperada)}</span></td>
          <td>
            <span class="hist-estado ${p.estado === "DEVUELTO" ? "finalizado" : "pendiente"}">
              ${p.estado === "DEVUELTO" ? "Finalizado" : p.estado === "VENCIDO" ? "Vencido" : "Activo"}
            </span>
          </td>
        `;
        tbody.appendChild(fila);
      });
    }
  } catch (error) {
    await ui.toast("Error al cargar el dashboard: " + error.message, "error");
  }
}

function initPerfil(usuario) {
  const avatar = document.querySelector(".perfil-avatar-grande");
  if (avatar) avatar.textContent = obtenerIniciales(usuario?.nombre || "");

  const titulo = document.querySelector(".perfil-avatar-info h4");
  if (titulo) titulo.textContent = usuario?.nombre || "Usuario";

  const inputs = document.querySelectorAll(".perfil-campo input");
  const partes  = (usuario?.nombre || "").trim().split(/\s+/);
  if (inputs[0]) inputs[0].value = partes[0] || "";
  if (inputs[1]) inputs[1].value = partes.slice(1).join(" ");
  if (inputs[2]) inputs[2].value = usuario?.email || "";
  // Botón Guardar: actualizar usuario en backend y en sesión
  const btnGuardar = document.querySelector(".btn-guardar-perfil");
  if (btnGuardar) {
    btnGuardar.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        btnGuardar.disabled = true;
        const nombre = (inputs[0]?.value || "").trim();
        const apellido = (inputs[1]?.value || "").trim();
        const nombreCompleto = `${nombre} ${apellido}`.trim();

        const actualizado = {
          ...usuario,
          nombre: nombreCompleto,
        };

        const resp = await usuariosAPI.actualizar(usuario.id, actualizado);
        // Guardar y refrescar UI
        sesion.guardar(resp);
        actualizarSidebarCliente(resp);
        if (avatar) avatar.textContent = obtenerIniciales(resp?.nombre || "");
        if (titulo) titulo.textContent = resp?.nombre || "Usuario";
        await ui.toast("Perfil actualizado correctamente", "success");
      } catch (err) {
        console.error(err);
        await ui.toast("Error al actualizar perfil: " + (err.message || String(err)), "error");
      } finally {
        btnGuardar.disabled = false;
      }
    });
  }

  // Botón Eliminar cuenta: confirmación y petición al API
  const btnEliminar = document.querySelector(".btn-eliminar-cuenta");
  if (btnEliminar) {
    btnEliminar.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const confirmado = await ui.confirm(
          "Eliminar cuenta",
          "Esta acción eliminará permanentemente tu cuenta y no podrá deshacerse. ¿Deseas continuar?",
          { confirmText: "Sí, eliminar cuenta", cancelText: "Cancelar", tipo: "warning" }
        );
        if (!confirmado) return;

        btnEliminar.disabled = true;
        await usuariosAPI.eliminar(usuario.id);
        sesion.limpiar();
        await ui.alert("Cuenta eliminada", "Tu cuenta ha sido eliminada correctamente.", "success");
        window.location.href = "index.html";
      } catch (err) {
        console.error(err);
        await ui.toast("Error al eliminar la cuenta: " + (err.message || String(err)), "error");
      } finally {
        btnEliminar.disabled = false;
      }
    });
  }

  // Botón Cambiar contraseña: solicita nueva contraseña y la actualiza
  const btnCambiarPass = document.querySelector('.btn-cambiar-pass');
  if (btnCambiarPass) {
    btnCambiarPass.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        // Cargar SweetAlert si es necesario
        try { await cargarSweetAlert(); } catch (loadErr) { console.error(loadErr); await ui.alert('Error','No se pudo mostrar el diálogo.','error'); return; }

        const result = await Swal.fire({
          title: 'Cambiar contraseña',
          html:
            '<div style="position:relative;margin-bottom:1rem">' +
              '<input id="swal-pass1" class="swal2-input" type="password" placeholder="Nueva contraseña" style="padding-right:2.5rem">' +
              '<button type="button" id="swal-toggle1" style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;color:#6b7280;cursor:pointer;padding:0.35rem"><i class="fa-solid fa-eye"></i></button>' +
            '</div>' +
            '<div style="position:relative">' +
              '<input id="swal-pass2" class="swal2-input" type="password" placeholder="Confirmar contraseña" style="padding-right:2.5rem">' +
              '<button type="button" id="swal-toggle2" style="position:absolute;right:0.75rem;top:50%;transform:translateY(-50%);background:none;border:none;color:#6b7280;cursor:pointer;padding:0.35rem"><i class="fa-solid fa-eye"></i></button>' +
            '</div>' +
            '<div style="font-size:0.9rem;color:#6b7280;margin-top:0.5rem;text-align:left">La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, un número y un carácter especial.</div>',
          focusConfirm: false,
          showCancelButton: true,
          confirmButtonText: 'Cambiar',
          didOpen: () => {
            const input1 = document.getElementById('swal-pass1');
            const input2 = document.getElementById('swal-pass2');
            const btn1 = document.getElementById('swal-toggle1');
            const btn2 = document.getElementById('swal-toggle2');
            
            [btn1, btn2].forEach((btn, idx) => {
              if (!btn) return;
              const inp = idx === 0 ? input1 : input2;
              btn.addEventListener('click', (e) => {
                e.preventDefault();
                const isPassword = inp.type === 'password';
                inp.type = isPassword ? 'text' : 'password';
                btn.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
              });
            });
          },
          preConfirm: () => {
            const p1 = document.getElementById('swal-pass1')?.value || '';
            const p2 = document.getElementById('swal-pass2')?.value || '';
            const policy = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?`~]).{8,}$/;
            if (!p1) {
              Swal.showValidationMessage('Ingresa la nueva contraseña.');
              return false;
            }
            if (!policy.test(p1)) {
              Swal.showValidationMessage('La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.');
              return false;
            }
            if (p1 !== p2) {
              Swal.showValidationMessage('Las contraseñas no coinciden.');
              return false;
            }
            return p1;
          }
        });

        if (!result || !result.isConfirmed) return;
        const nueva = result.value;
        if (!nueva) return;

        btnCambiarPass.disabled = true;
        try {
          // Intentar cambiar contraseña enviando solo el campo password
          const actualizado = { password: nueva };
          const resp = await usuariosAPI.actualizar(usuario.id, actualizado);
          // Si el backend devuelve el usuario actualizado, refrescamos la sesión
          if (resp) sesion.guardar(resp);
          await ui.toast('Contraseña actualizada correctamente. Inicia sesión nuevamente.', 'success');
        } catch (err) {
          console.error('Error al cambiar contraseña:', err);
          throw err;
        }
      } catch (err) {
        console.error(err);
        await ui.toast('Error al cambiar la contraseña: ' + (err.message || String(err)), 'error');
      } finally {
        btnCambiarPass.disabled = false;
      }
    });
  }

  // (No hay validaciones adicionales; campos de teléfono/identificación/ciudad eliminados)
}

document.addEventListener("DOMContentLoaded", initCliente);
