/**
 * content.js
 * Gestión completa de contenido:
 * - Selector de series
 * - Grid de edición
 * - Editor de contenido
 * - Gestión de capítulos
 * - Borrado de contenido
 */

// ================================
// 4. CARGAR SERIES EN SELECTOR
// ================================
async function cargarSeriesEnSelector() {
  const sel = document.getElementById('selector-series');
  sel.innerHTML = '<option>Cargando...</option>';

  try {
    const r = await fetch('/api/public/catalogo');
    const data = await r.json();

    // Filtro: solo series (sin vídeo y sin ser capítulo)
    const series = data.filter(i => !i.rutaVideo && i.numeroCapitulo == null);

    sel.innerHTML = '<option value="" disabled selected>-- Elige Serie --</option>';

    if (series.length === 0) {
      sel.innerHTML += '<option disabled>No hay series</option>';
      return;
    }

    series.forEach(s => {
      const op = document.createElement('option');
      op.value = s.id;
      op.text = s.titulo;
      sel.add(op);
    });

  } catch (e) {
    sel.innerHTML = '<option>Error carga</option>';
  }
}

// ================================
// 5. GRID DE CONTENIDO PARA EDICIÓN
// ================================
async function cargarContenidoParaEditar() {
  cerrarEditor();

  const grid = document.getElementById('grid-edicion');
  grid.innerHTML = '<p>Cargando...</p>';

  try {
    const r = await fetch('/api/public/catalogo');
    const data = await r.json();

    // Filtro: ocultar capítulos sueltos
    const items = data.filter(i => i.numeroCapitulo == null);

    grid.innerHTML = '';

    items.forEach(i => {
      const d = document.createElement('div');
      d.className = 'card-edit';
      d.onclick = () => abrirEditor(i.id);

      const img = i.rutaCaratula || 'https://via.placeholder.com/150x220?text=No+Img';

      d.innerHTML = `
        <img src="${img}">
        <p>${i.titulo}</p>
      `;

      grid.appendChild(d);
    });

  } catch (e) {
    grid.innerHTML = '<p style="color:red">Error conexión</p>';
  }
}

// ================================
// 6. EDITOR DE CONTENIDO
// ================================
async function abrirEditor(id) {
  document.getElementById('grid-edicion').style.display = 'none';

  const form = document.getElementById('formulario-edicion');
  form.style.display = 'block';
  form.scrollIntoView({ behavior: 'smooth' });

  // Limpiar lista de capítulos
  const divCaps = document.getElementById('lista-capitulos-gestion');
  if (divCaps) {
    divCaps.style.display = 'none';
    divCaps.innerHTML = '';
  }

  try {
    const r = await fetch('/api/public/contenido/' + id);
    const data = await r.json();

    document.getElementById('edit-id').value = data.id;
    document.getElementById('edit-titulo-display').innerText = data.titulo;
    document.getElementById('edit-titulo').value = data.titulo || '';
    document.getElementById('edit-sinopsis').value =
      data.sipnosis || data.sinopsis || '';
    document.getElementById('edit-trailer').value =
      data.youtubeTrailerId || '';

    // ================================
    // SI ES SERIE → LISTAR CAPÍTULOS
    // ================================
    if (data.temporadas && data.temporadas.length > 0 && divCaps) {
      divCaps.style.display = 'block';

      let html = '<h3 style="color:#aaa; margin-top:0;">📺 Capítulos</h3>';

      data.temporadas.forEach(temp => {
        if (temp.capitulos) {
          temp.capitulos.forEach(cap => {
            html += `
              <div style="
                background:#333;
                padding:5px;
                margin-bottom:5px;
                display:flex;
                justify-content:space-between;
                align-items:center;
              ">
                <span style="color:#ddd; font-family:monospace;">
                  T${temp.numeroTemporada} E${cap.numeroCapitulo} - ${cap.titulo}
                </span>
                <button
                  type="button"
                  onclick="ejecutarBorradoCapitulo(${cap.id}, '${cap.titulo}')"
                  style="
                    background:#800;
                    border:none;
                    color:white;
                    padding:3px 8px;
                    cursor:pointer;
                  ">
                  🗑️
                </button>
              </div>
            `;
          });
        }
      });

      divCaps.innerHTML = html;
    }

  } catch (e) {
    alert("Error cargando datos");
    cerrarEditor();
  }
}

function cerrarEditor() {
  document.getElementById('formulario-edicion').style.display = 'none';
  document.getElementById('grid-edicion').style.display = 'grid';

  const form = document.querySelector('#formulario-edicion form');
  if (form) form.reset();

  const divCaps = document.getElementById('lista-capitulos-gestion');
  if (divCaps) divCaps.innerHTML = '';
}

// ================================
// 8. FUNCIONES DE BORRADO
// ================================

// --------------------------------
// A) BORRAR SERIE / PELÍCULA ENTERA
// --------------------------------
async function ejecutarBorradoTotal() {
  console.log("Intentando borrar contenido...");

  const id = document.getElementById('edit-id').value;
  const titulo = document.getElementById('edit-titulo-display').innerText;

  if (!id) {
    alert("Error: No hay ID cargado");
    return;
  }

  if (!confirm(
    `⚠️ ¿ELIMINAR DEFINITIVAMENTE "${titulo}"?\n` +
    `Se borrará todo: archivos, historial, favoritos y capítulos.`
  )) return;

  try {
    const r = await fetch(`/api/admin/eliminar-contenido/${id}`, {
      method: 'DELETE'
    });

    if (r.ok) {
      alert("✅ Contenido eliminado correctamente.");
      cerrarEditor();
      cargarContenidoParaEditar();
      cargarMetricas();
    } else {
      alert("❌ Error al eliminar: " + await r.text());
    }

  } catch (e) {
    alert("❌ Error de conexión al borrar.");
  }
}

// --------------------------------
// B) BORRAR CAPÍTULO SUELTO
// --------------------------------
async function ejecutarBorradoCapitulo(idCap, titulo) {
  if (!confirm(`⚠️ ¿Borrar capítulo "${titulo}"?`)) return;

  try {
    const r = await fetch(`/api/admin/eliminar-contenido/${idCap}`, {
      method: 'DELETE'
    });

    if (r.ok) {
      alert("Capítulo eliminado.");

      // Recargar editor del padre
      const idPadre = document.getElementById('edit-id').value;
      abrirEditor(idPadre);
      cargarMetricas();
    } else {
      alert("Error: " + await r.text());
    }

  } catch (e) {
    alert("Error conexión");
  }
}
