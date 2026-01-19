package com.gargstream.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationFailureHandler;

import java.io.IOException;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // 1. ENCRIPTADOR DE CONTRASEÑAS
    // Spring lo detecta y lo usa automáticamente.
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    //manejador de errores
    @Bean
    public AuthenticationFailureHandler falloPersonalizadoHandler() {
        return new SimpleUrlAuthenticationFailureHandler() {
            @Override
            public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response, AuthenticationException exception) throws IOException, ServletException {

                // Por defecto, mandamos error genérico
                String redirectUrl = "/login?error=true";

                // Si la excepción es de tipo "Bloqueado"
                if (exception instanceof LockedException) {
                    redirectUrl = "/login?error=blocked";
                }

                super.setDefaultFailureUrl(redirectUrl);
                super.onAuthenticationFailure(request, response, exception);
            }
        };
    }

    // 2. FILTRO DE SEGURIDAD
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
                .authorizeHttpRequests(requests -> requests
                        // Recursos estáticos (CSS, JS, Imágenes) y Uploads (Carátulas)
                        .requestMatchers("/css/**", "/js/**", "/img/**", "/logo.svg", "/error/**", "/uploads/**").permitAll()

                        // Rutas Públicas: Inicio, Login, Registro, Detalles y H2 Console
                        .requestMatchers("/", "/index", "/index.html", "/api/public/**", "/api/archivos/**", "/ver_detalle.html", "/register", "/login", "/recuperar", "/h2-console/**").permitAll()

                        // Rutas Privadas (Admin)
                        .requestMatchers("/admin.html", "/api/admin/**").hasAuthority("ADMIN")

                        // Rutas Privadas (Funcionalidades de Usuario: Historial y Favoritos)
                        .requestMatchers("/api/historial/**", "/api/lista/**").authenticated()

                        // Resto protegido (Todo lo demás requiere login)
                        .anyRequest().authenticated()
                )
                // Formulario de login
                .formLogin(form -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/index.html", true) // Al entrar, te manda al inicio
                        .failureHandler(falloPersonalizadoHandler())
                        .permitAll() // Todos pueden ver el login
                )
                // Cerrar sesión
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/index.html") // Al salir, te manda al inicio (modo invitado)
                        .permitAll()
                );

        // Desactivar CSRF para que funcionen las peticiones POST de Javascript (Latido y Favoritos)
        http.csrf(csrf -> csrf.disable());

        // Permitir Frames (Necesario para que la consola H2 funcione)
        // CORRECCIÓN AQUÍ: Se usa una lambda dentro de frameOptions
        http.headers(headers -> headers.frameOptions(frame -> frame.disable()));

        return http.build();
    }
}