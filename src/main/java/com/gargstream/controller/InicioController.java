package com.gargstream.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class InicioController {

    // Gestiona todas las formas de llamar al inicio
    @GetMapping({"/", "/index", "/index.html"})
    public String inicio() {
        return "index"; // Esto carga templates/index.html procesando Thymeleaf
    }
    //lo mismo pero con ver detalle
    @GetMapping("/ver_detalle.html")
    public String verDetalle() {
        return "ver_detalle"; // Carga templates/ver_detalle.html
    }
}
