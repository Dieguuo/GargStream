const params = new URLSearchParams(window.location.search);
const id = params.get('id');

let rutaVideoPeli = "";
let subsPeli = [];
let episodiosData = {};
let miReproductorPlyr = null;

if(id) {
    fetch('/api/public/contenido/' + id)
        .then(response => response.json())
        .then(c => {
            const div = document.getElementById('contenedor-principal');

            const titulo = c.titulo;
            // Imagen POSTER (Vertical)
            const poster = c.rutaCaratula || 'https://via.placeholder.com/300x450?text=No+Cover';

            // Imagen FONDO (Horizontal - HD)
            // Si no hay fondo horizontal, usamos el poster como fallback
            const fondo = c.rutaFondo ? c.rutaFondo : poster;

            const sinopsis = c.sinopsis || c.sipnosis || "Sin descripción disponible.";
            const anio = c.anioLanzamiento || '----';
            const duracion = c.duracionMinutos ? c.duracionMinutos + ' min' : '';
            const director = c.director || c.creador || c.autor || 'Desconocido';
            const genero = c.genero || '';
            const puntuacion = c.puntuacionMedia ? c.puntuacionMedia + '/10' : '-';
            const youtubeId = c.youtubeTrailerId || "";

            const esSerie = !c.rutaVideo;
            const claseModo = esSerie ? '' : 'movie-mode';

            // Truco visual: Si no tenemos fondo horizontal real, añadimos clase 'blur-bg'
            // para desenfocar el poster estirado y que no se vea pixelado.
            const claseBlur = !c.rutaFondo ? 'blur-bg' : '';

            if(!esSerie) {
                rutaVideoPeli = c.rutaVideo;
                subsPeli = c.subtitulos || [];
            }

            let html = `
                <div class="backdrop ${claseModo} ${claseBlur}" style="background-image: url('${fondo}');">
                    <img class="poster" src="${poster}" alt="${titulo}">

                    <div class="info">
                        <h1>${titulo}</h1>
                        <div class="meta-data">
                            <span class="score">⭐ ${puntuacion}</span>
                            <span>${anio}</span>
                            ${duracion ? `<span class="meta-tag">${duracion}</span>` : ''}
                            ${genero ? `<span class="meta-tag">${genero}</span>` : ''}
                        </div>
                        <div class="director-cast">
                            ${esSerie ? 'Creador' : 'Director'}: <strong>${director}</strong>
                        </div>
                        <p class="sinopsis">${sinopsis}</p>

                        <div class="actions">
            `;

            if (!esSerie) {
                html += `
                    <button onclick="reproducirPeli()" class="btn-play-big">
                        ▶ Reproducir
                    </button>
                `;
            }

            if(youtubeId) {
                html += `
                    <button onclick="verTrailer('${youtubeId}')" class="btn-trailer">
                        🎬 Ver Tráiler
                    </button>
                `;
            }

            html += `   </div> </div> </div> `;

            if (esSerie) {
                html += `
                    <h2 style="padding-left:20px; margin-bottom:20px;">Temporadas y Episodios</h2>
                    <div id="lista-episodios">
                `;
                if (c.temporadas && c.temporadas.length > 0) {
                    const mapTemps = {};
                    c.temporadas.forEach(t => {
                        if(!mapTemps[t.numeroTemporada]) mapTemps[t.numeroTemporada] = [];
                        mapTemps[t.numeroTemporada].push(...t.capitulos);
                    });

                    Object.keys(mapTemps).sort((a,b)=>a-b).forEach((num, index) => {
                        const caps = mapTemps[num].sort((a,b)=>a.numeroCapitulo - b.numeroCapitulo);
                        const isOpen = index === 0 ? 'open' : '';
                        html += `<details ${isOpen}><summary>Temporada ${num} <span style="font-weight:normal; font-size:0.9em; color:#aaa">${caps.length} episodios</span></summary><div>`;

                        caps.forEach(cap => {
                            const urlVideoCap = cap.rutaVideo;
                            episodiosData[cap.id] = cap.subtitulos || [];

                            html += `
                                <div class="capitulo-card">
                                    <div style="display:flex; flex-direction:column;">
                                        <span style="font-weight:bold; font-size:1em;">${cap.numeroCapitulo}. ${cap.titulo || 'Episodio ' + cap.numeroCapitulo}</span>
                                    </div>

                                    <button class="btn-cap" onclick="reproducirCapitulo('${urlVideoCap}', ${cap.id})">
                                        ▶ Reproducir
                                    </button>
                                </div>
                            `;
                        });
                        html += `</div></details>`;
                    });
                } else { html += '<p style="padding-left:20px;">No hay capítulos disponibles.</p>'; }
                html += `</div>`;
            }

            div.innerHTML = html;
        })
        .catch(e => {
            console.error(e);
            document.getElementById('contenedor-principal').innerHTML = "<h1>Error</h1><p>No se pudieron cargar los datos.</p>";
        });
}

function reproducirPeli() {
    reproducir(rutaVideoPeli, subsPeli);
}

function reproducirCapitulo(url, idCapitulo) {
    const listaSubs = episodiosData[idCapitulo] || [];
    reproducir(url, listaSubs);
}

function reproducir(urlVideo, listaSubtitulos) {
    const overlay = document.getElementById('overlay-reproductor');
    const container = document.getElementById('video-container');

    let tracksHtml = '';

    if (listaSubtitulos && Array.isArray(listaSubtitulos)) {
        listaSubtitulos.forEach((sub, index) => {
            const esDefault = index === 0 ? 'default' : '';
            tracksHtml += `
                <track
                    kind="subtitles"
                    label="${sub.etiqueta}"
                    srclang="${sub.idioma}"
                    src="${sub.rutaArchivo}?t=${new Date().getTime()}"
                    ${esDefault}>
            `;
        });
    }

    container.innerHTML = `
        <video id="miVideoPlayer" class="plyr" playsinline controls crossorigin>
            <source src="${urlVideo}" type="video/mp4">
            ${tracksHtml}
            Tu navegador no soporta vídeos HTML5.
        </video>
    `;

    miReproductorPlyr = new Plyr('#miVideoPlayer', {
        title: 'GargStream',
        controls: [
            'play-large', 'play', 'progress', 'current-time', 'mute',
            'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        captions: { active: true, update: true, language: 'auto' }
    });

    miReproductorPlyr.play();
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function verTrailer(youtubeId) {
    const overlay = document.getElementById('overlay-reproductor');
    const container = document.getElementById('video-container');

    container.innerHTML = `
        <iframe width="100%" height="100%"
            src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0"
            title="YouTube video player" frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen>
        </iframe>
    `;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarVideo() {
    const overlay = document.getElementById('overlay-reproductor');
    const container = document.getElementById('video-container');

    if (miReproductorPlyr != null) {
        miReproductorPlyr.destroy();
        miReproductorPlyr = null;
    }

    container.innerHTML = "";
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}