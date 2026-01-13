package com.gargstream.controller;
import com.gargstream.model.Pelicula;
import com.gargstream.model.VideoPersonal;
import com.gargstream.service.ContenidoService;
import com.gargstream.service.PeliculaService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.gargstream.service.PeliculaService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ContenidoService contenidoService;
    private final PeliculaService peliculaService;

    /*VIDEOS PERSONALES*/
    //http://localhost:8080/api/admin/nuevo-video
    @PostMapping("/nuevo-video")
    public ResponseEntity<VideoPersonal> subirVideoPersonal(
            @RequestParam("titulo") String titulo,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("autor") String autor,
            @RequestParam("archivo") MultipartFile archivo){


        VideoPersonal videoGuardado = contenidoService.guardarVideoPersonal(titulo, descripcion, autor, archivo);

        return ResponseEntity.ok(videoGuardado);

    }

    /*PELICULAS*/
    @PostMapping("/nueva-pelicula")
    public ResponseEntity<Pelicula> subirPelicula(
            @RequestParam("titulo") String titulo,
            @RequestParam("archivo") MultipartFile archivo){

        //solo hay que pasar el titulo y archivo, y la api busca los demás datos
        Pelicula pelicula = peliculaService.guardarPelicula(titulo, archivo);
        return ResponseEntity.ok(pelicula);

    }


}
