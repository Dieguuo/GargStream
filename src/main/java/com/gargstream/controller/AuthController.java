package com.gargstream.controller;

import com.gargstream.model.Rol;
import com.gargstream.model.Usuario;
import com.gargstream.repository.UsuarioRepository;
import com.gargstream.service.EmailService; // <--- Importar
import org.springframework.http.ResponseEntity; // <--- Importar
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*; // <--- Importar

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Controller
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
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


    //recuperación de contraseña
    @PostMapping("/api/public/recuperar/solicitar")
    @ResponseBody // Importante: Esto devuelve JSON, no HTML
    public ResponseEntity<?> solicitarRecuperacion(@RequestParam String email) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            // Generar código de 6 caracteres (Reutilizando lógica simple)
            String codigo = generarCodigoAleatorio();

            // Guardar en BD con fecha de expiración (15 minutos)
            usuario.setCodigoRecuperacion(codigo);
            usuario.setExpiracionRecuperacion(LocalDateTime.now().plusMinutes(15));
            usuarioRepository.save(usuario);

            // Enviar email
            try {
                emailService.enviarCodigoRecuperacion(email, codigo);
            } catch (Exception e) {
                return ResponseEntity.status(500).body("Error al enviar el correo. Inténtalo más tarde.");
            }
        }

        // Por seguridad, siempre decimos OK, aunque el correo no exista (para no dar pistas)
        return ResponseEntity.ok(Map.of("mensaje", "Si el correo existe, se ha enviado un código."));
    }


    // verificar código
    @PostMapping("/api/public/recuperar/verificar")
    @ResponseBody
    public ResponseEntity<?> verificarCodigo(@RequestParam String email, @RequestParam String codigo) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            // comprobar si tiene código si coincide y si no ha caducado
            if (usuario.getCodigoRecuperacion() != null
                    && usuario.getCodigoRecuperacion().equals(codigo)
                    && usuario.getExpiracionRecuperacion().isAfter(LocalDateTime.now())) {

                return ResponseEntity.ok(Map.of("valido", true));
            }
        }
        return ResponseEntity.badRequest().body("Código inválido o expirado.");
    }

    // cambiar la contraseña
    @PostMapping("/api/public/recuperar/cambiar")
    @ResponseBody
    public ResponseEntity<?> cambiarPassword(@RequestParam String email,
                                             @RequestParam String codigo,
                                             @RequestParam String nuevaPassword) {

        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            // verificar por seguridad
            if (usuario.getCodigoRecuperacion() != null
                    && usuario.getCodigoRecuperacion().equals(codigo)
                    && usuario.getExpiracionRecuperacion().isAfter(LocalDateTime.now())) {

                // cambiar la contraseña
                usuario.setPassword(passwordEncoder.encode(nuevaPassword));

                // limpiar el código
                usuario.setCodigoRecuperacion(null);
                usuario.setExpiracionRecuperacion(null);

                usuarioRepository.save(usuario);

                return ResponseEntity.ok(Map.of("mensaje", "Contraseña actualizada correctamente."));
            }
        }
        return ResponseEntity.badRequest().body("Error al cambiar la contraseña. El código puede haber expirado.");
    }

    // generar el código
    private String generarCodigoAleatorio() {
        String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(caracteres.charAt(random.nextInt(caracteres.length())));
        }
        return sb.toString();
    }

    @GetMapping("/recuperar")
    public String mostrarPaginaRecuperacion() {
        return "recuperar"; // Esto buscará recuperar.html en templates
    }





}