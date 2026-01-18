const params = new URLSearchParams(window.location.search);
const id = params.get('id');

let rutaVideoPeli = "";
let subsPeli = [];
let episodiosData = {};
let miReproductorPlyr = null;
let enMiLista = false;
let latidoInterval = null; // Para guardar el progreso periódicamente

if(id) {
    fetch('/api/public/contenido/' + id)
        .then(response => response.json())
        .then(c => {
            fetch(`/api/lista/estado?idContenido=${c.id}`)
                .then(res => res.json())
                .then(esFavorito => {
                    enMiLista = esFavorito;
                    renderizarDetalle(c);
                })
                .catch(() => {
                    enMiLista = false;
                    renderizarDetalle(c);
                });
        })
        .catch(e => {
            console.error(e);
            document.getElementById('contenedor-principal').innerHTML = "<h1>Error</h1><p>No se pudieron cargar los datos.</p>";
        });
}

function renderizarDetalle(c) {
    const div = document.getElementById('contenedor-principal');

    const titulo = c.titulo;
    const poster = c.rutaCaratula || 'https://via.placeholder.com/300x450?text=No+Cover';
    const fondo = c.rutaFondo ? c.rutaFondo : poster;
    const claseBlur = !c.rutaFondo ? 'blur-bg' : '';
    const sinopsis = c.sinopsis || c.sipnosis || "Sin descripción disponible.";
    const anio = c.anioLanzamiento || '----';
    const duracion = c.duracionMinutos ? c.duracionMinutos + ' min' : '';
    const director = c.director || c.creador || c.autor || 'Desconocido';
    const genero = c.genero || '';
    const puntuacion = c.puntuacionMedia ? c.puntuacionMedia + '/10' : '-';
    const youtubeId = c.youtubeTrailerId || "";
    const esSerie = !c.rutaVideo;
    const claseModo = esSerie ? '' : 'movie-mode';

    if(!esSerie) {
        rutaVideoPeli = c.rutaVideo;
        subsPeli = c.subtitulos || [];
    }

    const iconoCorazon = enMiLista ? '/img/corazon_lleno.svg' : '/img/corazon_vacio.svg';
    const textoLista = enMiLista ? 'En mi lista' : 'Mi lista';

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
        // Pasamos el ID del contenido para el historial
        html += `
            <button onclick="reproducirPeli(${c.id})" class="btn-play-big">
                ▶ Reproducir
            </button>
        `;
    }

    html += `
        <button onclick="toggleMiLista(${c.id})" class="btn-lista" title="${textoLista}">
            <img id="icono-fav" src="${iconoCorazon}" alt="Favorito" style="width:28px; height:28px;">
        </button>
    `;

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
}

function toggleMiLista(idContenido) {
    fetch(`/api/lista/toggle?idContenido=${idContenido}`, { method: 'POST' })
        .then(res => {
            if (res.status === 403 || res.status === 401) {
                window.location.href = '/login';
                throw new Error("No autorizado");
            }
            return res.json();
        })
        .then(data => {
            enMiLista = data.enLista;
            const img = document.getElementById('icono-fav');
            if (enMiLista) img.src = '/img/corazon_lleno.svg';
            else img.src = '/img/corazon_vacio.svg';
        })
        .catch(err => console.error("Error al cambiar lista", err));
}

function reproducirPeli(idContenido) {
    // 1. Pedir el progreso guardado
    fetch(`/api/historial/progreso?idContenido=${idContenido}`)
        .then(res => res.json())
        .then(segundosGuardados => {
            // 2. Iniciar reproductor pasando el tiempo y el ID
            reproducir(rutaVideoPeli, subsPeli, segundosGuardados, idContenido);
        })
        .catch(() => {
            reproducir(rutaVideoPeli, subsPeli, 0, idContenido);
        });
}

function reproducirCapitulo(url, idCapitulo) {
    const listaSubs = episodiosData[idCapitulo] || [];
    // 1. Pedir progreso del capítulo
    fetch(`/api/historial/progreso?idContenido=${idCapitulo}`)
        .then(res => res.json())
        .then(segundosGuardados => {
            reproducir(url, listaSubs, segundosGuardados, idCapitulo);
        })
        .catch(() => {
            reproducir(url, listaSubs, 0, idCapitulo);
        });
}

function reproducir(urlVideo, listaSubtitulos, tiempoInicio = 0, idContenido = null) {
    const overlay = document.getElementById('overlay-reproductor');
    const container = document.getElementById('video-container');


    let tracksHtml = '';
    if (listaSubtitulos && Array.isArray(listaSubtitulos)) {
        listaSubtitulos.forEach((sub, index) => {
            const esDefault = index === 0 ? 'default' : '';
            tracksHtml += `
                <track kind="subtitles" label="${sub.etiqueta}" srclang="${sub.idioma}"
                    src="${sub.rutaArchivo}?t=${new Date().getTime()}" ${esDefault}>
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
        controls: [ 'play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen' ],
        captions: { active: true, update: true, language: 'auto' }
    });

    // --- LÓGICA DE REANUDAR MEJORADA ---
    // Usamos 'loadedmetadata' que es más fiable para saltos temporales
    const videoElement = document.getElementById('miVideoPlayer');

    videoElement.addEventListener('loadedmetadata', function() {
        if (tiempoInicio > 5) {
            miReproductorPlyr.currentTime = tiempoInicio;
        }
    });

    // Seguridad extra: Si Plyr ya estaba listo rápido, lo forzamos
    miReproductorPlyr.on('ready', event => {
        if (tiempoInicio > 5 && miReproductorPlyr.currentTime < 1) {
             miReproductorPlyr.currentTime = tiempoInicio;
        }
    });

    miReproductorPlyr.play();
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // --- LÓGICA DEL LATIDO (GUARDAR PROGRESO) ---
    if (idContenido) {
        if (latidoInterval) clearInterval(latidoInterval);

        latidoInterval = setInterval(() => {
            // Solo guardamos si el vídeo está reproduciéndose y no está pausado
            if (miReproductorPlyr && !miReproductorPlyr.paused && miReproductorPlyr.playing) {
                const current = miReproductorPlyr.currentTime;
                const total = miReproductorPlyr.duration;

                if (current > 0 && total > 0) {
                    enviarLatido(idContenido, current, total);
                }
            }
        }, 5000);
    }
}

function enviarLatido(id, current, total) {
    console.log("📡 ENVIANDO LATIDO -> ID:", id, "Tiempo:", current); // <--- CHIVATO 1

    const formData = new URLSearchParams();
    formData.append('idContenido', id);
    formData.append('segundos', current);
    formData.append('total', total);

    fetch('/api/historial/latido', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    })
    .then(res => {
        if (res.ok) console.log("✅ LATIDO GUARDADO OK"); // <--- CHIVATO 2
        else console.error("❌ ERROR AL GUARDAR:", res.status); // <--- CHIVATO 3
    })
    .catch(err => console.error("❌ ERROR DE RED:", err));
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

    // Detenemos el guardado automático
    if (latidoInterval) clearInterval(latidoInterval);

    container.innerHTML = "";
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}