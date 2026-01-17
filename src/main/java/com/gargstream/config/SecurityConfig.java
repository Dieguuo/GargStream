package com.gargstream.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // 1. ENCRIPTADOR DE CONTRASEÑAS
    // Spring lo detecta y lo usa automáticamente.
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    // 2. FILTRO DE SEGURIDAD
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
                .authorizeHttpRequests(requests -> requests
                        // Recursos estáticos (CSS, JS, Imágenes)
                        .requestMatchers("/css/**", "/js/**", "/img/**", "/logo.svg", "/error/**").permitAll()

                        // Rutas Públicas: Inicio, Login, Registro y Detalles (para ver la sinopsis)
                        .requestMatchers("/", "/index", "/index.html", "/api/public/**", "/ver_detalle.html", "/register", "/login").permitAll()

                        // Rutas Privadas (Admin)
                        .requestMatchers("/admin.html", "/api/admin/**").hasAuthority("ADMIN")

                        // Resto protegido (Todo lo demás requiere login)
                        .anyRequest().authenticated()
                )
                // Formulario de login
                .formLogin(form -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/index.html", true) // Al entrar, te manda al inicio
                        .permitAll() // Todos pueden ver el login
                )
                // Cerrar sesión
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/index.html") // Al salir, te manda al inicio (modo invitado)
                        .permitAll()
                );

        http.csrf(csrf -> csrf.disable());

        return http.build();
    }
}