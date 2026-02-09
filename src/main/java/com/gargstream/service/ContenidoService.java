package com.gargstream.service;

import com.gargstream.model.*;
import com.gargstream.repository.ContenidoRepository;
import com.gargstream.repository.HistorialRepository;
import com.gargstream.repository.UsuarioRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;


@Service
@AllArgsConstructor
public class ContenidoService {

    private final ContenidoRepository contenidoRepository;
    private final AlmacenamientoService almacenamientoService;
    private final HistorialRepository historialRepository;
    private final UsuarioRepository usuarioRepository;

    //los nombres de las carpetas principales
    private static final String CARPETA_PELICULAS = "Peliculas";
    private static final String CARPETA_VIDEOS = "Videos_Personales";
    private static final String CARPETA_SERIES = "Series";

    //guardar un vídeo personal en la db con imágenes
    public VideoPersonal guardarVideoPersonal(String titulo, String sipnosis, String autor,
                                              MultipartFile archivo,
                                              MultipartFile caratula,
                                              MultipartFile fondo,
                                              MultipartFile archivoSubtitulo){

        //crear el nombre de la carpeta
        String tituloSanitizado = almacenamientoService.sanitizarNombre(titulo);
        //la ruta
        String rutaCarpeta = CARPETA_VIDEOS + "/" + tituloSanitizado;

        //guardar el archivo físico en esa carpeta
        String nombreArchivo = almacenamientoService.store(archivo, rutaCarpeta);
        //url para verlo
        String urlVideo = "/api/archivos/" + nombreArchivo;

        //crear el objeto para la db
        VideoPersonal video = new VideoPersonal();
        video.setTitulo(titulo);
        video.setSipnosis(sipnosis);
        video.setAutor(autor);
        video.setRutaVideo(urlVideo);

        //guardar la carátula obligatoria
        if (caratula != null && !caratula.isEmpty()) {
            String nombreCaratula = almacenamientoService.store(caratula, rutaCarpeta);
            String urlCaratula = "/api/archivos/" + nombreCaratula;
            video.setRutaCaratula(urlCaratula);

            //si hay fondo guardarlo, si no usar la carátula
            if (fondo != null && !fondo.isEmpty()) {
                String nombreFondo = almacenamientoService.store(fondo, rutaCarpeta);
                video.setRutaFondo("/api/archivos/" + nombreFondo);
            } else {
                video.setRutaFondo(urlCaratula);
            }
        }

        //si hay subts añadirlos en la misma carpeta
        if(archivoSubtitulo != null && !archivoSubtitulo.isEmpty()){
            String nombreSubtitulo = almacenamientoService.store(archivoSubtitulo, rutaCarpeta);
            String urlSubtitulo = "/api/archivos/" + nombreSubtitulo;

            //añadir a la lista de subtítulos
            Subtitulo sub = new Subtitulo();
            sub.setRutaArchivo(urlSubtitulo);
            sub.setIdioma("es");
            sub.setEtiqueta("Español");
            sub.setContenido(video);
            video.getSubtitulos().add(sub);
        }

        //guardar en la db h2
        return contenidoRepository.save(video);
    }


    //méetodo para borrar cualquier cosa
    @Transactional
    public void eliminarContenido(Long id){
        //recuperar el contenido antes de borrarlo para saber qué archivos tiene
        Contenido contenido = contenidoRepository.findById(id).orElseThrow(() -> new RuntimeException("Contenido no encontrado"));

        //quitar de la lista de favoritos
        List<Usuario> usuariosConElContenido = usuarioRepository.findByMiListaContains(contenido);
        for (Usuario u : usuariosConElContenido) {
            u.getMiLista().remove(contenido);
            usuarioRepository.save(u);
        }

        //borrar subtitulso que haya
        if(contenido.getSubtitulos() != null){
            for(Subtitulo sub : contenido.getSubtitulos()){
                borrarArchivoFisico(sub.getRutaArchivo());
            }
        }

        // borrar archivos de video según el tipo
        if(contenido instanceof Serie serie){
            // si es una serie recorre temps y caps
            if(serie.getTemporadas() != null){
                for(Temporada temporada : serie.getTemporadas()){
                    if(temporada.getCapitulos() != null){
                        for(Capitulo capitulo : temporada.getCapitulos()){
                            // limpiar historial del capítulo
                            historialRepository.deleteByContenido(capitulo);

                            // limpiar favoritos del capítulo si los hay
                            List<Usuario> usersCap = usuarioRepository.findByMiListaContains(capitulo);
                            for(Usuario u : usersCap){
                                u.getMiLista().remove(capitulo);
                                usuarioRepository.save(u);
                            }

                            //borrar el archivo físico
                            borrarArchivoFisico(capitulo.getRutaVideo());

                            //borrar los subtítulos también si los hay
                            if(capitulo.getSubtitulos() != null) {
                                for(Subtitulo subCap : capitulo.getSubtitulos()){
                                    borrarArchivoFisico(subCap.getRutaArchivo());
                                }
                            }
                        }
                    }
                }
            }

            //borrar la carpeta enteraa
            String nombreCarpeta = almacenamientoService.sanitizarNombre(serie.getTitulo());
            almacenamientoService.eliminarCarpeta(CARPETA_SERIES + "/" + nombreCarpeta);

        }else if(contenido instanceof Pelicula pelicula){
            //borrar una pelicula
            borrarArchivoFisico(pelicula.getRutaVideo());
            // intento borrar carpeta padre si está vacía o es propia
            borrarCarpetaPadreSiCorresponde(pelicula.getRutaVideo(), CARPETA_PELICULAS);

        }else if(contenido instanceof VideoPersonal videoPersonal){
            //borrar un video personal
            borrarArchivoFisico(videoPersonal.getRutaVideo());
            // intento borrar carpeta padre si está vacía o es propia
            borrarCarpetaPadreSiCorresponde(videoPersonal.getRutaVideo(), CARPETA_VIDEOS);

        }else if( contenido instanceof Capitulo capitulo){
            //borrar un cap individual
            historialRepository.deleteByContenido(capitulo); //limpiar el historial específico

            // limpiar favoritos específico
            List<Usuario> usersCap = usuarioRepository.findByMiListaContains(capitulo);
            for(Usuario u : usersCap){
                u.getMiLista().remove(capitulo);
                usuarioRepository.save(u);
            }
            //borrar el archivo físico
            borrarArchivoFisico((capitulo.getRutaVideo()));

            //borrar la carpeta física si está vacía
            //recuperar la ruta del vídeo
            String rutaCompleta = capitulo.getRutaVideo();
            if(rutaCompleta != null && rutaCompleta.contains("/api/archivos")){
                String rutaFisica = rutaCompleta.replace("/api/archivos/", "");

                if(rutaFisica.contains("/")){
                    //obtener la carpeta padre
                    String carpetaTemporada = rutaFisica.substring(0, rutaFisica.lastIndexOf("/"));
                    //intentar borrarlo
                    try{
                        almacenamientoService.eliminarDirectorioSiVacio(carpetaTemporada);
                    }catch (Exception e){

                    }
                }

            }
        }

        //borrar el hisotrial del objeto
        historialRepository.deleteByContenido(contenido);
        //borrarlo de la base d datos
        contenidoRepository.delete(contenido);
    }

    //metodo para sacar el nombre del archivo de la url y borrarlo
    private void borrarArchivoFisico(String urlVideo){
        if(urlVideo != null && !urlVideo.isEmpty()){
            try {
                String nombreArchivo = urlVideo.replace("/api/archivos/", "");

                almacenamientoService.delete(nombreArchivo);
                System.out.println("Archivo borrado físicamente: " + nombreArchivo);

            }catch (Exception e){
                System.out.println("Error al borrar el archivo físicamente: " + urlVideo);
            }
        }
    }

    // metodo para borrar la carpeta para no dejarla ahí
    private void borrarCarpetaPadreSiCorresponde(String urlVideo, String carpetaBase) {
        if (urlVideo != null && urlVideo.contains("/api/archivos/")) {
            String rutaFisica = urlVideo.replace("/api/archivos/", "");
            if (rutaFisica.contains("/")) {
                String carpetaPadre = rutaFisica.substring(0, rutaFisica.lastIndexOf("/"));
                // Solo borramos si la carpeta está dentro de la categoría correcta
                if (carpetaPadre.startsWith(carpetaBase)) {
                    almacenamientoService.eliminarCarpeta(carpetaPadre);
                }
            }
        }
    }

    //obtener las 10 últimas novedades
    public List<Contenido> obtenerNovedades(){
        return contenidoRepository.findTop10ByOrderByIdDesc();
    }
}