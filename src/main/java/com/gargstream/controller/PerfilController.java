package com.gargstream.controller;

import com.gargstream.model.Usuario;
import com.gargstream.repository.UsuarioRepository;
import com.gargstream.service.EmailService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.Random;
import java.util.UUID;

@Controller
public class PerfilController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    //la ruta de application prop.
    @Value("${gargstream.upload.path}")
    private String uploadPath;

    public PerfilController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, EmailService emailService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    //ver el perfil
    @GetMapping("/perfil")
    public String verPerfil(@AuthenticationPrincipal UserDetails userDetails, Model model){
        //si no está logueado le manda al login
        if(userDetails == null){
            return "redirect:/login";
        }

        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        model.addAttribute("usuario", usuario); // Faltaba pasar el usuario a la vista
        model.addAttribute("verificandoEmail", usuario.getNuevoEmailPendiente() != null);

        return "perfil";

    }


    //actualizar nombre
    @PostMapping("/api/perfil/actualizar-nombre")
    public String actualizarDatos(@AuthenticationPrincipal UserDetails userDetails, @RequestParam String nombre){

        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        usuario.setNombre(nombre);
        usuarioRepository.save(usuario);
        return "redirect:/perfil?success";
    }

    //solicitar el cambio de email
    @PostMapping("/api/perfil/solicitar-email")
    public String solicitarCambioEmail(@AuthenticationPrincipal UserDetails userDetails, @RequestParam String nuevoEmail){
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        //comprobar que el nuevo email no esté ya registrado
        if(usuarioRepository.findByEmail(nuevoEmail).isPresent()){
            return "redirect:/perfil?error=emailExists";
        }

        //generar código de verificación
        String codigo = generarCodigoAleatorio();

        //guardarlo en la bd temporalmente
        usuario.setCodigoVerificacion(codigo);
        usuario.setExpiracionCodigo(LocalDateTime.now().plusMinutes(10));//a los 10 minutos caduca el codigo
        usuario.setNuevoEmailPendiente(nuevoEmail);
        usuarioRepository.save(usuario);

        //enviar el correo
        try{
            emailService.enviarCodigoVerificacion(nuevoEmail, codigo);
        }catch (Exception e){
            e.printStackTrace();
            return "redirect:/perfil?error=mailSend";
        }

        return "redirect:/perfil?verify=true";
    }

    //verificar el código y cambiar el email
    @PostMapping("/api/perfil/validar-email")
    public String validarCambioEmail(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String codigo,
            HttpServletRequest request
    ){

        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
        //comprobar si hay algo pendiente
        if(usuario.getNuevoEmailPendiente() == null || usuario.getCodigoVerificacion() == null){
            return "redirect:/perfil?error=noRequest";
        }

        //comprobar la fecha de expiración
        if(LocalDateTime.now().isAfter(usuario.getExpiracionCodigo())){
            limpiarDatosVerificacion(usuario);
            return "redirect:/perfil?error=codeExpired";
        }

        //comprobar que el código coincide
        if(!usuario.getCodigoVerificacion().equals(codigo)){
            return "redirect:/perfil?error=wrongCode&verify=true";
        }

        //si el código es correcto se hace el cambio
        usuario.setEmail(usuario.getNuevoEmailPendiente());
        limpiarDatosVerificacion(usuario);
        usuarioRepository.save(usuario);

        //forzar el cierre de sesión para que se vuelva a iniciar sesión
        SecurityContextHolder.clearContext();
        HttpSession session = request.getSession(false);
        if(session != null){
            session.invalidate();
        }

        return "redirect:/login?emailChanged";

    }

    // Método auxiliar para limpiar los campos temporales
    private void limpiarDatosVerificacion(Usuario usuario) {
        usuario.setCodigoVerificacion(null);
        usuario.setExpiracionCodigo(null);
        usuario.setNuevoEmailPendiente(null);
        usuarioRepository.save(usuario);
    }
    // Generador de código simple
    private String generarCodigoAleatorio() {
        String caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            sb.append(caracteres.charAt(random.nextInt(caracteres.length())));
        }
        return sb.toString();
    }


    //cambiar la contraseña
    @PostMapping("/api/perfil/password")
    public String cambiarPassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam String newPassword,
            @RequestParam String confirmPassword
    ){
        Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();

        if(newPassword.equals(confirmPassword)){
            usuario.setPassword(passwordEncoder.encode(newPassword));
            usuarioRepository.save(usuario);
            return "redirect:/perfil?passChanged";
        } else {
            return "redirect:/perfil?error=passMismatch";
        }
    }

    //subir la imagen del avatar
    @PostMapping("/api/perfil/avatar")
    public String subirAvatar(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("archivo")MultipartFile archivo
    ){
        if(!archivo.isEmpty()){
            try{
                Usuario usuario = usuarioRepository.findByEmail(userDetails.getUsername()).orElseThrow();
                String nombreArchivo = UUID.randomUUID().toString() + "_" + archivo.getOriginalFilename();
                Path rutaDirectorio = Paths.get(uploadPath);
                Path rutaCompleta = rutaDirectorio.resolve(nombreArchivo);

                if(!Files.exists(rutaDirectorio)){
                    Files.createDirectories(rutaDirectorio);
                }

                // Guardar en la carpeta original (src)
                Files.copy(archivo.getInputStream(), rutaCompleta, StandardCopyOption.REPLACE_EXISTING);

                // Definimos la variable rutaTarget que faltaba
                Path rutaTarget = Paths.get("target/classes/static/img").resolve(nombreArchivo);

                if (Files.exists(rutaTarget.getParent())) Files.copy(archivo.getInputStream(), rutaTarget, StandardCopyOption.REPLACE_EXISTING);

                usuario.setAvatarUrl("/uploads/" + nombreArchivo);
                usuarioRepository.save(usuario);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
        return "redirect:/perfil";
    }

}