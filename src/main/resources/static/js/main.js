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

    // FUNCIÓN SEGURA
    const fetchSafe = (url) =>
        fetch(url)
            .then(res => {
                if (!res.ok) return [];
                return res.json();
            })
            .catch(() => []);

    Promise.all([
        fetch('/api/public/novedades').then(res => res.json()),
        fetch('/api/public/catalogo').then(res => res.json()),
        fetchSafe('/api/public/mi-lista'),
        fetchSafe('/api/historial/continuar-viendo')
    ])
    .then(([dataNovedades, dataCatalogo, dataMiLista, dataHistorial]) => {
        // 1. Renderizar Novedades
        renderHeroSlider(dataNovedades);

        // 2. Guardar datos globales
        catalogoCompleto = dataCatalogo || []; // Protección contra nulos
        miListaCompleta = dataMiLista || [];

        // Aplanar el historial
        historialCompleto = (dataHistorial || []).map(h => {
            if(!h.contenido) return null;
            return {
                ...h.contenido,
                porcentajeVisto: h.porcentaje,
                informacionExtra: h.informacionExtra // Añadido para que se vea T1:E1
            };
        }).filter(h => h !== null);

        // 3. Generar filtros y distribuir contenido
        generarFiltros(catalogoCompleto);
        distribuirCatalogo(catalogoCompleto);

        // 4. Renderizar Mi Lista y Historial
        actualizarFilaMiLista(miListaCompleta);
        actualizarFilaHistorial(historialCompleto);
    })
    .catch(err => {
        console.error("Error cargando la web:", err);
    })
    .finally(() => {
        // --- ESTO ES LO NUEVO: QUITA EL LOADER SIEMPRE ---
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    });

    // --- LISTENER DEL BUSCADOR ---
    const buscador = document.getElementById('buscador');
    if(buscador){
        buscador.addEventListener('keyup', (e) => {
            const texto = e.target.value.toLowerCase();
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            const chipTodos = document.querySelector('.filter-chip');
            if(chipTodos) chipTodos.classList.add('active');
            aplicarFiltrosGlobales(texto, 'Todos');
        });
    }
});

// --- FUNCIÓN CENTRAL DE FILTRADO ---
function aplicarFiltrosGlobales(textoBusqueda, generoSeleccionado) {
    const hero = document.getElementById('hero-section');
    const esBusquedaTexto = textoBusqueda.length > 0;
    const esFiltroGenero = generoSeleccionado !== 'Todos';

    if(hero) {
        if (esBusquedaTexto || esFiltroGenero) {
            hero.style.display = 'none';
        } else {
            if(heroSlidesData.length > 0) hero.style.display = 'block';
        }
    }

    const filtrarItem = (item) => {
        const titulo = item.titulo ? item.titulo.toLowerCase() : "";
        const cumpleTexto = titulo.includes(textoBusqueda);
        const cumpleGenero = generoSeleccionado === 'Todos' || (item.genero && item.genero.includes(generoSeleccionado));
        return cumpleTexto && cumpleGenero;
    };

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
    if(!contenedor) return;

    // Limpiar manteniendo el "Todos" si quieres, o rehacerlo
    contenedor.innerHTML = '<div class="filter-chip active" onclick="filtrarPorGenero(\'Todos\', this)">Todos</div>';

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
    if(buscador) buscador.value = "";

    aplicarFiltrosGlobales("", genero);
}

// --- 3. DISTRIBUCIÓN FILAS ---
function distribuirCatalogo(lista) {
    // MODIFICADO: Añadido filtro 'item.numeroCapitulo == null' para que los capítulos
    // no aparezcan sueltos en videos personales.

    const pelis = lista.filter(item =>
        item.rutaVideo && item.director && item.numeroCapitulo == null
    );
    const series = lista.filter(item => !item.rutaVideo);
    const videos = lista.filter(item =>
        item.rutaVideo && !item.director && item.numeroCapitulo == null
    );

    toggleFila('cat-peliculas', pelis);
    toggleFila('cat-series', series);
    toggleFila('cat-videos', videos);

    renderRow(pelis, 'row-peliculas');
    renderRow(series, 'row-series');
    renderRow(videos, 'row-videos');
}

function toggleFila(idSeccion, items) {
    const seccion = document.getElementById(idSeccion);
    if(seccion) seccion.style.display = items.length === 0 ? 'none' : 'block';
}

// --- 4. HERO SLIDER ---
function renderHeroSlider(lista) {
    const heroWrapper = document.getElementById('hero-section');
    const container = document.getElementById('hero-slider-container');
    const indicators = document.getElementById('hero-indicators');
    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');

    if(!container) return; // Protección

    container.innerHTML = "";
    if(indicators) indicators.innerHTML = "";
    if (heroInterval) clearInterval(heroInterval);

    if (!lista || lista.length === 0) {
        if(heroWrapper) heroWrapper.style.display = 'none';
        return;
    }

    heroSlidesData = lista.slice(0, 5);
    if(heroWrapper) heroWrapper.style.display = 'block';

    heroSlidesData.forEach((item, index) => {
        const slide = document.createElement('div');
        slide.className = index === 0 ? 'hero-slide active' : 'hero-slide';

        let bgImage = item.rutaFondo ? item.rutaFondo : item.rutaCaratula;
        if(!bgImage) bgImage = 'https://via.placeholder.com/1920x800?text=GargStream'; // Fallback

        slide.style.backgroundImage = `url('${bgImage}')`;

        slide.innerHTML = `
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-logo-title">${item.titulo}</div>
                <div class="hero-desc">${item.sipnosis || 'Sin sinopsis disponible.'}</div>
                <div class="hero-actions">
                    <a href="/ver_detalle.html?id=${item.id}" class="hero-btn btn-primary">▶ Reproducir</a>
                    <a href="/ver_detalle.html?id=${item.id}" class="hero-btn btn-secondary">ℹ Más Información</a>
                </div>
            </div>
        `;
        container.appendChild(slide);

        if(indicators) {
            const dot = document.createElement('div');
            dot.className = index === 0 ? 'indicator active' : 'indicator';
            dot.onclick = () => irASlide(index);
            indicators.appendChild(dot);
        }
    });

    if (heroSlidesData.length > 1) {
        if(prevBtn) prevBtn.style.display = 'block';
        if(nextBtn) nextBtn.style.display = 'block';
        iniciarAutoPlay();
    } else {
        if(prevBtn) prevBtn.style.display = 'none';
        if(nextBtn) nextBtn.style.display = 'none';
    }
}

function irASlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.indicator');
    if(slides.length === 0) return;

    if(slides[currentHeroIndex]) slides[currentHeroIndex].classList.remove('active');
    if(dots[currentHeroIndex]) dots[currentHeroIndex].classList.remove('active');

    currentHeroIndex = index;
    if (currentHeroIndex >= slides.length) currentHeroIndex = 0;
    if (currentHeroIndex < 0) currentHeroIndex = slides.length - 1;

    if(slides[currentHeroIndex]) slides[currentHeroIndex].classList.add('active');
    if(dots[currentHeroIndex]) dots[currentHeroIndex].classList.add('active');
    reiniciarAutoPlay();
}

function cambiarHero(direccion) { irASlide(currentHeroIndex + direccion); }

function iniciarAutoPlay() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => { cambiarHero(1); }, 7000);
}

function reiniciarAutoPlay() {
    clearInterval(heroInterval);
    if (heroSlidesData.length > 1) iniciarAutoPlay();
}

// --- 5. RENDERIZADO FILAS ESTÁNDAR ---
function renderRow(lista, containerId) {
    const container = document.getElementById(containerId);
    if(!container) return;

    container.innerHTML = "";
    container.addEventListener('wheel', (evt) => {
        evt.preventDefault(); container.scrollLeft += evt.deltaY;
    });

    lista.forEach(item => {
        const img = item.rutaCaratula || 'https://via.placeholder.com/160x240?text=No+Img';
        const link = `/ver_detalle.html?id=${item.id}`;
        const rating = item.puntuacionMedia ? `⭐ ${item.puntuacionMedia}` : '';

        // Barra de progreso y Etiqueta de episodio (T1:E1)
        let barraHtml = '';
        let infoExtraHtml = '';

        if (item.informacionExtra) {
            infoExtraHtml = `<div class="episode-tag" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.7); color:white; padding:2px 5px; font-size:0.8em; border-radius:3px;">${item.informacionExtra}</div>`;
        }

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
                <div class="img-wrapper" style="position:relative;">
                    <img src="${img}" loading="lazy" alt="${item.titulo}">
                    ${infoExtraHtml}
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
    if(container) {
        const scrollAmount = window.innerWidth * 0.7;
        container.scrollBy({ left: direccion * scrollAmount, behavior: 'smooth' });
    }
}

function resetearVista() { window.location.reload(); }