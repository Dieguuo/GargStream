package com.gargstream.controller;

import com.gargstream.model.Contenido;
import com.gargstream.repository.ContenidoRepository;
import com.gargstream.service.ContenidoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.*;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class ContenidoPublicoController {

    private final ContenidoRepository contenidoRepository;
    private final ContenidoService contenidoService;

    //http://localhost:8080/api/public/catalogo
    @GetMapping("/catalogo")
    public List<Contenido> verTodoElCatalogo(){
        //devuelve una lusta con las películas y vídeos
        return contenidoRepository.findAll();
    }

    //http://localhost:8080/api/public/contenido/{id}
    @GetMapping("/contenido/{id}")
    public ResponseEntity<Contenido> obtenerPorId(@PathVariable Long id) {
        return contenidoRepository.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    //http://localhost:8080/api/public/novedades
    @GetMapping("/novedades")
    public ResponseEntity<List<Contenido>> obtenerListaNovedades() {
        try {
            // pedir las 10 últimas
            List<Contenido> listaNovedades = contenidoService.obtenerNovedades();

            // devolver la lista
            return ResponseEntity.ok(listaNovedades);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

}