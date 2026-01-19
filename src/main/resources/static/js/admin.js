// --- 0. INICIO AUTOMÁTICO ---
document.addEventListener("DOMContentLoaded", () => {
    cargarMetricas();
});

// Variable global para lista de usuarios
let listaUsuariosGlobal = [];

// --- 1. GESTIÓN DE PESTAÑAS ---
function mostrar(idSeccion) {
    document.querySelectorAll('.form-section').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));

    const seccion = document.getElementById(idSeccion);
    if(seccion) seccion.classList.add('active');

    document.getElementById('console-box').style.display = 'none';

    const botones = document.querySelectorAll('.menu-btn');
    const mapa = {
        'sec-dashboard': 0, 'sec-usuarios': 1, 'sec-cine': 2,
        'sec-serie': 3, 'sec-capitulo': 4, 'sec-video': 5, 'sec-editar': 6
    };
    if (mapa[idSeccion] !== undefined) botones[mapa[idSeccion]].classList.add('active');
}

// --- 2. MÉTRICAS ---
async function cargarMetricas() {
    try {
        const res = await fetch('/api/admin/metricas');
        if(res.ok) {
            const data = await res.json();
            const pelis = document.getElementById('metric-pelis');
            if(pelis) pelis.innerText = data.peliculas;

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
    } catch (e) { console.error("Error metricas", e); }
}

// --- 3. GESTIÓN DE USUARIOS ---
async function cargarUsuarios() {
    cerrarEditorUsuario();
    const tbody = document.getElementById('tabla-usuarios-body');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Cargando...</td></tr>';

    try {
        const res = await fetch('/api/admin/usuarios');
        if(res.ok) {
            listaUsuariosGlobal = await res.json();
            renderizarTablaUsuarios(listaUsuariosGlobal);
        } else {
            tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">Error al cargar</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="6" style="color:red; text-align:center;">Error de conexión</td></tr>';
    }
}

function renderizarTablaUsuarios(usuarios) {
    const tbody = document.getElementById('tabla-usuarios-body');
    tbody.innerHTML = '';
    if(!usuarios || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay usuarios.</td></tr>';
        return;
    }

    usuarios.forEach(u => {
        const tr = document.createElement('tr');
        if (u.bloqueado) tr.style.background = "rgba(255, 0, 0, 0.1)";

        const avatar = u.avatarUrl || '/img/default-avatar.png';
        const badge = u.rol === 'ADMIN' ? 'badge-admin' : 'badge-user';
        const fecha = u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString() : '-';
        const estado = u.bloqueado ? '<span style="color:red;">BLOQ</span>' : '<span style="color:#46d369;">ACTIVO</span>';

        tr.innerHTML = `
            <td><img src="${avatar}" class="table-avatar" onerror="this.src='https://via.placeholder.com/40'"></td>
            <td class="user-identity"><div class="name">${u.nombre}</div><div class="email">${u.email}</div></td>
            <td>${estado}</td>
            <td><span class="badge ${badge}">${u.rol}</span></td>
            <td>${fecha}</td>
            <td style="text-align: right;">
                <button class="action-btn" onclick="abrirEditorUsuario(${u.id})">⚙️</button>
                <button class="action-btn" onclick="eliminarUsuario(${u.id}, '${u.nombre}', '${u.rol}')" style="color:#f44;">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filtrarUsuarios() {
    const txt = document.getElementById('buscador-usuarios').value.toLowerCase();
    const filtrados = listaUsuariosGlobal.filter(u => u.nombre.toLowerCase().includes(txt) || u.email.toLowerCase().includes(txt));
    renderizarTablaUsuarios(filtrados);
}

// Modal Usuario
function abrirEditorUsuario(id) {
    const u = listaUsuariosGlobal.find(x => x.id === id);
    if(!u) return;

    document.getElementById('user-info-id').innerText = u.id;
    document.getElementById('user-info-nombre').innerText = u.nombre;
    document.getElementById('user-info-email').innerText = u.email;
    document.getElementById('user-info-estado').innerHTML = u.bloqueado ? "<b style='color:red'>BLOQ</b>" : "<b style='color:green'>ACTIVO</b>";

    const divBloq = document.getElementById('action-bloqueo');
    if (u.rol === 'ADMIN') divBloq.innerHTML = "<small>No puedes bloquear a un Admin.</small>";
    else divBloq.innerHTML = `<button type="button" onclick="toggleBloqueo(${u.id}, '${u.nombre}')" style="width:100%; border:1px solid ${u.bloqueado?'green':'red'}; color:${u.bloqueado?'green':'red'}; background:transparent;">${u.bloqueado?'DESBLOQUEAR':'BLOQUEAR'}</button>`;

    const divRol = document.getElementById('action-rol');
    if (u.rol === 'USER') divRol.innerHTML = `<button type="button" onclick="cambiarRolUsuario(${u.id}, 'ADMIN')" style="width:100%; border:1px solid gold; color:gold; background:transparent;">Hacer ADMIN</button>`;
    else divRol.innerHTML = `<button type="button" onclick="cambiarRolUsuario(${u.id}, 'USER')" style="width:100%; border:1px solid grey; color:grey; background:transparent;">Hacer USUARIO</button>`;

    const modal = document.getElementById('modal-usuario');
    modal.style.display = 'block';
    modal.scrollIntoView({ behavior: 'smooth' });
}

function cerrarEditorUsuario() { document.getElementById('modal-usuario').style.display = 'none'; }

// API Usuarios
async function toggleBloqueo(id, nombre) {
    if(!confirm(`¿Cambiar bloqueo a ${nombre}?`)) return;
    try {
        const r = await fetch(`/api/admin/usuario/bloqueo?id=${id}`, { method: 'POST' });
        if(r.ok) { alert(await r.text()); cargarUsuarios(); abrirEditorUsuario(id); }
        else alert("Error: " + await r.text());
    } catch(e) { alert("Error conexión"); }
}
async function cambiarRolUsuario(id, rol) {
    if(!confirm(`¿Cambiar rol a ${rol}?`)) return;
    const p = new URLSearchParams(); p.append('id', id); p.append('nuevoRol', rol);
    try {
        const r = await fetch('/api/admin/usuario/cambiar-rol', { method:'POST', body:p });
        if(r.ok) { alert("Rol cambiado"); cargarUsuarios(); abrirEditorUsuario(id); }
        else alert("Error: " + await r.text());
    } catch(e) { alert("Error conexión"); }
}
async function eliminarUsuario(id, nombre, rol) {
    if(rol==='ADMIN'){ alert("No puedes borrar admins."); return; }
    if(!confirm(`¿ELIMINAR a ${nombre}?`)) return;
    try {
        const r = await fetch(`/api/admin/usuario/eliminar/${id}`, { method:'DELETE' });
        if(r.ok) { alert("Eliminado"); cargarUsuarios(); }
        else alert("Error: " + await r.text());
    } catch(e) { alert("Error conexión"); }
}


// --- 4. CARGAR SERIES SELECTOR ---
async function cargarSeriesEnSelector() {
    const sel = document.getElementById('selector-series');
    sel.innerHTML = '<option>Cargando...</option>';
    try {
        const r = await fetch('/api/public/catalogo');
        const data = await r.json();
        // Filtro: Solo Series (sin video y sin ser capítulo)
        const series = data.filter(i => !i.rutaVideo && i.numeroCapitulo == null);

        sel.innerHTML = '<option value="" disabled selected>-- Elige Serie --</option>';
        if(series.length===0) sel.innerHTML += '<option disabled>No hay series</option>';
        series.forEach(s => {
            const op = document.createElement('option');
            op.value = s.id; op.text = s.titulo;
            sel.add(op);
        });
    } catch(e) { sel.innerHTML = '<option>Error carga</option>'; }
}


// --- 5. CARGAR CONTENIDO (GRID EDICIÓN) ---
async function cargarContenidoParaEditar() {
    cerrarEditor();
    const grid = document.getElementById('grid-edicion');
    grid.innerHTML = '<p>Cargando...</p>';
    try {
        const r = await fetch('/api/public/catalogo');
        const data = await r.json();
        // Filtro: Ocultar capítulos sueltos
        const items = data.filter(i => i.numeroCapitulo == null);

        grid.innerHTML = '';
        items.forEach(i => {
            const d = document.createElement('div');
            d.className = 'card-edit';
            d.onclick = () => abrirEditor(i.id);
            const img = i.rutaCaratula || 'https://via.placeholder.com/150x220?text=No+Img';
            d.innerHTML = `<img src="${img}"><p>${i.titulo}</p>`;
            grid.appendChild(d);
        });
    } catch(e) { grid.innerHTML = '<p style="color:red">Error conexión</p>'; }
}


// --- 6. ABRIR EDITOR ---
async function abrirEditor(id) {
    document.getElementById('grid-edicion').style.display = 'none';
    const form = document.getElementById('formulario-edicion');
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth' });

    // Limpiar lista caps
    const divCaps = document.getElementById('lista-capitulos-gestion');
    if(divCaps) { divCaps.style.display = 'none'; divCaps.innerHTML = ''; }

    try {
        const r = await fetch('/api/public/contenido/' + id);
        const data = await r.json();

        document.getElementById('edit-id').value = data.id;
        document.getElementById('edit-titulo-display').innerText = data.titulo;
        document.getElementById('edit-titulo').value = data.titulo || '';
        document.getElementById('edit-sinopsis').value = data.sipnosis || data.sinopsis || '';
        document.getElementById('edit-trailer').value = data.youtubeTrailerId || '';

        // SI ES SERIE
        if (data.temporadas && data.temporadas.length > 0 && divCaps) {
            divCaps.style.display = 'block';
            let html = '<h3 style="color:#aaa; margin-top:0;">📺 Capítulos</h3>';
            data.temporadas.forEach(temp => {
                if(temp.capitulos) {
                    temp.capitulos.forEach(cap => {
                        html += `
                        <div style="background:#333; padding:5px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
                            <span style="color:#ddd; font-family:monospace;">T${temp.numeroTemporada} E${cap.numeroCapitulo} - ${cap.titulo}</span>
                            <button type="button" onclick="ejecutarBorradoCapitulo(${cap.id}, '${cap.titulo}')" style="background:#800; border:none; color:white; padding:3px 8px; cursor:pointer;">🗑️</button>
                        </div>`;
                    });
                }
            });
            divCaps.innerHTML = html;
        }

    } catch(e) { alert("Error cargando datos"); cerrarEditor(); }
}

function cerrarEditor() {
    document.getElementById('formulario-edicion').style.display = 'none';
    document.getElementById('grid-edicion').style.display = 'grid';
    document.querySelector('#formulario-edicion form').reset();
    const divCaps = document.getElementById('lista-capitulos-gestion');
    if(divCaps) divCaps.innerHTML = '';
}


// --- 7. ENVÍO DE FORMULARIOS ---
async function enviarFormulario(e) {
    e.preventDefault();
    const form = e.target;
    const ov = document.getElementById('overlay-loading');
    const con = document.getElementById('console-content');

    if(ov) ov.style.display = 'flex';
    document.getElementById('console-box').style.display = 'block';
    con.innerText = "⏳ Procesando...";

    try {
        const fd = new FormData(form);
        const r = await fetch(form.action, { method:'POST', body:fd });
        if(r.ok) {
            const j = await r.json();
            con.innerText = "✅ ÉXITO:\n" + JSON.stringify(j, null, 2);
            con.style.color = "#0f0";

            if(form.action.includes('editar')) {
                setTimeout(() => { cerrarEditor(); cargarContenidoParaEditar(); cargarMetricas(); }, 1500);
            } else {
                form.reset();
                if(form.action.includes('capitulo')) cargarSeriesEnSelector();
                cargarMetricas();
            }
        } else {
            con.innerText = "❌ ERROR:\n" + await r.text();
            con.style.color = "red";
        }
    } catch(err) {
        con.innerText = "❌ Error Red: " + err.message;
        con.style.color = "red";
    } finally {
        if(ov) ov.style.display = 'none';
    }
}


// --- 8. FUNCIONES DE BORRADO (RENOMBRADAS Y SEGURAS) ---

// A) BORRAR SERIE/PELÍCULA ENTERA
async function ejecutarBorradoTotal() {
    console.log("Intentando borrar contenido..."); // DEBUG

    const id = document.getElementById('edit-id').value;
    const titulo = document.getElementById('edit-titulo-display').innerText;

    if(!id) { alert("Error: No hay ID cargado"); return; }

    if(!confirm(`⚠️ ¿ELIMINAR DEFINITIVAMENTE "${titulo}"?\nSe borrará todo: archivos, historial, favoritos y capítulos.`)) return;

    try {
        const r = await fetch(`/api/admin/eliminar-contenido/${id}`, { method: 'DELETE' });
        if(r.ok) {
            alert("✅ Contenido eliminado correctamente.");
            cerrarEditor();
            cargarContenidoParaEditar();
            cargarMetricas();
        } else {
            alert("❌ Error al eliminar: " + await r.text());
        }
    } catch(e) { alert("❌ Error de conexión al borrar."); }
}

// B) BORRAR CAPÍTULO SUELTO
async function ejecutarBorradoCapitulo(idCap, titulo) {
    if(!confirm(`⚠️ ¿Borrar capítulo "${titulo}"?`)) return;
    try {
        const r = await fetch(`/api/admin/eliminar-contenido/${idCap}`, { method: 'DELETE' });
        if(r.ok) {
            alert("Capítulo eliminado.");
            // Recargar para ver cambios
            const idPadre = document.getElementById('edit-id').value;
            abrirEditor(idPadre);
            cargarMetricas();
        } else {
            alert("Error: " + await r.text());
        }
    } catch(e) { alert("Error conexión"); }
}