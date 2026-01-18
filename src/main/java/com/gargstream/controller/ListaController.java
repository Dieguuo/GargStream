package com.gargstream.controller;

import com.gargstream.model.Contenido;
import com.gargstream.model.Usuario;
import com.gargstream.repository.ContenidoRepository;
import com.gargstream.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/lista")
@RequiredArgsConstructor
public class ListaController {

    private final UsuarioRepository usuarioRepository;
    private final ContenidoRepository contenidoRepository;

    //lo hago un interruptor (toggle) para que solo haya un botón
    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> alternarFavorito(
            @RequestParam Long idContenido,
            @AuthenticationPrincipal UserDetails userDetails
    ){
        //obtener el usuario real de la bd
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        //buscar el contenido
        Contenido contenido = contenidoRepository.findById(idContenido).orElseThrow(() -> new RuntimeException("Contenido no encontrado"));

        Set<Contenido> favoritos = usuario.getMiLista();
        boolean estabaEnLista = favoritos.contains(contenido);

        if(estabaEnLista){
            favoritos.remove(contenido);//si está se quita
        }else {
            favoritos.add(contenido); //si no se añade
        }

        usuarioRepository.save(usuario);

        // lo devuelvo en json para que js sepa qué icono poner
        Map<String, Object> respuesta = new HashMap<>();
        respuesta.put("enLista", !estabaEnLista); // El nuevo estado
        respuesta.put("mensaje", estabaEnLista ? "Eliminado de mi lista" : "Añadido a mi lista");

        return ResponseEntity.ok(respuesta);
    }

    //comprobar el estado para pintar el corazón de favoritos
    @GetMapping("/estado")
    public ResponseEntity<Boolean> comprobarEstado(
            @RequestParam Long idContenido,
            @AuthenticationPrincipal UserDetails userDetails
    ){

        //para que si no está logueado no haya
        if (userDetails == null){
            return ResponseEntity.ok(false);
        }

        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        Contenido contenido = contenidoRepository.findById(idContenido).orElseThrow();

        boolean esta = usuario.getMiLista().contains(contenido);
        return ResponseEntity.ok(esta);


    }


}
