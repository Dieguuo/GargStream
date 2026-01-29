/**
 * navigation.js
 * gestión de navegación entre secciones del panel
 */

function mostrar(idSeccion) {
  document.querySelectorAll('.form-section')
    .forEach(div => div.classList.remove('active'));

  document.querySelectorAll('.menu-btn')
    .forEach(btn => btn.classList.remove('active'));

  const seccion = document.getElementById(idSeccion);
  if (seccion) seccion.classList.add('active');

  document.getElementById('console-box').style.display = 'none';

  const botones = document.querySelectorAll('.menu-btn');
  const mapa = {
    'sec-dashboard': 0,
    'sec-usuarios': 1,
    'sec-cine': 2,
    'sec-serie': 3,
    'sec-capitulo': 4,
    'sec-video': 5,
    'sec-editar': 6
  };

  if (mapa[idSeccion] !== undefined) {
    botones[mapa[idSeccion]].classList.add('active');
  }
}
