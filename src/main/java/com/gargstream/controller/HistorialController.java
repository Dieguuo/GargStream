package com.gargstream.controller;

import com.gargstream.dto.HistorialDTO;
import com.gargstream.model.Contenido;
import com.gargstream.model.Historial;
import com.gargstream.model.Usuario;
import com.gargstream.repository.ContenidoRepository;
import com.gargstream.repository.HistorialRepository;
import com.gargstream.repository.UsuarioRepository;
import com.gargstream.service.HistorialService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

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
        List<HistorialDTO> dtos = lista.stream()
                //filtro para que si ya se ha visto un 90% de la película se quite de continuar viendo
                .filter(h -> {
                    if (h.getDuracionTotal() == null || h.getDuracionTotal() == 0) return true;
                    double porcentaje = h.getSegundosVistos() / h.getDuracionTotal();
                    return porcentaje < 0.90;
                })
                .map(h -> {
                    HistorialDTO dto = new HistorialDTO();

                    //los datos básicos
                    dto.setSegundosVistos(h.getSegundosVistos());
                    dto.setDuracionTotal(h.getDuracionTotal());

                    dto.setContenido(h.getContenido());

                    //calcular el % para ponerlo en la barra del progreso
                    int porcentaje = 0;
                    if(h.getDuracionTotal() != null && h.getDuracionTotal() > 0){
                        porcentaje = (int) ((h.getSegundosVistos() / h.getDuracionTotal()) * 100);
                    }

                    if(porcentaje > 100){
                        porcentaje = 100;
                    }

                    dto.setPorcentaje(porcentaje);

                    return dto;
                }).toList();

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
                .orElse(ResponseEntity.ok(0.0)); //si no existe devolvemos 0
    }

}