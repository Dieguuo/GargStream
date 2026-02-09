package com.gargstream.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    //recuperar contraseña
    private String codigoRecuperacion;
    private LocalDateTime expiracionRecuperacion;

    // metodos de seguridad

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(rol.name()));
    }

    @Override
    public String getUsername() {
        return this.email;
    }

    // control de bloqueo
    @Override
    public boolean isAccountNonLocked() {
        return !this.bloqueado;
    }

    // cuanta caducada
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // contraseña caducada
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // usuario inhabilitado
    @Override
    public boolean isEnabled() {
        return true;
    }


    @PrePersist
    public void prePersist() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = LocalDate.now();
        }
    }

    //relación con historial para borrado en cascada
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Historial> historial = new ArrayList<>();

    //relación con valoraciones para borrado en cascada
    @OneToMany(mappedBy = "usuario", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Valoracion> valoraciones = new ArrayList<>();

    //la relación de la lista de favoritos
    //una tabla intermedia usuario_favoritos
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "usuario_favoritos",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "contenido_id")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    //mejor usar set para que no haya duplicados
    private Set<Contenido> miLista = new HashSet<>();
}