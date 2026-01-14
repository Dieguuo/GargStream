package com.gargstream.service;

import com.gargstream.model.*;
import com.gargstream.repository.ContenidoRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;


@Service
@AllArgsConstructor
public class ContenidoService {

    private final ContenidoRepository contenidoRepository;
    private final AlmacenamientoService almacenamientoService;

    //guardar un vídeo personal en la db
    public VideoPersonal guardarVideoPersonal(String titulo, String sipnosis, String autor, MultipartFile archivo, MultipartFile archivoSubtitulo){
        //guardar el archivo físico en el disco
        String nombreArchivo = almacenamientoService.store(archivo);
        //url para verlo
        String urlVideo = "/api/archivos/" + nombreArchivo;
        //crear el objeto para la db
        VideoPersonal video = new VideoPersonal();
        video.setTitulo(titulo);
        video.setSipnosis(sipnosis);
        video.setAutor(autor);
        video.setRutaVideo(urlVideo);

        //si hay subts añadirlos
        if(archivoSubtitulo != null && !archivoSubtitulo.isEmpty()){
            String nombreSubtitulo = almacenamientoService.store(archivoSubtitulo);
            String urlSubtitulo = "/api/archivos/" + archivoSubtitulo;
            video.setRutaSubtitulo(urlSubtitulo);
        }

        //guardar en la db h2
        return contenidoRepository.save(video);
    }

    //méetodo para borrar cualquier cosa
    public void eliminarContenido(Long id){
        //recuperar el contenido antes de borrarlo para saber qué archivos tiene
        Contenido contenido = contenidoRepository.findById(id).orElseThrow(() -> new RuntimeException("Contenido no encontrado"));

        //según el tipo
        if(contenido instanceof Serie serie){

            //recorrer todas las temporadas y los caps
            if(serie.getTemporadas() != null){
                for(Temporada temporada : serie.getTemporadas()){
                    if(temporada.getCapitulos() != null){
                        for(Capitulo capitulo : temporada.getCapitulos()){
                            borrarArchivoFisico(capitulo.getRutaVideo());
                        }
                    }
                }
            }
        }else if(contenido instanceof Pelicula pelicula){

            borrarArchivoFisico(pelicula.getRutaVideo());
        }else if(contenido instanceof VideoPersonal videoPersonal){
            borrarArchivoFisico(videoPersonal.getRutaVideo());
        }

        contenidoRepository.delete(contenido);
    }

    //metodo para sacar el nombre del archivo de la url y borrarlo
    private void borrarArchivoFisico(String urlVideo){
        if(urlVideo != null && !urlVideo.isEmpty()){
            try {
                //solo hay que coger lo último tras la última /
                String nombreArchivo = urlVideo.substring(urlVideo.lastIndexOf("/") + 1);

                almacenamientoService.delete(nombreArchivo);
                System.out.println("Archivo borrado físicamente" + nombreArchivo);

            }catch (Exception e){
                System.out.println("Error al borrar el archivo físicamente: " + urlVideo);
            }
        }
    }

}
