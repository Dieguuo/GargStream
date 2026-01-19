// --- VARIABLES GLOBALES ---
let catalogoCompleto = [];
let miListaCompleta = [];
let historialCompleto = [];

// Variables Hero Slider
let currentHeroIndex = 0;
let heroSlidesData = [];
let heroInterval = null;

// --- 1. CARGA INICIAL (CON LOADER) ---
document.addEventListener('DOMContentLoaded', () => {

    const loader = document.getElementById('main-loader');

    // FUNCIÓN SEGURA: Si falla la petición (ej: 403 no logueado), devuelve lista vacía []
    // en lugar de romper toda la página.
    const fetchSafe = (url) =>
        fetch(url)
            .then(res => {
                if (!res.ok) return []; // Si hay error (403, 404, 500), devolvemos array vacío
                return res.json();
            })
            .catch(() => []); // Si hay error de red, devolvemos array vacío

    Promise.all([
        fetch('/api/public/novedades').then(res => res.json()),
        fetch('/api/public/catalogo').then(res => res.json()),
        // Usamos la versión segura para las listas personales
        fetchSafe('/api/public/mi-lista'),
        fetchSafe('/api/historial/continuar-viendo')
    ])
    .then(([dataNovedades, dataCatalogo, dataMiLista, dataHistorial]) => {
        // 1. Renderizar Novedades
        renderHeroSlider(dataNovedades);

        // 2. Guardar datos globales
        catalogoCompleto = dataCatalogo;
        miListaCompleta = dataMiLista || [];

        // Aplanar el historial
        historialCompleto = (dataHistorial || []).map(h => {
            return {
                ...h.contenido,
                porcentajeVisto: h.porcentaje
            };
        });

        // 3. Generar filtros y distribuir contenido
        generarFiltros(dataCatalogo);
        distribuirCatalogo(catalogoCompleto);

        // 4. Renderizar Mi Lista y Historial (si existen)
        actualizarFilaMiLista(miListaCompleta);
        actualizarFilaHistorial(historialCompleto);

        // 5. OCULTAR LOADER
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    })
    .catch(err => {
        console.error("Error cargando la web:", err);
        loader.style.display = 'none';
        // Opcional: Mostrar mensaje de error en pantalla
        document.body.insertAdjacentHTML('beforeend', '<p style="color:white; text-align:center">Error de conexión con el servidor.</p>');
    });

    // --- LISTENER DEL BUSCADOR ---
    document.getElementById('buscador').addEventListener('keyup', (e) => {
        const texto = e.target.value.toLowerCase();

        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.filter-chip').classList.add('active');

        aplicarFiltrosGlobales(texto, 'Todos');
    });
});

// --- FUNCIÓN CENTRAL DE FILTRADO ---
function aplicarFiltrosGlobales(textoBusqueda, generoSeleccionado) {
    const hero = document.getElementById('hero-section');
    const esBusquedaTexto = textoBusqueda.length > 0;
    const esFiltroGenero = generoSeleccionado !== 'Todos';

    if (esBusquedaTexto || esFiltroGenero) {
        hero.style.display = 'none';
    } else {
        if(heroSlidesData.length > 0) hero.style.display = 'block';
    }

    const filtrarItem = (item) => {
        const cumpleTexto = item.titulo.toLowerCase().includes(textoBusqueda);
        const cumpleGenero = generoSeleccionado === 'Todos' || (item.genero && item.genero.includes(generoSeleccionado));
        return cumpleTexto && cumpleGenero;
    };

    // Filtrar todo
    const catalogoFiltrado = catalogoCompleto.filter(filtrarItem);
    distribuirCatalogo(catalogoFiltrado);

    const miListaFiltrada = miListaCompleta.filter(filtrarItem);
    actualizarFilaMiLista(miListaFiltrada);

    const historialFiltrado = historialCompleto.filter(filtrarItem);
    actualizarFilaHistorial(historialFiltrado);
}

function actualizarFilaMiLista(lista) {
    const contenedorFila = document.getElementById('cat-milista');
    if (lista && lista.length > 0) {
        contenedorFila.style.display = 'block';
        renderRow(lista, 'row-milista');
    } else {
        contenedorFila.style.display = 'none';
    }
}

function actualizarFilaHistorial(lista) {
    const contenedorFila = document.getElementById('cat-historial');
    if (lista && lista.length > 0) {
        contenedorFila.style.display = 'block';
        renderRow(lista, 'row-historial');
    } else {
        contenedorFila.style.display = 'none';
    }
}

// --- 2. GENERADOR DE FILTROS ---
function generarFiltros(lista) {
    const contenedor = document.getElementById('filter-bar');
    const generos = new Set();
    lista.forEach(item => {
        if(item.genero && item.genero.trim() !== "") {
            item.genero.split(',').forEach(sub => {
                const g = sub.trim();
                if(g.length > 0) generos.add(g);
            });
        }
    });
    Array.from(generos).sort().forEach(genero => {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerText = genero;
        chip.onclick = function() { filtrarPorGenero(genero, this); };
        contenedor.appendChild(chip);
    });
}

function filtrarPorGenero(genero, elementoChip) {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    elementoChip.classList.add('active');

    const buscador = document.getElementById('buscador');
    buscador.value = "";

    aplicarFiltrosGlobales("", genero);
}

// --- 3. DISTRIBUCIÓN FILAS ---
function distribuirCatalogo(lista) {
    const pelis = lista.filter(item => item.rutaVideo && item.director);
    const series = lista.filter(item => !item.rutaVideo);
    const videos = lista.filter(item => item.rutaVideo && !item.director);

    toggleFila('cat-peliculas', pelis);
    toggleFila('cat-series', series);
    toggleFila('cat-videos', videos);

    renderRow(pelis, 'row-peliculas');
    renderRow(series, 'row-series');
    renderRow(videos, 'row-videos');
}

function toggleFila(idSeccion, items) {
    const seccion = document.getElementById(idSeccion);
    seccion.style.display = items.length === 0 ? 'none' : 'block';
}

// --- 4. HERO SLIDER ---
function renderHeroSlider(lista) {
    const heroWrapper = document.getElementById('hero-section');
    const container = document.getElementById('hero-slider-container');
    const indicators = document.getElementById('hero-indicators');
    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');

    container.innerHTML = "";
    indicators.innerHTML = "";
    if (heroInterval) clearInterval(heroInterval);

    if (!lista || lista.length === 0) {
        heroWrapper.style.display = 'none';
        return;
    }

    heroSlidesData = lista.slice(0, 5);
    heroWrapper.style.display = 'block';

    heroSlidesData.forEach((item, index) => {
        const slide = document.createElement('div');
        slide.className = index === 0 ? 'hero-slide active' : 'hero-slide';

        let bgImage = item.rutaFondo ? item.rutaFondo : item.rutaCaratula;
        slide.style.backgroundImage = `url('${bgImage}')`;

        slide.innerHTML = `
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-logo-title">${item.titulo}</div>
                <div class="hero-desc">${item.sipnosis || 'Sin sinopsis disponible.'}</div>
                <div class="hero-actions">
                    <a href="/ver_detalle.html?id=${item.id}" class="hero-btn btn-primary">
                        ▶ Reproducir
                    </a>
                    <a href="/ver_detalle.html?id=${item.id}" class="hero-btn btn-secondary">
                        ℹ Más Información
                    </a>
                </div>
            </div>
        `;
        container.appendChild(slide);

        const dot = document.createElement('div');
        dot.className = index === 0 ? 'indicator active' : 'indicator';
        dot.onclick = () => irASlide(index);
        indicators.appendChild(dot);
    });

    if (heroSlidesData.length > 1) {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        iniciarAutoPlay();
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }
}

function irASlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.indicator');

    slides[currentHeroIndex].classList.remove('active');
    dots[currentHeroIndex].classList.remove('active');

    currentHeroIndex = index;
    if (currentHeroIndex >= slides.length) currentHeroIndex = 0;
    if (currentHeroIndex < 0) currentHeroIndex = slides.length - 1;

    slides[currentHeroIndex].classList.add('active');
    dots[currentHeroIndex].classList.add('active');
    reiniciarAutoPlay();
}

function cambiarHero(direccion) {
    irASlide(currentHeroIndex + direccion);
}

function iniciarAutoPlay() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        cambiarHero(1);
    }, 7000);
}

function reiniciarAutoPlay() {
    clearInterval(heroInterval);
    if (heroSlidesData.length > 1) {
        iniciarAutoPlay();
    }
}

// --- 5. RENDERIZADO FILAS ESTÁNDAR ---
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

        // Barra de progreso
        let barraHtml = '';
        if (item.porcentajeVisto !== undefined && item.porcentajeVisto > 0) {
            barraHtml = `
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${item.porcentajeVisto}%"></div>
                </div>
            `;
        }

        const div = document.createElement('div');
        div.className = 'standard-card';
        div.innerHTML = `
            <div onclick="window.location.href='${link}'">
                <div class="img-wrapper">
                    <img src="${img}" loading="lazy" alt="${item.titulo}">
                    ${barraHtml}
                </div>
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