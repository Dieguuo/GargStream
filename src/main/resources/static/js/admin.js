// --- 0. INICIO AUTOMÁTICO ---
document.addEventListener("DOMContentLoaded", () => {
    cargarMetricas();
});

// --- 1. GESTIÓN DE PESTAÑAS ---
function mostrar(idSeccion) {
    document.querySelectorAll('.form-section').forEach(div => div.classList.remove('active'));
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(idSeccion).classList.add('active');
    document.getElementById('console-box').style.display = 'none';

    const botones = document.querySelectorAll('.menu-btn');
    if(idSeccion === 'sec-dashboard') botones[0].classList.add('active');
    if(idSeccion === 'sec-cine') botones[1].classList.add('active');
    if(idSeccion === 'sec-serie') botones[2].classList.add('active');
    if(idSeccion === 'sec-capitulo') botones[3].classList.add('active');
    if(idSeccion === 'sec-video') botones[4].classList.add('active');
    if(idSeccion === 'sec-editar') botones[5].classList.add('active');
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

// --- 3. CARGAR SERIES SELECTOR ---
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

// --- 4. CARGAR CONTENIDO PARA EDITAR ---
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

// --- 5. ABRIR EDITOR ---
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

// --- 6. ENVÍO DE FORMULARIOS (CON OVERLAY) ---
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

// --- 7. ELIMINAR CONTENIDO ---
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