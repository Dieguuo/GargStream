// --- VARIABLES GLOBALES ---
let catalogoCompleto = [];

// Variables Hero
let heroIndex = 0;
let totalRealItems = 0;
let cardWidth = 240;
let isTransitioning = false;
const heroTrack = document.getElementById('hero-track');
const heroSection = document.getElementById('hero-section');

// Variables Táctil y Rueda
let touchStartX = 0;
let touchEndX = 0;
let isWheelCooldown = false;


// --- 1. CARGA INICIAL ---
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/public/novedades')
        .then(res => res.json())
        .then(data => renderHero(data))
        .catch(err => console.error("Error novedades", err));

    fetch('/api/public/catalogo')
        .then(res => res.json())
        .then(data => {
            catalogoCompleto = data;
            generarFiltros(data);
            distribuirCatalogo(data);
        })
        .catch(err => console.error("Error catalogo", err));

    // Listeners del buscador
    document.getElementById('buscador').addEventListener('keyup', (e) => {
        const texto = e.target.value.toLowerCase();
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.filter-chip').classList.add('active');

        if (texto.length > 0) {
            heroSection.classList.add('oculto');
            const filtrados = catalogoCompleto.filter(item =>
                item.titulo.toLowerCase().includes(texto)
            );
            distribuirCatalogo(filtrados);
        } else {
            heroSection.classList.remove('oculto');
            distribuirCatalogo(catalogoCompleto);
        }
    });
});


// --- 2. GENERADOR DE FILTROS ---
function generarFiltros(lista) {
    const contenedor = document.getElementById('filter-bar');
    const generos = new Set();

    lista.forEach(item => {
        if(item.genero && item.genero.trim() !== "") {
            const generosIndividuales = item.genero.split(',');
            generosIndividuales.forEach(subGenero => {
                const generoLimpio = subGenero.trim();
                if(generoLimpio.length > 0) {
                    generos.add(generoLimpio);
                }
            });
        }
    });

    const generosOrdenados = Array.from(generos).sort();

    generosOrdenados.forEach(genero => {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerText = genero;
        chip.onclick = function() {
            filtrarPorGenero(genero, this);
        };
        contenedor.appendChild(chip);
    });
}

// --- 3. LÓGICA DE FILTRADO ---
function filtrarPorGenero(genero, elementoChip) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    elementoChip.classList.add('active');
    document.getElementById('buscador').value = "";

    if (genero === 'Todos') {
        heroSection.classList.remove('oculto');
        distribuirCatalogo(catalogoCompleto);
    } else {
        heroSection.classList.add('oculto');
        const filtrados = catalogoCompleto.filter(item =>
            item.genero && item.genero.includes(genero)
        );
        distribuirCatalogo(filtrados);
    }
}

// --- 4. DISTRIBUCIÓN ---
function distribuirCatalogo(lista) {
    const pelis = lista.filter(item => item.rutaVideo && item.director);
    const series = lista.filter(item => !item.rutaVideo);
    const videos = lista.filter(item => item.rutaVideo && !item.director);

    toggleFila('cat-peliculas', pelis);
    toggleFila('cat-series', series);
    toggleFila('cat-videos', videos);

    if(pelis.length > 0) renderRow(pelis, 'row-peliculas');
    if(series.length > 0) renderRow(series, 'row-series');
    if(videos.length > 0) renderRow(videos, 'row-videos');
}

function toggleFila(idSeccion, items) {
    const seccion = document.getElementById(idSeccion);
    if(items.length === 0) seccion.style.display = 'none';
    else seccion.style.display = 'block';
}

// --- 5. RENDERIZADO HERO ---
function renderHero(lista) {
    heroTrack.innerHTML = "";
    if(lista.length === 0) return;

    totalRealItems = lista.length;
    const clonesInicio = lista.slice(-5);
    const clonesFin = lista.slice(0, 5);
    const listaInfinita = [...clonesInicio, ...lista, ...clonesFin];

    listaInfinita.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'hero-card';
        div.style.backgroundImage = `url('${item.rutaCaratula || 'https://via.placeholder.com/220x330'}')`;
        div.onclick = () => {
            if(div.classList.contains('active')) {
                window.location.href = `/ver_detalle.html?id=${item.id}`;
            } else {
                const clickedIndex = index;
                const diff = clickedIndex - heroIndex;
                moverCarrusel(diff);
            }
        };
        heroTrack.appendChild(div);
    });
    heroIndex = 5;
    actualizarPosicion(false);
    heroTrack.addEventListener('transitionend', () => { isTransitioning = false; verificarLimites(); });
}

// --- 6. EVENTOS HERO ---
heroTrack.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive: true});
heroTrack.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    if (touchEndX < touchStartX - 50) moverCarrusel(1);
    if (touchEndX > touchStartX + 50) moverCarrusel(-1);
}, {passive: true});

heroTrack.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return;
    e.preventDefault(); if (isWheelCooldown) return;
    if (e.deltaY > 0 || e.deltaX > 0) { moverCarrusel(1); activarCooldownRueda(); }
    else if (e.deltaY < 0 || e.deltaX < 0) { moverCarrusel(-1); activarCooldownRueda(); }
}, { passive: false });

function activarCooldownRueda() {
    isWheelCooldown = true; setTimeout(() => { isWheelCooldown = false; }, 500);
}

function moverCarrusel(direccion) {
    if (isTransitioning) return;
    isTransitioning = true;
    heroIndex += direccion;
    actualizarPosicion(true);
}

function actualizarPosicion(animar) {
    const screenCenter = window.innerWidth / 2;
    const cardCenter = 110;
    const position = -(heroIndex * cardWidth) + screenCenter - cardCenter;
    if(animar) heroTrack.style.transition = 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)';
    else heroTrack.style.transition = 'none';
    heroTrack.style.transform = `translateX(${position}px)`;
    actualizarEstilosVisuales();
}

function verificarLimites() {
    if (heroIndex >= totalRealItems + 5) { heroIndex = 5; actualizarPosicion(false); void heroTrack.offsetWidth; }
    else if (heroIndex < 5) { heroIndex = totalRealItems + 5 - 1; actualizarPosicion(false); void heroTrack.offsetWidth; }
}

function actualizarEstilosVisuales() {
    const cards = document.querySelectorAll('.hero-card');
    cards.forEach((card, index) => {
        if(index === heroIndex) card.classList.add('active');
        else card.classList.remove('active');
    });
}
window.addEventListener('resize', () => actualizarPosicion(false));

// --- 7. RENDERIZADO FILAS ---
function renderRow(lista, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";

    container.addEventListener('wheel', (evt) => {
        evt.preventDefault(); container.scrollLeft += evt.deltaY;
    });

    lista.forEach(item => {
        const img = item.rutaCaratula || 'https://via.placeholder.com/160x240?text=No+Img';
        const link = `/ver_detalle.html?id=${item.id}`;
        const rating = item.puntuacionMedia ? `⭐ ${item.puntuacionMedia}` : '';

        const div = document.createElement('div');
        div.className = 'standard-card';
        // HTML simplificado sin botón borrar
        div.innerHTML = `
            <div onclick="window.location.href='${link}'">
                <img src="${img}" loading="lazy" alt="${item.titulo}">
                <div class="standard-info">
                      <div class="st-title">${item.titulo}</div>
                      <div class="st-rating">${rating}</div>
                  </div>
              </div>
          `;
          container.appendChild(div);
      });
  }

function deslizarFila(idContainer, direccion) {
    const container = document.getElementById(idContainer);
    const scrollAmount = window.innerWidth * 0.7;
    container.scrollBy({ left: direccion * scrollAmount, behavior: 'smooth' });
}

function resetearVista() { window.location.reload(); }