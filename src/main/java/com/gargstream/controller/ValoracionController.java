package com.gargstream.controller;

import com.gargstream.model.Usuario;
import com.gargstream.repository.UsuarioRepository;
import com.gargstream.service.ValoracionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/valoracion")
@RequiredArgsConstructor
public class ValoracionController {

    private final ValoracionService valoracionService;
    private final UsuarioRepository usuarioRepository;

    // /api/valoracion/votar?id=1&nota=5
    @PostMapping("/votar")
    public ResponseEntity<?> votar(@RequestParam Long contenidoId,
                                   @RequestParam int nota,
                                   @AuthenticationPrincipal UserDetails userDetails) {

        if (userDetails == null) return ResponseEntity.status(401).body("Debes iniciar sesión");

        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        try {
            valoracionService.votar(usuario.getId(), contenidoId, nota);
            return ResponseEntity.ok(Map.of("mensaje", "Voto guardado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    //el voto de cada usuario
    @GetMapping("/mi-voto")
    public ResponseEntity<Integer> obtenerMiVoto(@RequestParam Long contenidoId,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) return ResponseEntity.ok(0);

        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElse(null);

        if (usuario == null) return ResponseEntity.ok(0);

        int nota = valoracionService.obtenerMiVoto(usuario.getId(), contenidoId);
        return ResponseEntity.ok(nota);
    }
}