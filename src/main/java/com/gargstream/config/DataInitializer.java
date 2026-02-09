/*package com.gargstream.config;

import com.gargstream.model.Rol;
import com.gargstream.model.Usuario;
import com.gargstream.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        return args -> {

            // email del admin
            String emailAdmin = "admin@gargstream.es";

            // comprobar si existe ya
            Usuario admin = usuarioRepository.findByEmail(emailAdmin).orElse(null);

            if (admin == null) {
                // si no existe crearlo de 0.
                admin = new Usuario();
                admin.setEmail(emailAdmin);
                admin.setNombre("Administrador");
                admin.setFechaRegistro(LocalDate.now());
            }

            // contraseña
            admin.setPassword(passwordEncoder.encode("1234"));

            // rol de admin
            admin.setRol(Rol.ADMIN);

            // está desbloqueado
            admin.setBloqueado(false);

            //avatar por defecto
            admin.setAvatarUrl("/img/avatars/5.png");

            // guardarlo
            usuarioRepository.save(admin);
        };
    }
}*/