// --- 0. INICIO AUTOMÁTICO ---
document.addEventListener("DOMContentLoaded", () => {
    cargarMetricas();
});

// Variable global para guardar los usuarios y filtrar sin recargar
let listaUsuariosGlobal = [];

// --- 1. GESTIÓN DE PESTAÑAS ---
function mostrar(idSeccion) {
    document.querySelectorAll('.form-section').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(idSeccion).classList.add('active');
    document.getElementById('console-box').style.display = 'none';

    const botones = document.querySelectorAll('.menu-btn');
    // Mapeo manual de índices para activar el botón correcto
    if(idSeccion === 'sec-dashboard') botones[0].classList.add('active');
    if(idSeccion === 'sec-usuarios')  botones[1].classList.add('active');
    if(idSeccion === 'sec-cine')      botones[2].classList.add('active');
    if(idSeccion === 'sec-serie')     botones[3].classList.add('active');
    if(idSeccion === 'sec-capitulo')  botones[4].classList.add('active');
    if(idSeccion === 'sec-video')     botones[5].classList.add('active');
    if(idSeccion === 'sec-editar')    botones[6].classList.add('active');
}

// --- 2. MÉTRICAS ---
async function cargarMetricas() {
    try {
        const res = await fetch('/api/admin/metricas');
        if(res.ok) {
            const data = await res.json();
            document.getElementById('metric-pelis').innerText = data.peliculas;
            document.getElementById('metric-series').innerText = data.series;
            document.getElementById('metric-videos').innerText = data.videos;
            document.getElementById('metric-espacio').innerText = data.porcentaje + "%";
            document.getElementById('disk-used').innerText = data.usado;
            document.getElementById('disk-total').innerText = "Total: " + data.total;

            const barra = document.getElementById('disk-bar');
            barra.style.width = data.porcentaje + "%";
            if(data.porcentaje > 90) barra.style.backgroundColor = "#ff0000";
            else if(data.porcentaje > 70) barra.style.backgroundColor = "#ffa500";
            else barra.style.backgroundColor = "#46d369";
        }
    } catch (e) {
        console.error("Error cargando métricas", e);
    }
}

// --- 3. GESTIÓN DE USUARIOS ---
async function cargarUsuarios() {
    cerrarEditorUsuario();
    const tbody = document.getElementById('tabla-usuarios-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">Cargando directorio...</td></tr>';

    try {
        const res = await fetch('/api/admin/usuarios');
        if(res.ok) {
            listaUsuariosGlobal = await res.json();
            renderizarTablaUsuarios(listaUsuariosGlobal);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error al cargar usuarios</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:red;">Error de conexión</td></tr>';
    }
}

function renderizarTablaUsuarios(usuarios) {
    const tbody = document.getElementById('tabla-usuarios-body');
    tbody.innerHTML = '';

    if(usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:20px;">No se encontraron usuarios.</td></tr>';
        return;
    }

    usuarios.forEach(u => {
        const tr = document.createElement('tr');

        // Si está bloqueado, lo pintamos rojizo y semi-transparente
        if (u.bloqueado) {
            tr.style.background = "rgba(255, 0, 0, 0.1)";
        }

        const avatar = u.avatarUrl ? u.avatarUrl : '/img/default-avatar.png';
        const badgeClass = u.rol === 'ADMIN' ? 'badge-admin' : 'badge-user';
        const fecha = u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString() : '-';

        // Icono visual de estado
        const estadoHTML = u.bloqueado
            ? '<span style="color:red; font-weight:bold;">🔒 BLOQ</span>'
            : '<span style="color:#46d369; font-weight:bold;">✅ ACTIVO</span>';

        tr.innerHTML = `
            <td><img src="${avatar}" class="table-avatar" onerror="this.src='https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png'"></td>
            <td class="user-identity">
                <div class="name">${u.nombre}</div>
                <div class="email">${u.email}</div>
            </td>
            <td>${estadoHTML}</td>
            <td><span class="badge ${badgeClass}">${u.rol}</span></td>
            <td>${fecha}</td>
            <td style="text-align: right;">
                <button class="action-btn" title="Gestionar" onclick="abrirEditorUsuario(${u.id})">⚙️</button>
                <button class="action-btn" title="Eliminar" onclick="eliminarUsuario(${u.id}, '${u.nombre}', '${u.rol}')" style="color:#ff4444;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarUsuarios() {
    const texto = document.getElementById('buscador-usuarios').value.toLowerCase();
    const filtrados = listaUsuariosGlobal.filter(u =>
        u.nombre.toLowerCase().includes(texto) ||
        u.email.toLowerCase().includes(texto)
    );
    renderizarTablaUsuarios(filtrados);
}

// --- FUNCIONES DEL PANEL DE USUARIO (MODAL) ---

function abrirEditorUsuario(id) {
    const usuario = listaUsuariosGlobal.find(u => u.id === id);
    if(!usuario) return;

    // 1. Rellenar datos informativos (SOLO LECTURA)
    document.getElementById('user-info-id').innerText = usuario.id;
    document.getElementById('user-info-nombre').innerText = usuario.nombre;
    document.getElementById('user-info-email').innerText = usuario.email;

    const spanEstado = document.getElementById('user-info-estado');
    spanEstado.innerHTML = usuario.bloqueado
        ? "<span style='color:red; font-weight:bold;'>⛔ CUENTA BLOQUEADA (Acceso denegado)</span>"
        : "<span style='color:#46d369; font-weight:bold;'>✅ CUENTA ACTIVA (Acceso permitido)</span>";

    // 2. Botón Bloqueo
    const divBloqueo = document.getElementById('action-bloqueo');
    if (usuario.rol === 'ADMIN') {
        divBloqueo.innerHTML = `<p style="color:#666; font-size:0.8em;">No puedes bloquear a un Admin.</p>`;
    } else {
        if (usuario.bloqueado) {
            divBloqueo.innerHTML = `<button type="button" onclick="toggleBloqueo(${usuario.id}, '${usuario.nombre}')" style="background:#1a441a; border:1px solid #46d369; color:#46d369; width:100%;">🔓 DESBLOQUEAR</button>`;
        } else {
            divBloqueo.innerHTML = `<button type="button" onclick="toggleBloqueo(${usuario.id}, '${usuario.nombre}')" style="background:#331111; border:1px solid red; color:red; width:100%;">🔒 BLOQUEAR</button>`;
        }
    }

    // 3. Botón Rol
    const divRol = document.getElementById('action-rol');
    if (usuario.rol === 'USER') {
        divRol.innerHTML = `<button type="button" onclick="cambiarRolUsuario(${usuario.id}, 'ADMIN')" style="background:#333; border:1px solid #ffb400; color:#ffb400; width:100%;">⬆️ Hacer ADMIN</button>`;
    } else {
        divRol.innerHTML = `<button type="button" onclick="cambiarRolUsuario(${usuario.id}, 'USER')" style="background:#333; border:1px solid #aaa; color:#aaa; width:100%;">⬇️ Hacer USUARIO</button>`;
    }

    document.getElementById('modal-usuario').style.display = 'block';
    document.getElementById('modal-usuario').scrollIntoView({ behavior: 'smooth' });
}

function cerrarEditorUsuario() {
    document.getElementById('modal-usuario').style.display = 'none';
}

// --- ACCIONES DE USUARIO CON FETCH ---

async function toggleBloqueo(id, nombre) {
    if(!confirm(`¿Cambiar el estado de bloqueo para ${nombre}?`)) return;
    try {
        const res = await fetch('/api/admin/usuario/bloqueo?id=' + id, { method: 'POST' });
        if(res.ok) {
            alert(await res.text());
            cargarUsuarios(); // Recargar tabla
            abrirEditorUsuario(id); // Recargar modal para ver cambios
        } else {
            alert("❌ Error: " + await res.text());
        }
    } catch(e) { alert("Error de conexión"); }
}

async function cambiarRolUsuario(id, nuevoRol) {
    let msg = nuevoRol === 'ADMIN' ? "¿Estás seguro de ASCENDER a este usuario? Tendrá control total." : "¿Estás seguro de DEGRADAR a este administrador?";
    if(!confirm(msg)) return;

    // Doble confirmación para ascender
    if(nuevoRol === 'ADMIN' && !confirm("⚠️ ¿Confirmas dar permisos de Administrador?")) return;

    const params = new URLSearchParams();
    params.append('id', id);
    params.append('nuevoRol', nuevoRol);

    try {
        const res = await fetch('/api/admin/usuario/cambiar-rol', { method: 'POST', body: params });
        if(res.ok) {
            alert("✅ Rol actualizado");
            cargarUsuarios();
            abrirEditorUsuario(id);
        } else {
            alert("❌ Error: " + await res.text());
        }
    } catch(e) { alert("Error de conexión"); }
}

async function eliminarUsuario(id, nombre, rol) {
    if(rol === 'ADMIN') {
        alert("⛔ No puedes eliminar a un Admin. Primero degrádalo a usuario.");
        return;
    }
    if(confirm(`⚠️ ¿ELIMINAR DEFINITIVAMENTE A "${nombre}"?\nEsta acción es irreversible.`)) {
        try {
            const res = await fetch(`/api/admin/usuario/eliminar/${id}`, { method: 'DELETE' });
            if(res.ok) {
                alert("🗑️ Usuario eliminado");
                cargarUsuarios();
            } else {
                alert("❌ Error: " + await res.text());
            }
        } catch(e) { alert("Error de conexión"); }
    }
}


// --- 4. CARGAR SERIES SELECTOR ---
async function cargarSeriesEnSelector() {
    const selector = document.getElementById('selector-series');
    selector.innerHTML = '<option value="" disabled selected>⏳ Buscando series...</option>';

    try {
        const response = await fetch('/api/public/catalogo');
        const data = await response.json();
        const series = data.filter(item => !item.rutaVideo);

        selector.innerHTML = '<option value="" disabled selected>-- Elige una Serie --</option>';

        if(series.length === 0) {
            const option = document.createElement('option');
            option.text = "No hay series creadas todavía";
            selector.add(option);
        } else {
            series.forEach(serie => {
                const option = document.createElement('option');
                option.value = serie.id;
                option.text = serie.titulo;
                selector.add(option);
            });
        }
    } catch (error) {
        console.error(error);
        selector.innerHTML = '<option value="" disabled selected>❌ Error al cargar</option>';
    }
}

// --- 5. CARGAR CONTENIDO PARA EDITAR ---
async function cargarContenidoParaEditar() {
    cerrarEditor();
    const grid = document.getElementById('grid-edicion');
    grid.innerHTML = '<p>Cargando contenido...</p>';

    try {
        const response = await fetch('/api/public/catalogo');
        const data = await response.json();
        grid.innerHTML = '';

        data.forEach(item => {
            const div = document.createElement('div');
            div.className = 'card-edit';
            div.onclick = () => abrirEditor(item.id);

            const img = item.rutaCaratula ? item.rutaCaratula : 'https://via.placeholder.com/150x220?text=No+Cover';

            div.innerHTML = `
                <img src="${img}" alt="${item.titulo}">
                <p>${item.titulo}</p>
            `;
            grid.appendChild(div);
        });

    } catch (error) {
        grid.innerHTML = '<p style="color:red">Error cargando catálogo.</p>';
    }
}

// --- 6. ABRIR EDITOR (CONTENIDO) ---
async function abrirEditor(id) {
    document.getElementById('grid-edicion').style.display = 'none';
    const formContainer = document.getElementById('formulario-edicion');
    formContainer.style.display = 'block';
    formContainer.scrollIntoView({ behavior: 'smooth' });

    try {
        const response = await fetch('/api/public/contenido/' + id);
        const data = await response.json();

        document.getElementById('edit-id').value = data.id;
        document.getElementById('edit-titulo-display').textContent = data.titulo;
        document.getElementById('edit-titulo').value = data.titulo || '';
        document.getElementById('edit-sinopsis').value = data.sipnosis || data.sinopsis || '';
        document.getElementById('edit-trailer').value = data.youtubeTrailerId || '';
    } catch (e) {
        alert("Error al cargar datos del contenido");
        cerrarEditor();
    }
}

function cerrarEditor() {
    document.getElementById('formulario-edicion').style.display = 'none';
    document.getElementById('grid-edicion').style.display = 'grid';
    document.querySelector('#formulario-edicion form').reset();
}

// --- 7. ENVÍO DE FORMULARIOS (CON OVERLAY) ---
async function enviarFormulario(event) {
    event.preventDefault();
    const form = event.target;

    const consola = document.getElementById('console-box');
    const contenidoConsola = document.getElementById('console-content');
    const overlay = document.getElementById('overlay-loading'); // Referencia al overlay

    // 1. ACTIVAR MODO CARGA
    overlay.style.display = 'flex'; // Bloquear pantalla
    consola.style.display = 'block'; // Asegurar que la consola se ve
    contenidoConsola.textContent = "⏳ Procesando solicitud... espera por favor.";
    contenidoConsola.style.color = "#ffff00";

    try {
        const formData = new FormData(form);
        const response = await fetch(form.action, { method: 'POST', body: formData });

        if (response.ok) {
            const json = await response.json();

            // 2. ÉXITO: MOSTRAR JSON
            contenidoConsola.textContent = "✅ ¡ÉXITO!\nDatos recibidos del servidor:\n" + JSON.stringify(json, null, 4);
            contenidoConsola.style.color = "#0f0"; // Verde hacker

            // Lógica de limpieza
            if(!form.action.includes("editar-contenido")) {
                form.reset();
            } else {
                // Si editamos, esperamos un poco antes de cerrar el editor
                setTimeout(() => {
                    cerrarEditor();
                    cargarContenidoParaEditar();
                    cargarMetricas();
                }, 1500);
            }

            if(form.action.includes("nuevo-capitulo")) {
                cargarSeriesEnSelector();
            }
            cargarMetricas();

        } else {
            // ERROR DEL SERVIDOR
            const textoError = await response.text();
            contenidoConsola.textContent = "❌ ERROR:\n" + textoError;
            contenidoConsola.style.color = "#ff4444";
        }
    } catch (error) {
        // ERROR DE RED
        console.error(error);
        contenidoConsola.textContent = "❌ Error de conexión: " + error.message;
        contenidoConsola.style.color = "#ff4444";
    } finally {
        // 3. FINALIZAR: QUITAMOS EL BLOQUEO
        // El JSON se queda visible en la consola debajo
        overlay.style.display = 'none';
    }
}

// --- 8. ELIMINAR CONTENIDO ---
async function eliminarContenido() {
    const id = document.getElementById('edit-id').value;
    const titulo = document.getElementById('edit-titulo-display').innerText;

    if(!confirm(`⚠️ ¿ESTÁS SEGURO?\n\nVas a eliminar "${titulo}" y todos sus archivos.\nEsta acción no se puede deshacer.`)) {
        return;
    }

    try {
        const response = await fetch('/api/admin/eliminar-contenido/' + id, {
            method: 'DELETE'
        });

        if(response.ok) {
            alert("✅ Eliminado correctamente");
            cerrarEditor();
            cargarContenidoParaEditar();
            cargarMetricas();
        } else {
            alert("❌ Error al eliminar: " + await response.text());
        }
    } catch (e) {
        alert("❌ Error de conexión");
    }
}