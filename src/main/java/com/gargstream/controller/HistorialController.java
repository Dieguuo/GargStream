package com.gargstream.controller;

import com.gargstream.dto.HistorialDTO;
import com.gargstream.model.*;
import com.gargstream.repository.ContenidoRepository;
import com.gargstream.repository.HistorialRepository;
import com.gargstream.repository.UsuarioRepository;
import com.gargstream.service.HistorialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/historial")
@RequiredArgsConstructor
public class HistorialController {

    private final HistorialRepository historialRepository;
    private final HistorialService historialService;
    private final UsuarioRepository usuarioRepository;
    private final ContenidoRepository contenidoRepository;


    //guardar el progreso visto
    @PostMapping("/latido")
    public ResponseEntity<Void> recibirLatido(
            @RequestParam Long idContenido,
            @RequestParam Double segundos,
            @RequestParam Double total,
            @AuthenticationPrincipal UserDetails userDetails
    ){

        if (userDetails != null){
            historialService.registrarLatido(userDetails.getUsername(), idContenido, segundos, total);
        }

        return ResponseEntity.ok().build();
    }

    //obtener la fila de continuar viendo
    @GetMapping("/continuar-viendo")
    public ResponseEntity<List<HistorialDTO>> obtenerContinuarViendo(@AuthenticationPrincipal UserDetails userDetails){

        if(userDetails == null){
            return ResponseEntity.ok(new ArrayList<>());
        }

        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        List<Historial> lista = historialRepository.findTop10ByUsuarioOrderByFechaUltimaVisualizacionDesc(usuario);

        //convertirlo al dto
        List<HistorialDTO> dtos = new ArrayList<>();

        //para que no haya ducplicados
        Set<Long> seriesYaProcesadas = new HashSet<>();

        for(Historial h : lista){
            Contenido c = h.getContenido();

            //calcular el porcentaje visto
            double porcentajeVal = (h.getDuracionTotal() != null && h.getDuracionTotal() > 0) ? h.getSegundosVistos() / h.getDuracionTotal() : 0;

            //si es una película o video personal
            if (!(c instanceof Capitulo)) {
                //filtro para que si ya se ha visto un 90% de la película se quite de continuar viendo
                if (porcentajeVal < 0.90) {
                    dtos.add(crearDTO(h, null, null));
                }
                continue; //pasamos al siguiente
            }

            //si es un capítulo de una serie
            Capitulo capActual = (Capitulo) c;
            Serie seriePadre = capActual.getTemporada().getSerie();
            Long idSerie = seriePadre.getId();

            //si ya estaba la serie lo saltamos
            if(seriesYaProcesadas.contains(idSerie)){
                continue;
            }
            //marcar la serie como procesada
            seriesYaProcesadas.add(idSerie);

            //poner los datos de la serie para que quede bien en el menú
            c.setTitulo(seriePadre.getTitulo());
            c.setRutaCaratula(seriePadre.getRutaCaratula());
            c.setRutaFondo(seriePadre.getRutaFondo());

            //si no se ha terminado mostramos este capítulo
            if (porcentajeVal < 0.90) {
                String info = "T" + capActual.getTemporada().getNumeroTemporada() + ":E" + capActual.getNumeroCapitulo();
                dtos.add(crearDTO(h, c, info));
            }
            //si se ha terminado buscamos el siguiente automáticamente
            else {
                Contenido siguiente = buscarSiguienteCapitulo(capActual);

                if (siguiente != null) {
                    //creamos un historial falso con tiempo 0
                    Historial hSiguiente = new Historial();
                    hSiguiente.setContenido(siguiente);
                    hSiguiente.setSegundosVistos(0.0);
                    hSiguiente.setDuracionTotal(h.getDuracionTotal());

                    //visualmente le ponemos la carátula de la serie
                    siguiente.setTitulo(seriePadre.getTitulo());
                    siguiente.setRutaCaratula(seriePadre.getRutaCaratula());

                    Capitulo sigCap = (Capitulo) siguiente;
                    String info = "T" + sigCap.getTemporada().getNumeroTemporada() + ":E" + sigCap.getNumeroCapitulo();

                    dtos.add(crearDTO(hSiguiente, siguiente, info));
                }
                //si devuelve null es que acabó la serie y no añadimos nada
            }
        }

        return ResponseEntity.ok(dtos);
    }


    //obtener progreso individual para reanudar el vídeo
    @GetMapping("/progreso")
    public ResponseEntity<Double> obtenerProgreso(@RequestParam Long idContenido, @AuthenticationPrincipal UserDetails userDetails){
        //si no hay usuario logueado devuelve 0
        if(userDetails == null){
            return ResponseEntity.ok(0.0);
        }

        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        //buscamos el contenido por su id (asegúrate de inyectar ContenidoRepository arriba)
        Contenido contenido = contenidoRepository.findById(idContenido).orElse(null);

        if(contenido == null){
            return ResponseEntity.ok(0.0);
        }

        //buscar en el historial si el usuario ha viso el contenido
        return historialRepository.findByUsuarioAndContenido(usuario, contenido)
                .map(h -> {
                    // si ya se ha más del 95% devolver 0 para reiniciar
                    if (h.getDuracionTotal() != null && h.getDuracionTotal() > 0) {
                        double ratio = h.getSegundosVistos() / h.getDuracionTotal();
                        if (ratio > 0.95) return ResponseEntity.ok(0.0);
                    }
                    //si existe y no está acabado, devolvemos el segundo exacto
                    return ResponseEntity.ok(h.getSegundosVistos());
                })
                .orElse(ResponseEntity.ok(0.0)); //si no existe devuelve 0
    }

    //métodos auxiliares privados
    private HistorialDTO crearDTO(Historial h, Contenido contenidoVisual, String infoExtra) {
        HistorialDTO dto = new HistorialDTO();
        dto.setSegundosVistos(h.getSegundosVistos());
        dto.setDuracionTotal(h.getDuracionTotal());

        dto.setContenido(contenidoVisual != null ? contenidoVisual : h.getContenido());
        dto.setInformacionExtra(infoExtra);

        int porcentaje = 0;
        if(h.getDuracionTotal() != null && h.getDuracionTotal() > 0){
            porcentaje = (int) ((h.getSegundosVistos() / h.getDuracionTotal()) * 100);
        }
        if(porcentaje > 100) porcentaje = 100;
        dto.setPorcentaje(porcentaje);

        return dto;
    }

    private Capitulo buscarSiguienteCapitulo(Capitulo actual) {
        Temporada tempActual = actual.getTemporada();
        Serie serie = tempActual.getSerie();

        //buscamos en la misma temporada
        Optional<Capitulo> siguienteEnTemp = tempActual.getCapitulos().stream()
                .filter(c -> c.getNumeroCapitulo() > actual.getNumeroCapitulo())
                .min(Comparator.comparingInt(Capitulo::getNumeroCapitulo));

        if (siguienteEnTemp.isPresent()) return siguienteEnTemp.get();

        //si no buscamos en la siguiente temporada
        Optional<Temporada> siguienteTemp = serie.getTemporadas().stream()
                .filter(t -> t.getNumeroTemporada() > tempActual.getNumeroTemporada())
                .min(Comparator.comparingInt(Temporada::getNumeroTemporada));

        if (siguienteTemp.isPresent()) {
            return siguienteTemp.get().getCapitulos().stream()
                    .min(Comparator.comparingInt(Capitulo::getNumeroCapitulo))
                    .orElse(null);
        }

        return null;
    }

}