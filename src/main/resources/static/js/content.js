/**
 * content.js
 * Gestión completa de contenido
 */

// 🟢 1. Función de seguridad (La añadimos aquí por si admin.js falla o no carga a tiempo)
function getHeaders() {
    const tokenMeta = document.querySelector('meta[name="_csrf"]');
    const headerMeta = document.querySelector('meta[name="_csrf_header"]');
    if (!tokenMeta || !headerMeta) return {};
    return { [headerMeta.getAttribute('content')]: tokenMeta.getAttribute('content') };
}

// cargar las series en el selector
async function cargarSeriesEnSelector() {
  const sel = document.getElementById('selector-series');
  if(!sel) return;
  sel.innerHTML = '<option>Cargando...</option>';

  try {
    const r = await fetch('/api/public/catalogo');
    const data = await r.json();
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

// 🟢 ESTA ES LA FUNCIÓN QUE FALLA AHORA
async function cargarContenidoParaEditar() {
  console.log("✅ Iniciando carga de contenido para editar..."); // Mensaje de control

  // Ocultamos formulario, mostramos grid
  cerrarEditor();

  const grid = document.getElementById('grid-edicion');
  if(!grid) {
      console.error("❌ No encuentro el div 'grid-edicion' en el HTML");
      return;
  }

  // Cambiamos el texto para saber que JS está actuando
  grid.innerHTML = '<p style="text-align:center; color:#ffb400;">Conectando con el servidor...</p>';

  try {
    const r = await fetch('/api/public/catalogo');
    const data = await r.json();

    // Filtramos para no mostrar capítulos sueltos
    const items = data.filter(i => i.numeroCapitulo == null);

    grid.innerHTML = ''; // Limpiamos mensaje de carga

    if(items.length === 0) {
        grid.innerHTML = '<p style="text-align:center;">No hay contenido subido aún.</p>';
        return;
    }

    items.forEach(i => {
      const d = document.createElement('div');
      d.className = 'card-edit';
      d.onclick = () => abrirEditor(i.id);

      const img = i.rutaCaratula || 'https://via.placeholder.com/150x220?text=No+Img';

      d.innerHTML = `
        <img src="${img}" onerror="this.src='https://via.placeholder.com/150x220?text=Error'">
        <p>${i.titulo}</p>
      `;

      grid.appendChild(d);
    });
    console.log("✅ Contenido cargado: " + items.length + " items.");

  } catch (e) {
    console.error(e);
    grid.innerHTML = '<p style="color:red; text-align:center;">Error de conexión al cargar catálogo.</p>';
  }
}

async function abrirEditor(id) {
  // Ocultamos grid, mostramos formulario
  document.getElementById('grid-edicion').style.display = 'none';
  const form = document.getElementById('formulario-edicion');
  form.style.display = 'block'; // Lo hacemos visible
  form.scrollIntoView({ behavior: 'smooth' });

  // Limpiar lista de capítulos anterior
  const divCaps = document.getElementById('lista-capitulos-gestion');
  if (divCaps) {
    divCaps.style.display = 'none';
    divCaps.innerHTML = '';
  }

  try {
    const r = await fetch('/api/public/contenido/' + id);
    const data = await r.json();

    document.getElementById('edit-id').value = data.id;

    // Título visible grande y input
    const titleDisplay = document.getElementById('edit-titulo-display');
    if(titleDisplay) titleDisplay.innerText = data.titulo;
    document.getElementById('edit-titulo').value = data.titulo || '';

    document.getElementById('edit-sinopsis').value = data.sipnosis || data.sinopsis || '';
    document.getElementById('edit-trailer').value = data.youtubeTrailerId || '';

    // Si es serie, cargar capítulos
    if (data.temporadas && data.temporadas.length > 0 && divCaps) {
      divCaps.style.display = 'block';
      let html = '<h3 style="color:#aaa; margin-top:0;">Capítulos</h3>';

      data.temporadas.forEach(temp => {
        if (temp.capitulos) {
          temp.capitulos.forEach(cap => {
            html += `
              <div style="background:#333; padding:5px; margin-bottom:5px; display:flex; justify-content:space-between; align-items:center;">
                <span style="color:#ddd; font-family:monospace;">
                  T${temp.numeroTemporada} E${cap.numeroCapitulo} - ${cap.titulo}
                </span>
                <button type="button"
                        onclick="ejecutarBorradoCapitulo(${cap.id}, '${cap.titulo}')"
                        style="background:#800; border:none; color:white; padding:3px 8px; cursor:pointer;">
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
    alert("Error cargando datos del contenido");
    cerrarEditor();
  }
}

function cerrarEditor() {
  const form = document.getElementById('formulario-edicion');
  const grid = document.getElementById('grid-edicion');

  if(form) {
      form.style.display = 'none'; // Ocultar formulario
      form.querySelector('form').reset();
  }
  if(grid) grid.style.display = 'grid'; // Mostrar grid
}

// --- FUNCIONES DE BORRADO (CON SEGURIDAD) ---

async function ejecutarBorradoTotal() {
  const id = document.getElementById('edit-id').value;
  if (!id) return alert("Error: No hay ID cargado");

  if (!confirm("¿ELIMINAR DEFINITIVAMENTE este contenido y sus archivos?")) return;

  try {
    const r = await fetch(`/api/admin/eliminar-contenido/${id}`, {
      method: 'DELETE',
      headers: getHeaders() // Token
    });

    if (r.ok) {
      alert("Eliminado correctamente.");
      cargarContenidoParaEditar(); // Recargar grid
      if(typeof cargarMetricas === 'function') cargarMetricas();
    } else {
      alert("Error: " + await r.text());
    }
  } catch (e) {
    alert("Error de conexión");
  }
}

async function ejecutarBorradoCapitulo(idCap, titulo) {
  if (!confirm(`¿Borrar capítulo "${titulo}"?`)) return;

  try {
    const r = await fetch(`/api/admin/eliminar-contenido/${idCap}`, {
      method: 'DELETE',
      headers: getHeaders() // Token
    });

    if (r.ok) {
      alert("Capítulo eliminado.");
      const idPadre = document.getElementById('edit-id').value;
      abrirEditor(idPadre); // Recargar datos de la serie
    } else {
      alert("Error: " + await r.text());
    }
  } catch (e) {
    alert("Error conexión");
  }
}

function filtrarContenidoAdmin() {
    const input = document.getElementById('buscadorAdmin');
    const filtro = input.value.toLowerCase();
    const tarjetas = document.querySelectorAll('.card-edit');

    tarjetas.forEach(tarjeta => {
        const titulo = tarjeta.querySelector('p');
        if (titulo) {
            const texto = titulo.textContent || titulo.innerText;
            tarjeta.style.display = texto.toLowerCase().includes(filtro) ? "" : "none";
        }
    });
}