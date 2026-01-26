package com.gargstream.controller;

import com.gargstream.model.Usuario;
import com.gargstream.repository.UsuarioRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InicioController {

    private final UsuarioRepository usuarioRepository;

    public InicioController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // Gestiona todas las formas de llamar al inicio
    @GetMapping({"/", "/index", "/index.html"})
    public String inicio(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        //si hay alguien logueado se ponga su perfil
        if (userDetails != null) {
            Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElse(null);
            model.addAttribute("usuario", usuario);
        }
        return "index"; // Esto carga templates/index.html procesando Thymeleaf
    }
    //lo mismo pero con ver detalle
    @GetMapping("/ver_detalle.html")
    public String verDetalle(@AuthenticationPrincipal UserDetails userDetails, Model model) {

        // 1. Si hay usuario logueado, lo buscamos y lo pasamos al modelo
        if (userDetails != null) {
            Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElse(null);
            model.addAttribute("usuario", usuario);
        }

        // 2. Si NO hay usuario (userDetails es null), simplemente no añadimos nada.
        // Thymeleaf entenderá que 'usuario' es null y tratará al visitante como invitado.

        return "ver_detalle";
    }
}
