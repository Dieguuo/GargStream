package com.gargstream.controller;

import com.gargstream.model.Usuario;
import com.gargstream.service.EmailService;
import com.gargstream.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.ui.Model;

@Controller
public class ContactoController {

    @Autowired
    private EmailService emailService;

    @Autowired
    private UsuarioService usuarioService;

    // mostrar el formulario
    @GetMapping("/contacto")
    public String mostrarFormulario(Model model, Authentication authentication) {
        //ver si está loguado
        if (authentication != null) {
            String email = authentication.getName();
            Usuario usuario = usuarioService.buscarPorEmail(email);
            model.addAttribute("usuario", usuario);
        }
        return "contacto";
    }

    // procesar el encío
    @PostMapping("/contacto/enviar")
    public String enviarFormulario(@RequestParam String asunto,
                                   @RequestParam String mensaje,
                                   Authentication authentication) {

        //obtener datos del usuario logueado
        String emailUsuario = authentication.getName();
        Usuario usuario = usuarioService.buscarPorEmail(emailUsuario);

        // usamos su nombre real si existe, si no, su email
        String nombreParaMostrar = (usuario != null) ? usuario.getNombre() : emailUsuario;

        // enviar el correo al admin
        emailService.enviarSugerenciaHTML(nombreParaMostrar, asunto, mensaje);

        // enviar correo de confirmación al USUARIO
        emailService.enviarConfirmacionUsuario(emailUsuario, nombreParaMostrar, asunto);

        // redirigir con éxito
        return "redirect:/contacto?exito";
    }
}