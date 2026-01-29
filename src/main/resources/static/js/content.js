/**
 * content.js
 * Gestión completa de contenido:
 * - Selector de series
 * - Grid de edición
 * - Editor de contenido
 * - Gestión de capítulos
 * - Borrado de contenido
 */

// cargar las series en el selector
async function cargarSeriesEnSelector() {
  const sel = document.getElementById('selector-series');
  sel.innerHTML = '<option>Cargando...</option>';

  try {
    const r = await fetch('/api/public/catalogo');
    const data = await r.json();

    // filtro: solo las series, que no se metan los caps
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

// grid de contneido
async function cargarContenidoParaEditar() {
  cerrarEditor();

  const grid = document.getElementById('grid-edicion');
  grid.innerHTML = '<p>Cargando...</p>';

  try {
    const r = await fetch('/api/public/catalogo');
    const data = await r.json();

    // filtro: ocultar lso caps sueltos
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

// editar contenido
async function abrirEditor(id) {
  document.getElementById('grid-edicion').style.display = 'none';

  const form = document.getElementById('formulario-edicion');
  form.style.display = 'block';
  form.scrollIntoView({ behavior: 'smooth' });

  // quitar los caps de la lista
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

    //si es serie listar caps
    if (data.temporadas && data.temporadas.length > 0 && divCaps) {
      divCaps.style.display = 'block';

      let html = '<h3 style="color:#aaa; margin-top:0;">Capítulos</h3>';

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
                  Borrar
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


// borrar serie/peli entera
async function ejecutarBorradoTotal() {
  console.log("Intentando borrar contenido...");

  const id = document.getElementById('edit-id').value;
  const titulo = document.getElementById('edit-titulo-display').innerText;

  if (!id) {
    alert("Error: No hay ID cargado");
    return;
  }

  if (!confirm(`¿ELIMINAR DEFINITIVAMENTE "${titulo}"?\nSe borrará todo: archivos, historial, favoritos y capítulos.`)) return;

  try {
    // 🟢 AÑADIR CABECERAS CSRF
    const r = await fetch(`/api/admin/eliminar-contenido/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()

    if (r.ok) {
      alert("Contenido eliminado correctamente.");
      cerrarEditor();
      cargarContenidoParaEditar();
      if(typeof cargarMetricas === 'function') cargarMetricas();
    } else {
      alert("Error al eliminar: " + await r.text());
    }

  } catch (e) {
    console.error(e);
    alert("Error de conexión al borrar.");
  }
}

// borrar un cap suelto
async function ejecutarBorradoCapitulo(idCap, titulo) {
  if (!confirm(`¿Borrar capítulo "${titulo}"?`)) return;

  try {
    // 🟢 AÑADIR CABECERAS CSRF
    const r = await fetch(`/api/admin/eliminar-contenido/${idCap}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });

    if (r.ok) {
      alert("Capítulo eliminado.");
      // recargar editor del padre
      const idPadre = document.getElementById('edit-id').value;
      abrirEditor(idPadre);
      if(typeof cargarMetricas === 'function') cargarMetricas();
    } else {
      alert("Error: " + await r.text());
    }

  } catch (e) {
    alert("Error conexión");
  }
}


//filtrar en editor /gestion de contenido
function filtrarContenidoAdmin() {
    // obtener lo que ha escrito el usuario
    const input = document.getElementById('buscadorAdmin');
    const filtro = input.value.toLowerCase(); // convertir a minúsculas para comparar mejor

    // obtener el contenedor y las tarjetas
    const grid = document.getElementById('gridAdmin');
    const tarjetas = document.querySelectorAll('.card-edit');

    // recorrer todas las tarjetas
    tarjetas.forEach(tarjeta => {
        // buscar el título
        const titulo = tarjeta.querySelector('p');

        if (titulo) {
            const textoTitulo = titulo.textContent || titulo.innerText;

            // comparar
            if (textoTitulo.toLowerCase().indexOf(filtro) > -1) {
                tarjeta.style.display = "";
            } else {
                tarjeta.style.display = "none"; // ocultar
            }
        }
    });
}
