package com.gargstream.config;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
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
import org.springframework.security.core.userdetails.UserDetailsService;

import java.io.IOException;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // encriptador de contraseñas
    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    //para buscar los usuarios para recordarlo
    @Autowired
    private UserDetailsService userDetailsService;

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

    // filtros de segurididad
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception{
        http
                .authorizeHttpRequests(requests -> requests
                        // recursos estáticos y uploads
                        .requestMatchers("/css/**", "/js/**", "/img/**", "/logo.svg", "/error/**", "/uploads/**").permitAll()

                        // rutas públicas
                        .requestMatchers("/", "/index", "/index.html", "/api/public/**", "/api/archivos/**", "/ver_detalle.html", "/register", "/login", "/recuperar", "/h2-console/**").permitAll()

                        // rutas provadas admin
                        .requestMatchers("/admin", "/api/admin/**").hasAuthority("ADMIN")

                        .requestMatchers("/api/historial/**", "/api/lista/**").authenticated()

                        // todo lo demás requiere el logueo
                        .anyRequest().authenticated()
                )
                // formulario de login
                .formLogin(form -> form
                        .loginPage("/login")
                        .defaultSuccessUrl("/index.html", true) // al entrar, te manda al inicio
                        .failureHandler(falloPersonalizadoHandler())
                        .permitAll() // Todos pueden ver el login
                )

                .rememberMe((remember) -> remember
                        .key("claveSecretaGargStream") // clave única para firmar la cookie
                        .tokenValiditySeconds(604800) // 7 días de duración
                        .rememberMeParameter("remember-me") // nombre del checkbox en el html
                        .userDetailsService(userDetailsService) // servicio para recargar al usuario
                )

                // cerrar sesión
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/index.html") // al salir, te manda al inicio en modo invitado
                        .permitAll()
                );

        http.csrf(csrf -> csrf
                .ignoringRequestMatchers("/h2-console/**") // Ignoramos H2 porque da problemas
        );

        http.headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()));



        return http.build();
    }
}