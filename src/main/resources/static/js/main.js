// variable globales
let catalogoCompleto = [];
let miListaCompleta = [];
let historialCompleto = [];

//variables del carrusel de novedades
let currentHeroIndex = 0;
let heroSlidesData = [];
let heroInterval = null;

// carga inicial
document.addEventListener('DOMContentLoaded', () => {

    const loader = document.getElementById('main-loader');

    // función segura
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
        // renderizar novedades

        //invitado vs logueado
        const usuarioLogueado = (typeof isUserAuthenticated !== 'undefined' && isUserAuthenticated);

                if (!usuarioLogueado) {
                    // modo invitado tarjeta estática
                    const staticSlide = [{
                        id: 'intro-guest',
                        titulo: "Bienvenido a GargStream",
                        sipnosis: "Esta aplicación permite consultar, buscar y gestionar información sobre películas, series y vídeos personales. Los usuarios pueden visualizar listados, acceder al detalle de cada elemento y realizar acciones según su rol. Para comenzar a visualizar contenido, regístrese o inicie sesión.",
                        rutaFondo: "/img/fondo_cine.jpeg",
                        esStatic: true
                    }];

                    // renderizar solo la tarjeta estática
                    renderHeroSlider(staticSlide);

                } else {
                    // modo logueado
                    // renderizar las novedades
                    renderHeroSlider(dataNovedades || []);
                }




        // guardar datos globales
        catalogoCompleto = dataCatalogo || [];
        miListaCompleta = dataMiLista || [];

        // aplanar el historial
        historialCompleto = (dataHistorial || []).map(h => {
            if(!h.contenido) return null;
            return {
                ...h.contenido,
                porcentajeVisto: h.porcentaje,
                informacionExtra: h.informacionExtra
            };
        }).filter(h => h !== null);

        // generar filtros y distribuir el contneido
        generarFiltros(catalogoCompleto);
        distribuirCatalogo(catalogoCompleto);

        // renderizar mi lista e historial
        actualizarFilaMiLista(miListaCompleta);
        actualizarFilaHistorial(historialCompleto);
    })
    .catch(err => {
        console.error("Error cargando la web:", err);
    })
    .finally(() => {
        if(loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    });

    // listener del buscador
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

// función central de filtrado
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

// generador de filtros
function generarFiltros(lista) {
    const contenedor = document.getElementById('filter-bar');
    if(!contenedor) return;

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

// distribución de filas
function distribuirCatalogo(lista) {

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

// carrusel de novedades
function renderHeroSlider(lista) {
    const heroWrapper = document.getElementById('hero-section');
    const container = document.getElementById('hero-slider-container');
    const indicators = document.getElementById('hero-indicators');
    const prevBtn = document.getElementById('hero-prev');
    const nextBtn = document.getElementById('hero-next');

    if(!container) return;

    container.innerHTML = "";
    if(indicators) indicators.innerHTML = "";
    if (heroInterval) clearInterval(heroInterval);

    if (!lista || lista.length === 0) {
        if(heroWrapper) heroWrapper.style.display = 'none';
        return;
    }

    heroSlidesData = lista.slice(0, 10);//10 novedades
    if(heroWrapper) heroWrapper.style.display = 'block';

    heroSlidesData.forEach((item, index) => {
        const slide = document.createElement('div');

        // clase para cambiar al modo invitado
        // si es staic se añade el guest mode para que el css lo sepa
        let clasesSlide = index === 0 ? 'hero-slide active' : 'hero-slide';

        if (item.esStatic) {
            clasesSlide += ' guest-mode';
        }

        slide.className = clasesSlide;

        let bgImage = item.rutaFondo ? item.rutaFondo : item.rutaCaratula;
        if(!bgImage) bgImage = 'https://via.placeholder.com/1920x800?text=GargStream';

        slide.style.backgroundImage = `url('${bgImage}')`;

        // lógica de botones invitado y logueado
        let botonesHtml = '';
        if (item.esStatic) {
            // botones para invitado
            botonesHtml = `
                <div class="guest-buttons">
                    <a href="/login" class="hero-btn btn-primary">Iniciar Sesión</a>
                    <a href="/register" class="hero-btn btn-secondary">Registrarse</a>
                </div>
            `;
        } else {
            // botones para logueado
            botonesHtml = `
                <a href="/ver_detalle.html?id=${item.id}" class="hero-btn btn-primary">▶ Reproducir</a>
                <a href="/ver_detalle.html?id=${item.id}" class="hero-btn btn-secondary">Más Información</a>
            `;
        }

        slide.innerHTML = `
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <div class="hero-logo-title">${item.titulo}</div>
                <div class="hero-desc">${item.sipnosis || 'Sin sinopsis disponible.'}</div>
                <div class="hero-actions">
                    ${botonesHtml}
                </div>
            </div>
        `;
        container.appendChild(slide);

        // indicadores sis hay más de una ficha
        if(indicators && heroSlidesData.length > 1) {
            const dot = document.createElement('div');
            dot.className = index === 0 ? 'indicator active' : 'indicator';
            dot.onclick = () => irASlide(index);
            indicators.appendChild(dot);
        }
    });

    //flechas
    if (heroSlidesData.length > 1) {
        if(prevBtn) prevBtn.style.display = 'block';
        if(nextBtn) nextBtn.style.display = 'block';
        iniciarAutoPlay();
    } else {
        // si es static que no haya flechas
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

// Renderizado de filas estándar
function renderRow(lista, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    // detectar si el scroll es vertical u horizontal
    container.addEventListener('wheel', (evt) => {
        const hayDesbordamiento = container.scrollWidth > container.clientWidth;

        if (hayDesbordamiento) {
            // si se pasa de ancho se pone scroll horizontal
            evt.preventDefault();
            container.scrollLeft += evt.deltaY;
        }
        // si no, vertical
    });

    lista.forEach(item => {
        // aseguramos que item.id sea correcto (a veces viene en item.contenido.id dependiendo del DTO)
        const idContenido = item.contenido ? item.contenido.id : item.id;
        const titulo = item.contenido ? item.contenido.titulo : item.titulo;

        const img = item.rutaCaratula || 'https://via.placeholder.com/160x240?text=No+Img';
        const link = `/ver_detalle.html?id=${idContenido}`;
        const rating = item.puntuacionMedia ? `⭐ ${item.puntuacionMedia}` : '';

        //boton para borrar el continuar viendo
        let botonEliminarHTML = '';

        if (containerId === 'row-historial') {
            botonEliminarHTML = `
                <div class="btn-remove-history"
                     onclick="eliminarDeContinuarViendo(${idContenido}, this, event)"
                     title="Quitar de seguir viendo">
                     ✕
                </div>
            `;
        }

        // barra de progreso y etiqueta
        let barraHtml = '';
        let infoExtraHtml = '';

        if (item.informacionExtra) {
            infoExtraHtml = `<div class="episode-tag" style="position:absolute; top:5px; right:5px; background:rgba(0,0,0,0.7); color:white; padding:2px 5px; font-size:0.8em; border-radius:3px;">${item.informacionExtra}</div>`;
        }

        const porcentaje = item.porcentaje || item.porcentajeVisto;

        if (porcentaje !== undefined && porcentaje > 0) {
            barraHtml = `
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${porcentaje}%"></div>
                </div>
            `;
        }

        const div = document.createElement('div');
        div.className = 'standard-card';

        div.innerHTML = `
            <div onclick="window.location.href='${link}'">
                <div class="img-wrapper" style="position:relative;">
                    <img src="${img}" loading="lazy" alt="${titulo}">

                    ${botonEliminarHTML} ${infoExtraHtml}
                    ${barraHtml}

                </div>
                <div class="standard-info">
                      <div class="st-title">${titulo}</div>
                      <div class="st-rating">${rating}</div>
                  </div>
              </div>
          `;
          container.appendChild(div);
      });
}

function eliminarDeContinuarViendo(idContenido, elementoBoton, event) {
    event.stopPropagation();
    event.preventDefault();

    if (!confirm("¿Quieres quitar este título de 'Continuar viendo'?")) return;

    fetch(`/api/historial/eliminar?idContenido=${idContenido}`, {
        method: 'DELETE'
    })
    .then(res => {
        if (res.ok) {
            const tarjeta = elementoBoton.closest('.standard-card');
            if (tarjeta) {
                tarjeta.style.transition = '0.3s';
                tarjeta.style.opacity = '0';
                tarjeta.style.transform = 'scale(0.8)';
                setTimeout(() => tarjeta.remove(), 300);
            }
        } else {
            console.error("Error al eliminar");
        }
    })
    .catch(err => console.error(err));
}

function deslizarFila(idContainer, direccion) {
    const container = document.getElementById(idContainer);
    if(container) {
        const scrollAmount = window.innerWidth * 0.7;
        container.scrollBy({ left: direccion * scrollAmount, behavior: 'smooth' });
    }
}

function resetearVista() { window.location.reload(); }



// lógica del menú de usuario
document.addEventListener('DOMContentLoaded', () => {

    // localizar el avatar
    const avatar = document.querySelector('.user-menu-container .avatar-circle');
    const dropdown = document.querySelector('.dropdown-content');

    if (avatar && dropdown) {

        //al hacer click en el avatar
        avatar.addEventListener('click', (e) => {
            // para que no se cierre si se sale el mouse del menú
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // al hacer click en cualquier otro sitio
        window.addEventListener('click', (e) => {
            // si el menú está abierto
            if (dropdown.classList.contains('show')) {
                // y el click no ha sido dentro del menú
                if (!dropdown.contains(e.target) && e.target !== avatar) {
                    //se cierra
                    dropdown.classList.remove('show');
                }
            }
        });
    }
});