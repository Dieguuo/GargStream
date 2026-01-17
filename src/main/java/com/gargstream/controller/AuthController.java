package com.gargstream.controller;

import com.gargstream.model.Rol;
import com.gargstream.model.Usuario;
import com.gargstream.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    //mostrar el formulario de registro (Solo muestra la pantalla)
    @GetMapping("/register")
    public String mostrarFormulario() {
        return "register";
    }

    //procesar el registro (Recibe los datos cuando pulsas el botón)
    @PostMapping("/register")
    public String resgistrarUsuario(
            @RequestParam String nombre,
            @RequestParam String email,
            @RequestParam String password,
            Model model
    ){
        //comprobar si ya existe el email
        if(usuarioRepository.findByEmail(email).isPresent()){
            model.addAttribute("error", "Este correo electrónico ya está registrado.");
            return "register"; //volver al formulario
        }

        //crear el usuario nuevo
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setNombre(nombre);
        nuevoUsuario.setEmail(email);
        //encriptar la contraseña antes de guardarla
        nuevoUsuario.setPassword(passwordEncoder.encode(password));
        nuevoUsuario.setRol(Rol.USER);
        //poner avatar por defecto en el futuro
        nuevoUsuario.setAvatarUrl(null);

        //guardar en la bd
        usuarioRepository.save(nuevoUsuario);

        //redirigir al inicio de sesión
        return "redirect:/login";
    }


    // mostrar el formulario de Login
    @GetMapping("/login")
    public String mostrarLogin() {
        return "login";
    }
}