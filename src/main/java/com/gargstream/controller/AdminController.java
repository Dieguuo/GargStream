package com.gargstream.controller;
import com.gargstream.dto.UsuarioDTO;
import com.gargstream.model.*;
import com.gargstream.repository.ContenidoRepository;
import com.gargstream.repository.UsuarioRepository;
import com.gargstream.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import com.gargstream.service.PeliculaService;
import org.springframework.web.bind.annotation.DeleteMapping; // Importar esto
import org.springframework.web.bind.annotation.PathVariable;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collector;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ContenidoService contenidoService;
    private final PeliculaService peliculaService;
    private final ContenidoRepository contenidoRepository;
    private final AlmacenamientoService almacenamientoService;
    private final SerieService serieService;
    private final UsuarioRepository usuarioRepository;


    /*VIDEOS PERSONALES*/
    //http://localhost:8080/api/admin/nuevo-video
    @PostMapping("/nuevo-video")
    public ResponseEntity<VideoPersonal> subirVideoPersonal(
            @RequestParam("titulo") String titulo,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("autor") String autor,
            @RequestParam("archivo") MultipartFile archivo,
            //los subtitulso son opcionales
            @RequestParam(value = "subtitulo", required = false) MultipartFile subtitulo){


        VideoPersonal videoGuardado = contenidoService.guardarVideoPersonal(titulo, descripcion, autor, archivo, subtitulo);

        return ResponseEntity.ok(videoGuardado);

    }

    /*PELICULAS*/
    @PostMapping("/nueva-pelicula")
    public ResponseEntity<Pelicula> subirPelicula(
            @RequestParam("titulo") String titulo,
            @RequestParam("archivo") MultipartFile archivo,
            //los subtitulso son opcionales
            @RequestParam(value = "subtitulo", required = false) MultipartFile subtitulo){

        //solo hay que pasar el titulo y archivo, y la api busca los demás datos
        Pelicula pelicula = peliculaService.guardarPelicula(titulo, archivo, subtitulo);
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
            @RequestParam("archivo") MultipartFile archivo,
            //los subtitulso son opcionales
            @RequestParam(value = "subtitulo", required = false) MultipartFile subtitulo){

        Capitulo capitulo = serieService.agregarCapitulo(idSerie, numTemporada, numCapitulo, titulo, archivo, subtitulo);
        return ResponseEntity.ok(capitulo);
    }

    //borrar archivos (Este método sigue aquí por compatibilidad con otras funciones si las hay)
    @DeleteMapping("/eliminar/{id}")
    public ResponseEntity<Void> eliminarContenido(@PathVariable Long id){

        contenidoService.eliminarContenido(id);
        return ResponseEntity.noContent().build();
    }


    @PostMapping("/editar-contenido")
    public ResponseEntity<String> editarContenido(
            @RequestParam Long id,
            @RequestParam(required = false) String titulo,
            @RequestParam(required = false) String sipnosis,
            @RequestParam(required = false) String youtubeTrailerId,
            @RequestParam(required = false) MultipartFile archivoCaratula,
            @RequestParam(required = false) MultipartFile archivoSubtitulo,
            @RequestParam(required = false) String idiomaSub,
            @RequestParam(required = false) String nombreSub
    ) {
        try {
            // buscar el contenido
            Contenido contenido = contenidoRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Contenido no encontrado"));

            // actualizar los textos
            if (titulo != null && !titulo.isBlank()) contenido.setTitulo(titulo);
            if (sipnosis != null && !sipnosis.isBlank()) contenido.setSipnosis(sipnosis);

            //cambiar el trailer
            if (youtubeTrailerId != null) {
                contenido.setYoutubeTrailerId(youtubeTrailerId); // al enviar una cadena vacía se borra
            }

            // cambiar la carátula
            if (archivoCaratula != null && !archivoCaratula.isEmpty()) {
                String nombreFichero = almacenamientoService.store(archivoCaratula);
                contenido.setRutaCaratula("/api/archivos/" + nombreFichero);
            }

            // añadir un nuevo subtítulo
            if (archivoSubtitulo != null && !archivoSubtitulo.isEmpty()) {
                // guardar el archivo físico y capturar su nombre REAL
                String nombreArchivoFisico = almacenamientoService.store(archivoSubtitulo);

                // IMPORTANTE: Aquí usamos el nombre del archivo físico, NO el nombre del idioma
                String rutaFinal = "/api/archivos/" + nombreArchivoFisico;

                // crear un objeto Subtitulo
                Subtitulo nuevoSub = new Subtitulo();
                nuevoSub.setRutaArchivo(rutaFinal);

                // usar lo que ponga el usuario en el formulario
                nuevoSub.setIdioma((idiomaSub != null && !idiomaSub.isBlank()) ? idiomaSub : "es");
                nuevoSub.setEtiqueta((nombreSub != null && !nombreSub.isBlank()) ? nombreSub : "Español (Extra)");
                nuevoSub.setContenido(contenido);

                // añadirlo a la lista que ya hay
                contenido.getSubtitulos().add(nuevoSub);
            }

            // 5. Guardar todo
            contenidoRepository.save(contenido);

            return ResponseEntity.ok().body("{\"mensaje\": \"Contenido actualizado correctamente\"}");

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error al editar: " + e.getMessage());
        }
    }


    //borrar contenido
    @DeleteMapping("/eliminar-contenido/{id}")
    public ResponseEntity<String> eliminarContenidoAdmin(@PathVariable Long id){
        try{
            // Usamos tu servicio para borrar físico + DB
            contenidoService.eliminarContenido(id);
            return ResponseEntity.ok("Contenido y archivos eliminados correctamente");

        } catch (Exception e){
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al eliminar: " + e.getMessage());
        }
    }


    //obetener numero y peso total de contenido
    @GetMapping("/metricas")
    public ResponseEntity<Map<String, Object>> obtnerMetricas(){
        Map<String, Object> respuesta = new HashMap<>();

        try{
            //contar los registros en la base de datos
            long totalPelis = contenidoRepository.findAll().stream().filter(c -> c instanceof Pelicula).count();
            long totalSeries = contenidoRepository.findAll().stream().filter(c -> c instanceof Serie).count();
            long totalVideos = contenidoRepository.findAll().stream().filter(c-> c instanceof  VideoPersonal).count();

            //calcular el espacio en el disco
            long bytesUsados = almacenamientoService.obtenerEspacioUsado();
            long bytesTotales = almacenamientoService.obtenerEspacioTotal();

            //calcular el porcentaje del disco
            int porcentaje = (bytesTotales > 0) ? (int) ((bytesUsados * 100) / bytesTotales) : 0;

            //convertirlos a gb
            String usadoLegible = bytesAString(bytesUsados);
            String totalLegible = bytesAString(bytesTotales);

            //empaquetarlo
            respuesta.put("peliculas", totalPelis);
            respuesta.put("series", totalSeries);
            respuesta.put("videos", totalVideos);
            respuesta.put("usado", usadoLegible);
            respuesta.put("total", totalLegible);
            respuesta.put("porcentaje", porcentaje);
            return ResponseEntity.ok(respuesta);


        }catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    //método para convertir datos.
    private String bytesAString(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }


    //ver los usuarios
    @GetMapping("/usuarios")
    public ResponseEntity<List<UsuarioDTO>> listarUsuario(){
        //buscar todos los usuarios en la bd
        List<Usuario> usuarios = usuarioRepository.findAll();
        //covertir cada usuario con contraseña y datos que no se deben mostrar a uno que sí.
        List<UsuarioDTO> listaSegura = usuarios.stream().map(u -> new UsuarioDTO(
                u.getId(),
                u.getNombre(),
                u.getEmail(),
                u.getRol().toString(),
                u.getAvatarUrl(),
                u.getFechaRegistro()
        )).toList();

        return ResponseEntity.ok(listaSegura);
    }


}