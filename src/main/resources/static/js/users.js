/**
 * users.js
 * Gestión completa de usuarios
 */

// ================================
// CARGA Y LISTADO
// ================================
async function cargarUsuarios() {
  cerrarEditorUsuario();

  const tbody = document.getElementById('tabla-usuarios-body');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>';

  try {
    const res = await fetch('/api/admin/usuarios');
    if (res.ok) {
      listaUsuariosGlobal = await res.json();
      renderizarTablaUsuarios(listaUsuariosGlobal);
    } else {
      tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center;">Error al cargar</td></tr>';
    }
  } catch {
    tbody.innerHTML = '<tr><td colspan="6" style="color:red;text-align:center;">Error de conexión</td></tr>';
  }
}

function renderizarTablaUsuarios(usuarios) {
  const tbody = document.getElementById('tabla-usuarios-body');
  tbody.innerHTML = '';

  if (!usuarios || usuarios.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay usuarios.</td></tr>';
    return;
  }

  usuarios.forEach(u => {
    const tr = document.createElement('tr');
    if (u.bloqueado) tr.style.background = "rgba(255,0,0,0.1)";

    const avatar = u.avatarUrl || '/img/default-avatar.png';
    const badge = u.rol === 'ADMIN' ? 'badge-admin' : 'badge-user';
    const fecha = u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString() : '-';
    const estado = u.bloqueado
      ? '<span style="color:red;">BLOQ</span>'
      : '<span style="color:#46d369;">ACTIVO</span>';

    tr.innerHTML = `
      <td><img src="${avatar}" class="table-avatar" onerror="this.src='https://via.placeholder.com/40'"></td>
      <td class="user-identity">
        <div class="name">${u.nombre}</div>
        <div class="email">${u.email}</div>
      </td>
      <td>${estado}</td>
      <td><span class="badge ${badge}">${u.rol}</span></td>
      <td>${fecha}</td>
      <td style="text-align:right;">
        <button class="action-btn" onclick="abrirEditorUsuario(${u.id})">⚙️</button>
        <button class="action-btn" onclick="eliminarUsuario(${u.id}, '${u.nombre}', '${u.rol}')" style="color:#f44;">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function filtrarUsuarios() {
  const txt = document.getElementById('buscador-usuarios').value.toLowerCase();
  const filtrados = listaUsuariosGlobal.filter(u =>
    u.nombre.toLowerCase().includes(txt) ||
    u.email.toLowerCase().includes(txt)
  );
  renderizarTablaUsuarios(filtrados);
}

// ================================
// MODAL USUARIO
// ================================
function abrirEditorUsuario(id) {
  const u = listaUsuariosGlobal.find(x => x.id === id);
  if (!u) return;

  document.getElementById('user-info-id').innerText = u.id;
  document.getElementById('user-info-nombre').innerText = u.nombre;
  document.getElementById('user-info-email').innerText = u.email;
  document.getElementById('user-info-estado').innerHTML =
    u.bloqueado ? "<b style='color:red'>BLOQ</b>" : "<b style='color:green'>ACTIVO</b>";

  const divBloq = document.getElementById('action-bloqueo');
  if (u.rol === 'ADMIN') {
    divBloq.innerHTML = "<small>No puedes bloquear a un Admin.</small>";
  } else {
    divBloq.innerHTML = `
      <button type="button"
        onclick="toggleBloqueo(${u.id}, '${u.nombre}')"
        style="width:100%;border:1px solid ${u.bloqueado?'green':'red'};
        color:${u.bloqueado?'green':'red'};background:transparent;">
        ${u.bloqueado?'DESBLOQUEAR':'BLOQUEAR'}
      </button>`;
  }

  const divRol = document.getElementById('action-rol');
  divRol.innerHTML = u.rol === 'USER'
    ? `<button onclick="cambiarRolUsuario(${u.id}, 'ADMIN')" style="width:100%;border:1px solid gold;color:gold;background:transparent;">Hacer ADMIN</button>`
    : `<button onclick="cambiarRolUsuario(${u.id}, 'USER')" style="width:100%;border:1px solid grey;color:grey;background:transparent;">Hacer USUARIO</button>`;

  const modal = document.getElementById('modal-usuario');
  modal.style.display = 'block';
  modal.scrollIntoView({ behavior: 'smooth' });
}

function cerrarEditorUsuario() {
  document.getElementById('modal-usuario').style.display = 'none';
}

// ================================
// API USUARIOS
// ================================
async function toggleBloqueo(id, nombre) {
  if (!confirm(`¿Cambiar bloqueo a ${nombre}?`)) return;
  const r = await fetch(`/api/admin/usuario/bloqueo?id=${id}`, { method: 'POST' });
  if (r.ok) { alert(await r.text()); cargarUsuarios(); abrirEditorUsuario(id); }
}

async function cambiarRolUsuario(id, rol) {
  if (!confirm(`¿Cambiar rol a ${rol}?`)) return;
  const p = new URLSearchParams({ id, nuevoRol: rol });
  const r = await fetch('/api/admin/usuario/cambiar-rol', { method:'POST', body:p });
  if (r.ok) { alert("Rol cambiado"); cargarUsuarios(); abrirEditorUsuario(id); }
}

async function eliminarUsuario(id, nombre, rol) {
  if (rol === 'ADMIN') return alert("No puedes borrar admins.");
  if (!confirm(`¿ELIMINAR a ${nombre}?`)) return;
  const r = await fetch(`/api/admin/usuario/eliminar/${id}`, { method:'DELETE' });
  if (r.ok) { alert("Eliminado"); cargarUsuarios(); }
}
