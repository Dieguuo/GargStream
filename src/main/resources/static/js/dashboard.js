/**
 * dashboard.js
 * Métricas y estado del servidor
 */

async function cargarMetricas() {
  try {
    const res = await fetch('/api/admin/metricas');
    if (!res.ok) return;

    const data = await res.json();

    const pelis = document.getElementById('metric-pelis');
    if (pelis) pelis.innerText = data.peliculas;

    document.getElementById('metric-series').innerText = data.series;
    document.getElementById('metric-videos').innerText = data.videos;
    document.getElementById('metric-espacio').innerText = data.porcentaje + "%";
    document.getElementById('disk-used').innerText = data.usado;
    document.getElementById('disk-total').innerText = "Total: " + data.total;

    const barra = document.getElementById('disk-bar');
    barra.style.width = data.porcentaje + "%";

    if (data.porcentaje > 90) barra.style.backgroundColor = "#ff0000";
    else if (data.porcentaje > 70) barra.style.backgroundColor = "#ffa500";
    else barra.style.backgroundColor = "#46d369";

  } catch (e) {
    console.error("Error métricas", e);
  }
}
