package com.gargstream.service;

import com.gargstream.model.VideoPersonal;
import com.gargstream.repository.ContenidoRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@Service
@AllArgsConstructor
public class ContenidoService {

    private final ContenidoRepository contenidoRepository;
    private final AlmacenamientoService almacenamientoService;

    //guardar un vídeo personal en la db
    public VideoPersonal guardarVideoPersonal(String titulo, String sipnosis, String autor, MultipartFile archivo){
        //guardar el archivo físico en el disco
        String nombreArchivo = almacenamientoService.store(archivo);
        //url para verlo
        String urlVideo = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/archivos/").path(nombreArchivo).toUriString();
        //crear el objeto para la db
        VideoPersonal video = new VideoPersonal();
        video.setTitulo(titulo);
        video.setSipnosis(sipnosis);
        video.setAutor(autor);
        video.setRutaVideo(urlVideo);
        //video.setRutaCaratula(...);

        //guardar en la db h2
        return contenidoRepository.save(video);
    }
}
