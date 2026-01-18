// --- VARIABLES GLOBALES ---
let catalogoCompleto = [];

// Variables Hero Slider
let currentHeroIndex = 0;
let heroSlidesData = [];
let heroInterval = null; // Para el bucle automático

// --- 1. CARGA INICIAL (CON LOADER) ---
document.addEventListener('DOMContentLoaded', () => {

    const loader = document.getElementById('main-loader');

    Promise.all([
        fetch('/api/public/novedades').then(res => res.json()),
        fetch('/api/public/catalogo').then(res => res.json())
    ])
    .then(([dataNovedades, dataCatalogo]) => {
        // 1. Renderizar Novedades (Slider Gigante)
        renderHeroSlider(dataNovedades);

        // 2. Renderizar Catálogo
        catalogoCompleto = dataCatalogo;
        generarFiltros(dataCatalogo);
        distribuirCatalogo(dataCatalogo);

        // 3. OCULTAR LOADER
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    })
    .catch(err => {
        console.error("Error cargando la web:", err);
        loader.style.display = 'none';
    });

    // Listeners del buscador
    document.getElementById('buscador').addEventListener('keyup', (e) => {
        const texto = e.target.value.toLowerCase();
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        document.querySelector('.filter-chip').classList.add('active');

        if (texto.length > 0) {
            document.getElementById('hero-section').style.display = 'none'; // Ocultar hero al buscar
            const filtrados = catalogoCompleto.filter(item =>
                item.titulo.toLowerCase().includes(texto)
            );
            distribuirCatalogo(filtrados);
        } else {
            // Volver a mostrar si hay novedades
            if(heroSlidesData.length > 0) document.getElementById('hero-section').style.display = 'block';
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
    document.getElementById('buscador').value = "";

    const hero = document.getElementById('hero-section');

    if (genero === 'Todos') {
        if(heroSlidesData.length > 0) hero.style.display = 'block';
        distribuirCatalogo(catalogoCompleto);
    } else {
        hero.style.display = 'none';
        const filtrados = catalogoCompleto.filter(item =>
            item.genero && item.genero.includes(genero)
        );
        distribuirCatalogo(filtrados);
    }
}

// --- 3. DISTRIBUCIÓN FILAS ---
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
    seccion.style.display = items.length === 0 ? 'none' : 'block';
}

// --- 4. NUEVO HERO SLIDER (GIGANTE) ---
function renderHeroSlider(lista) {
    const heroWrapper = document.getElementById('hero-section');
    const container = document.getElementById('hero-slider-container');
    const indicators = document.getElementById('hero-indicators');
    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');

    // Limpieza previa
    container.innerHTML = "";
    indicators.innerHTML = "";
    if (heroInterval) clearInterval(heroInterval);

    // Filtramos para coger solo las últimas 5
    if (!lista || lista.length === 0) {
        heroWrapper.style.display = 'none';
        return;
    }

    // Cogemos máximo 5 ítems
    heroSlidesData = lista.slice(0, 5);
    heroWrapper.style.display = 'block';

    // Generar Slides
    heroSlidesData.forEach((item, index) => {
        const slide = document.createElement('div');
        slide.className = index === 0 ? 'hero-slide active' : 'hero-slide';

        // LÓGICA DE FONDO:
        // Si hay 'rutaFondo' (Horizontal), úsala.
        // Si no, usa 'rutaCaratula' (Vertical) pero añade un filtro borroso en CSS inline para que no se vea mal.
        let bgImage = item.rutaFondo ? item.rutaFondo : item.rutaCaratula;
        let styleExtra = "";

        // Si estamos forzados a usar la vertical en un contenedor horizontal, ajustamos:
        if (!item.rutaFondo) {
            // Truco: Fondo borroso
            styleExtra = "filter: blur(20px) brightness(0.5); transform: scale(1.1);";
            // Nota: El contenido de texto va en capa superior, así que necesitamos una estructura doble
            // Pero para simplificar en este diseño, usaremos un background-size cover estándar
            // o aceptamos que se corte. Lo ideal es el blur.

            // Re-enfoque: Como el div entero se borraría, mejor ponemos la imagen
            // como un pseudo-elemento o gestionamos el background.
            // Para simplificar: Background-size cover centra la imagen.
        }

        slide.style.backgroundImage = `url('${bgImage}')`;

        // Contenido del slide
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

        // Indicadores
        const dot = document.createElement('div');
        dot.className = index === 0 ? 'indicator active' : 'indicator';
        dot.onclick = () => irASlide(index);
        indicators.appendChild(dot);
    });

    // Configuración de controles
    if (heroSlidesData.length > 1) {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        // Iniciar bucle automático (7 segundos)
        iniciarAutoPlay();
    } else {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'none';
    }
}

function irASlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.indicator');

    // Quitar activo actual
    slides[currentHeroIndex].classList.remove('active');
    dots[currentHeroIndex].classList.remove('active');

    // Poner nuevo activo
    currentHeroIndex = index;

    // Loop cíclico
    if (currentHeroIndex >= slides.length) currentHeroIndex = 0;
    if (currentHeroIndex < 0) currentHeroIndex = slides.length - 1;

    slides[currentHeroIndex].classList.add('active');
    dots[currentHeroIndex].classList.add('active');

    // Reiniciar temporizador si se interactúa manualmente
    reiniciarAutoPlay();
}

function cambiarHero(direccion) {
    irASlide(currentHeroIndex + direccion);
}

function iniciarAutoPlay() {
    if (heroInterval) clearInterval(heroInterval);
    heroInterval = setInterval(() => {
        cambiarHero(1);
    }, 7000); // 7 segundos
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