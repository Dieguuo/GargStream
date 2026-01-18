// --- VARIABLES GLOBALES ---
let catalogoCompleto = [];
let miListaCompleta = []; // <--- NUEVA: Para guardar los favoritos y poder filtrarlos

// Variables Hero Slider
let currentHeroIndex = 0;
let heroSlidesData = [];
let heroInterval = null;

// --- 1. CARGA INICIAL (CON LOADER) ---
document.addEventListener('DOMContentLoaded', () => {

    const loader = document.getElementById('main-loader');

    Promise.all([
        fetch('/api/public/novedades').then(res => res.json()),
        fetch('/api/public/catalogo').then(res => res.json()),
        fetch('/api/public/mi-lista').then(res => res.json())
    ])
    .then(([dataNovedades, dataCatalogo, dataMiLista]) => {
        // 1. Renderizar Novedades
        renderHeroSlider(dataNovedades);

        // 2. Guardar datos globales
        catalogoCompleto = dataCatalogo;
        miListaCompleta = dataMiLista || []; // Guardamos la lista original

        // 3. Generar filtros y distribuir contenido inicial
        generarFiltros(dataCatalogo);
        distribuirCatalogo(catalogoCompleto);

        // 4. Renderizar Mi Lista inicial (sin filtros)
        actualizarFilaMiLista(miListaCompleta);

        // 5. OCULTAR LOADER
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    })
    .catch(err => {
        console.error("Error cargando la web:", err);
        loader.style.display = 'none';
    });

    // --- LISTENER DEL BUSCADOR ---
    document.getElementById('buscador').addEventListener('keyup', (e) => {
        const texto = e.target.value.toLowerCase();

        // Resetear visualmente los chips de género si se busca por texto
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.filter-chip').classList.add('active'); // Activar "Todos"

        aplicarFiltrosGlobales(texto, 'Todos');
    });
});

// --- FUNCIÓN CENTRAL DE FILTRADO ---
// Esta función filtra TANTO el catálogo general COMO la lista de favoritos
function aplicarFiltrosGlobales(textoBusqueda, generoSeleccionado) {
    const hero = document.getElementById('hero-section');
    const esBusquedaTexto = textoBusqueda.length > 0;
    const esFiltroGenero = generoSeleccionado !== 'Todos';

    // 1. Gestión del Hero Slider (se oculta si hay filtros activos)
    if (esBusquedaTexto || esFiltroGenero) {
        hero.style.display = 'none';
    } else {
        if(heroSlidesData.length > 0) hero.style.display = 'block';
    }

    // 2. Filtrar el Catálogo General
    const catalogoFiltrado = catalogoCompleto.filter(item => {
        const cumpleTexto = item.titulo.toLowerCase().includes(textoBusqueda);
        const cumpleGenero = generoSeleccionado === 'Todos' || (item.genero && item.genero.includes(generoSeleccionado));
        return cumpleTexto && cumpleGenero;
    });
    distribuirCatalogo(catalogoFiltrado);

    // 3. Filtrar "Mi Lista"
    const miListaFiltrada = miListaCompleta.filter(item => {
        const cumpleTexto = item.titulo.toLowerCase().includes(textoBusqueda);
        const cumpleGenero = generoSeleccionado === 'Todos' || (item.genero && item.genero.includes(generoSeleccionado));
        return cumpleTexto && cumpleGenero;
    });
    actualizarFilaMiLista(miListaFiltrada);
}

// --- ACTUALIZAR VISUALMENTE LA FILA DE MI LISTA ---
function actualizarFilaMiLista(lista) {
    const contenedorFila = document.getElementById('cat-milista');
    if (lista && lista.length > 0) {
        contenedorFila.style.display = 'block';
        renderRow(lista, 'row-milista');
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

// --- LISTENER DE GÉNEROS ---
function filtrarPorGenero(genero, elementoChip) {
    // Gestión visual de los chips
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    elementoChip.classList.add('active');

    // Limpiamos el buscador de texto al cambiar de género para evitar confusiones
    const buscador = document.getElementById('buscador');
    buscador.value = "";

    // Llamamos a la función central
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

    // Solo renderizamos si hay contenido, para optimizar
    // Nota: Limpiamos el contenedor dentro de renderRow, así que si length es 0
    // renderRow dejará vacío el div, lo cual es correcto.
    if(pelis.length > 0) renderRow(pelis, 'row-peliculas');
    if(series.length > 0) renderRow(series, 'row-series');
    if(videos.length > 0) renderRow(videos, 'row-videos');
}

function toggleFila(idSeccion, items) {
    const seccion = document.getElementById(idSeccion);
    seccion.style.display = items.length === 0 ? 'none' : 'block';
}

// --- 4. HERO SLIDER (GIGANTE) ---
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
        let styleExtra = "";

        if (!item.rutaFondo) {
            styleExtra = "filter: blur(20px) brightness(0.5); transform: scale(1.1);";
        }

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

        const div = document.createElement('div');
        div.className = 'standard-card';
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