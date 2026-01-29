const params = new URLSearchParams(window.location.search);
const id = params.get('id');

let rutaVideoPeli = "";
let subsPeli = [];
let episodiosData = {};
let miReproductorPlyr = null;
let enMiLista = false;
let latidoInterval = null;
let miVotoActual = 0;

if(id) {
    cargarDatosCompletos();
}



function getAuthHeaders() {
    const tokenMeta = document.querySelector('meta[name="_csrf"]');
    const headerMeta = document.querySelector('meta[name="_csrf_header"]');
    if (!tokenMeta || !headerMeta) return {};
    return { [headerMeta.getAttribute('content')]: tokenMeta.getAttribute('content') };
}



function cargarDatosCompletos() {
    fetch('/api/public/contenido/' + id)
        .then(response => response.json())
        .then(c => {
            fetch(`/api/lista/estado?idContenido=${c.id}`)
                .then(res => res.json())
                .then(esFavorito => {
                    enMiLista = esFavorito;
                    cargarMiVoto(c);
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

function cargarMiVoto(contenido) {
    if (typeof isUserAuthenticated !== 'undefined' && isUserAuthenticated) {
        fetch(`/api/valoracion/mi-voto?contenidoId=${contenido.id}`)
            .then(res => res.json())
            .then(nota => {
                miVotoActual = nota;
                renderizarDetalle(contenido);
            })
            .catch(() => renderizarDetalle(contenido));
    } else {
        renderizarDetalle(contenido);
    }
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

    // notas
    const notaTMDB = c.puntuacionMedia ? c.puntuacionMedia.toFixed(1) : '-';
    const mediaLocal = c.notaPromedioLocal || 0;
    const votosLocal = c.contadorVotos || 0;
    const textoLocal = `${mediaLocal}/5 (${votosLocal} votos)`;

    const youtubeId = c.youtubeTrailerId || "";
    const esSerie = !c.rutaVideo;
    const claseModo = esSerie ? '' : 'movie-mode';

    if(!esSerie) {
        rutaVideoPeli = c.rutaVideo;
        subsPeli = c.subtitulos || [];
    }

    const iconoCorazon = enMiLista ? '/img/corazon_lleno.svg' : '/img/corazon_vacio.svg';
    const textoLista = enMiLista ? 'En mi lista' : 'Mi lista';

    // generar las estrellas
    let estrellasHtml = '';
    // comprobar que el usuario esté autentificado
    const estaLogueado = (typeof isUserAuthenticated !== 'undefined' && isUserAuthenticated);

    for(let i=1; i<=5; i++) {
        const claseRellena = i <= miVotoActual ? 'filled' : '';
        // solo si se está logueado
        const eventos = estaLogueado ?
            `onclick="enviarVoto(${i}, ${c.id})" onmouseover="iluminar(${i})" onmouseout="restaurar()"` : '';

        const estiloCursor = estaLogueado ? 'cursor:pointer;' : 'cursor:default;';

        estrellasHtml += `<span class="star ${claseRellena}" data-value="${i}" ${eventos} style="${estiloCursor}">★</span>`;
    }

    let html = `
        <div class="backdrop ${claseModo} ${claseBlur}" style="background-image: url('${fondo}');">

            <div class="poster-column" style="display:flex; flex-direction:column; align-items:center; width: 300px; flex-shrink:0;">
                <img class="poster" src="${poster}" alt="${titulo}" style="margin-bottom: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.5);">

                <div class="local-rating-box" style="position: relative; z-index: 100; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 10px; text-align: center; width: 100%; border: 1px solid rgba(255,255,255,0.1);">

                    <div class="stars" style="margin-bottom: 8px;">
                        ${estrellasHtml}
                    </div>

                    <div style="color: #fff; font-weight: bold; font-size: 1.1em; letter-spacing: 1px;">
                        ${textoLocal}
                    </div>

                    ${ !estaLogueado ? '<small style="color:#bbb; display:block; margin-top:8px; font-size:0.8em;">Inicia sesión para votar</small>' : '' }
                </div>
            </div>

            <div class="info">
                <h1>${titulo}</h1>

                <div class="meta-data">
                    <span class="score" style="background:#f5c518; color:#000; padding:2px 6px; border-radius:4px; font-weight:bold;" title="Puntuación TMDB">TMDB: ${notaTMDB}</span>
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

    // reproducir la peli/cap
    if (!esSerie) {
        if (estaLogueado) {
            html += `<button onclick="reproducirPeli(${c.id})" class="btn-play-big">▶ Reproducir</button>`;
        } else {
            // Botón bloqueado que manda al login
            html += `<button onclick="window.location.href='/login'" class="btn-play-big" style="background-color:#444; color:#aaa; cursor:pointer;">Inicia sesión para ver</button>`;
        }
    }

    // botón de la lista
    html += `
        <button onclick="toggleMiLista(${c.id})" class="btn-lista" title="${textoLista}">
            <img id="icono-fav" src="${iconoCorazon}" alt="Favorito" style="width:28px; height:28px;">
        </button>
    `;

    // botón del trailer
    if(youtubeId) {
        html += `<button onclick="verTrailer('${youtubeId}')" class="btn-trailer">Ver Tráiler</button>`;
    }

    html += `</div></div></div>`;

    // renderizar temps
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

                    // botones cpas
                    let botonCapitulo = '';
                    if (estaLogueado) {
                        botonCapitulo = `<button class="btn-cap" onclick="reproducirCapitulo('${urlVideoCap}', ${cap.id})">▶ Reproducir</button>`;
                    } else {
                        botonCapitulo = `<button class="btn-cap" onclick="window.location.href='/login'" style="background:#333; color:#777;">Bloqueado</button>`;
                    }

                    html += `
                        <div class="capitulo-card">
                            <div style="display:flex; flex-direction:column;">
                                <span style="font-weight:bold; font-size:1em;">${cap.numeroCapitulo}. ${cap.titulo || 'Episodio ' + cap.numeroCapitulo}</span>
                            </div>
                            ${botonCapitulo}
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

// interación estrellas
function iluminar(val) {
    const estrellas = document.querySelectorAll('.local-rating-box .star');
    estrellas.forEach(s => {
        const v = parseInt(s.getAttribute('data-value'));
        if(v <= val) s.classList.add('filled');
        else s.classList.remove('filled');
    });
}

function restaurar() {
    const estrellas = document.querySelectorAll('.local-rating-box .star');
    estrellas.forEach(s => {
        const v = parseInt(s.getAttribute('data-value'));
        if(v <= miVotoActual) s.classList.add('filled');
        else s.classList.remove('filled');
    });
}

function enviarVoto(nota, idContenido) {
    const fd = new FormData();
    fd.append('contenidoId', idContenido);
    fd.append('nota', nota);

    fetch('/api/valoracion/votar', { method: 'POST', body: fd })
        .then(res => {
            if(res.ok) {
                miVotoActual = nota;
                restaurar();
                // Actualizar texto media
                fetch('/api/public/contenido/' + idContenido)
                    .then(r => r.json())
                    .then(c => {
                         const nuevoTexto = `${c.notaPromedioLocal}/5 (${c.contadorVotos} votos)`;
                         // Selector
                         const textDiv = document.querySelector('.local-rating-box div:nth-child(2)');
                         if(textDiv) textDiv.innerText = nuevoTexto;
                    });
            } else {
                alert("Error al votar");
            }
        });
}

function toggleMiLista(idContenido) {
    fetch(`/api/lista/toggle?idContenido=${idContenido}`, { method: 'POST' })
        .then(res => {
            if (res.status === 403 || res.status === 401) { window.location.href = '/login'; throw new Error("No autorizado"); }
            return res.json();
        })
        .then(data => {
            enMiLista = data.enLista;
            const img = document.getElementById('icono-fav');
            if (enMiLista) img.src = '/img/corazon_lleno.svg'; else img.src = '/img/corazon_vacio.svg';
        })
        .catch(err => console.error(err));
}

function reproducirPeli(idContenido) {
    fetch(`/api/historial/progreso?idContenido=${idContenido}`)
        .then(res => res.json()).then(segundos => reproducir(rutaVideoPeli, subsPeli, segundos, idContenido))
        .catch(() => reproducir(rutaVideoPeli, subsPeli, 0, idContenido));
}

function reproducirCapitulo(url, idCapitulo) {
    const listaSubs = episodiosData[idCapitulo] || [];
    fetch(`/api/historial/progreso?idContenido=${idCapitulo}`)
        .then(res => res.json()).then(segundos => reproducir(url, listaSubs, segundos, idCapitulo))
        .catch(() => reproducir(url, listaSubs, 0, idCapitulo));
}

function reproducir(urlVideo, listaSubtitulos, tiempoInicio = 0, idContenido = null) {
    const overlay = document.getElementById('overlay-reproductor');
    const container = document.getElementById('video-container');
    let tracksHtml = '';
    if (listaSubtitulos && Array.isArray(listaSubtitulos)) {
        listaSubtitulos.forEach((sub, index) => {
            const esDefault = index === 0 ? 'default' : '';
            tracksHtml += `<track kind="subtitles" label="${sub.etiqueta}" srclang="${sub.idioma}" src="${sub.rutaArchivo}?t=${new Date().getTime()}" ${esDefault}>`;
        });
    }
    container.innerHTML = `<video id="miVideoPlayer" class="plyr" playsinline controls crossorigin><source src="${urlVideo}" type="video/mp4">${tracksHtml}</video>`;
    miReproductorPlyr = new Plyr('#miVideoPlayer', { title: 'GargStream', controls: ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'], captions: { active: true, update: true, language: 'auto' }});

    const videoElement = document.getElementById('miVideoPlayer');
    videoElement.addEventListener('loadedmetadata', function() { if (tiempoInicio > 5) miReproductorPlyr.currentTime = tiempoInicio; });
    miReproductorPlyr.on('ready', event => { if (tiempoInicio > 5 && miReproductorPlyr.currentTime < 1) miReproductorPlyr.currentTime = tiempoInicio; });

    miReproductorPlyr.play();
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (idContenido) {
        if (latidoInterval) clearInterval(latidoInterval);
        latidoInterval = setInterval(() => {
            if (miReproductorPlyr && !miReproductorPlyr.paused && miReproductorPlyr.playing) {
                const current = miReproductorPlyr.currentTime;
                const total = miReproductorPlyr.duration;
                if (current > 0 && total > 0) enviarLatido(idContenido, current, total);
            }
        }, 5000);
    }
}

function enviarLatido(idContenido, segundos, total) {
    // URLSearchParams crea los parámetros ?id=...&segundos=...
    const params = new URLSearchParams({
        idContenido: idContenido,
        segundos: segundos,
        total: total
    });

    fetch('/api/historial/latido', {
        method: 'POST',

        //ÑADIR HEADERS
        headers: getAuthHeaders(),

        body: params
    })
    .then(res => {
        if (!res.ok) console.warn("No se pudo guardar el progreso (Error CSRF o Auth)");
    })
    .catch(err => console.error("Error conexión latido", err));
}

function verTrailer(youtubeId) {
    const overlay = document.getElementById('overlay-reproductor');
    const container = document.getElementById('video-container');
    container.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarVideo() {
    const overlay = document.getElementById('overlay-reproductor');
    const container = document.getElementById('video-container');
    if (miReproductorPlyr != null) { miReproductorPlyr.destroy(); miReproductorPlyr = null; }
    if (latidoInterval) clearInterval(latidoInterval);
    container.innerHTML = "";
    overlay.style.display = 'none';
    document.body.style.overflow = 'auto';
}