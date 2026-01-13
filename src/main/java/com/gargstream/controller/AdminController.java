package com.gargstream.controller;
import com.gargstream.model.Pelicula;
import com.gargstream.model.Serie;
import com.gargstream.model.VideoPersonal;
import com.gargstream.service.ContenidoService;
import com.gargstream.service.PeliculaService;
import com.gargstream.service.SerieService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.gargstream.service.PeliculaService;
import com.gargstream.model.Capitulo;


@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ContenidoService contenidoService;
    private final PeliculaService peliculaService;
    private final SerieService serieService;

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

    /*SERIES*/
    //http://localhost:8080/api/admin/nueva-serie
    @PostMapping("/nueva-serie")
    public ResponseEntity<Serie> crearSerie(@RequestParam("titulo") String titulo){
        //solo enviar el título, de la serie, el archivo con loscapítulos
        Serie serie = serieService.crearSerie(titulo);
        return ResponseEntity.ok(serie);
    }

    //subir cap serie
    @PostMapping("/nuevo-capitulo")
    public ResponseEntity<Capitulo> subirCapitulo(
            @RequestParam("idSerie") Long idSerie,
            @RequestParam("numTemporada") Integer numTemporada,
            @RequestParam("numCapitulo") Integer numCapitulo,
            @RequestParam("titulo") String titulo,
            @RequestParam("archivo") MultipartFile archivo){

        Capitulo capitulo = serieService.agregarCapitulo(idSerie, numTemporada, numCapitulo, titulo, archivo);
        return ResponseEntity.ok(capitulo);
    }

    //borrar archivos
    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminarContenido(@PathVariable Long id){

        contenidoService.eliminarContenido(id);
        return ResponseEntity.noContent().build();
    }




}
