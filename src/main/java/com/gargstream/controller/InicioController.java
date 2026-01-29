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

    // gestiona todas las formas de llamar al inicio
    @GetMapping({"/", "/index", "/index.html"})
    public String inicio(@AuthenticationPrincipal UserDetails userDetails, Model model) {
        //si hay alguien logueado se ponga su perfil
        if (userDetails != null) {
            Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElse(null);
            model.addAttribute("usuario", usuario);
        }
        return "index";
    }
    //lo mismo pero con ver detalle
    @GetMapping("/ver_detalle.html")
    public String verDetalle(@AuthenticationPrincipal UserDetails userDetails, Model model) {

        // si hay un usuario logueado se busca y se le pasa al modelo
        if (userDetails != null) {
            Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElse(null);
            model.addAttribute("usuario", usuario);
        }

        return "ver_detalle";
    }
}
