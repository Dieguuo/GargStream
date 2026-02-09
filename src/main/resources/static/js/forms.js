/**
 * forms.js
 * Envío de formularios con seguridad CSRF
 */

async function enviarFormulario(e) {
  e.preventDefault();

  const form = e.target;
  const ov = document.getElementById('overlay-loading');
  const con = document.getElementById('console-content');

  // Mostrar loading
  if(ov) ov.style.display = 'flex';
  document.getElementById('console-box').style.display = 'block';
  con.innerText = "Procesando...";

  try {
    const fd = new FormData(form);

    //Añadimos las cabeceras de seguridad
    const headers = getAuthHeaders();
    // Al usar FormData, NO ponemos 'Content-Type', el navegador lo pone solo.

    const r = await fetch(form.action, {
        method: 'POST',
        headers: headers, // <--- Inyectamos el token aquí
        body: fd
    });

    if (r.ok) {
      const j = await r.json();
      con.innerText = "ÉXITO:\n" + JSON.stringify(j, null, 2);
      con.style.color = "#46d369";

      // Refrescar lógica según el formulario
      if (form.action.includes('editar')) {
        setTimeout(() => {
          cerrarEditor();
          cargarContenidoParaEditar();
          cargarMetricas();
        }, 1500);
      } else {
        form.reset();
        // Si es capítulo, recargar selector
        if (form.action.includes('capitulo') && typeof cargarSeriesEnSelector === 'function') {
            cargarSeriesEnSelector();
        }
        if (typeof cargarMetricas === 'function') cargarMetricas();
      }
    } else {
      const textoError = await r.text();
      con.innerText = "ERROR (" + r.status + "):\n" + textoError;
      con.style.color = "#ff4444";
    }
  } catch (err) {
    con.innerText = "Error Crítico: " + err.message;
    con.style.color = "red";
    console.error(err);
  } finally {
    if(ov) ov.style.display = 'none';
  }
}



// Función para ver las imágenes antes de subir
function previsualizarPro(input, idImg, idPlaceholder) {
    const img = document.getElementById(idImg);
    const placeholder = document.getElementById(idPlaceholder);
    // Buscamos la etiqueta flotante (es hermana de la imagen)
    const label = img.parentElement.querySelector('.preview-label-floating');

    if (input.files && input.files[0]) {
        const reader = new FileReader();

        reader.onload = function(e) {
            img.src = e.target.result;
            img.style.display = 'block';       // Mostramos la imagen
            placeholder.style.display = 'none'; // Ocultamos el texto de fondo
            if(label) label.style.display = 'block'; // Mostramos la etiquetita negra
        }

        reader.readAsDataURL(input.files[0]);
    } else {
        img.src = "";
        img.style.display = 'none';
        placeholder.style.display = 'block';
        if(label) label.style.display = 'none';
    }
}