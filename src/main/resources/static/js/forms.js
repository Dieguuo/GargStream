/**
 * forms.js
 * Envío de formularios y overlay
 */

async function enviarFormulario(e) {
  e.preventDefault();

  const form = e.target;
  const ov = document.getElementById('overlay-loading');
  const con = document.getElementById('console-content');

  ov.style.display = 'flex';
  document.getElementById('console-box').style.display = 'block';
  con.innerText = "⏳ Procesando...";

  try {
    const fd = new FormData(form);
    const r = await fetch(form.action, { method:'POST', body:fd });

    if (r.ok) {
      const j = await r.json();
      con.innerText = "✅ ÉXITO:\n" + JSON.stringify(j, null, 2);
      con.style.color = "#0f0";

      if (form.action.includes('editar')) {
        setTimeout(() => {
          cerrarEditor();
          cargarContenidoParaEditar();
          cargarMetricas();
        }, 1500);
      } else {
        form.reset();
        if (form.action.includes('capitulo')) cargarSeriesEnSelector();
        cargarMetricas();
      }
    } else {
      con.innerText = "❌ ERROR:\n" + await r.text();
      con.style.color = "red";
    }
  } catch (err) {
    con.innerText = "❌ Error Red: " + err.message;
    con.style.color = "red";
  } finally {
    ov.style.display = 'none';
  }
}
