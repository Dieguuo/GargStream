package com.gargstream.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Usuario implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String nombre;
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    private Rol rol;

    private String codigoVerificacion;
    private LocalDateTime expiracionCodigo;
    private String nuevoEmailPendiente;

    private LocalDate fechaRegistro;

    private boolean bloqueado = false;

    // --- MÉTODOS DE SEGURIDAD (AQUÍ ESTABA EL PROBLEMA) ---

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(rol.name()));
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    // 1. CONTROL DE BLOQUEO (Correcto, usas tu variable)
    @Override
    public boolean isAccountNonLocked() {
        return !this.bloqueado;
    }

    // 2. ¿CUENTA CADUCADA? (Faltaba: devolver true)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // 3. ¿CONTRASEÑA CADUCADA? (Faltaba: devolver true)
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // 4. ¿USUARIO HABILITADO? (Faltaba: devolver true)
    // Sin esto, Spring piensa que el usuario está "apagado"
    @Override
    public boolean isEnabled() {
        return true;
    }

    // --- TRIGGER FECHA ---
    @PrePersist
    public void prePersist() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = LocalDate.now();
        }
    }
}