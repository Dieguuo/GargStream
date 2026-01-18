package com.gargstream.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios")
@Data//getter setter
@NoArgsConstructor//constructor vacío
@AllArgsConstructor// "" con parámetros
public class Usuario {
    //el id
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)//autoincremento
    private long id;
    //el email
    @Column(unique = true, nullable = false)//para que sea único y que no pueda estar vacío
    private String email;
    //la contraseña
    @Column(nullable = false)
    private String password;
    //nombre
    private String nombre;
    //la ruta del avatar
    private String avatarUrl;
    //el rol que tiene el usuario
    @Enumerated(EnumType.STRING)
    private Rol rol;

    //para verificare el email
    private String codigoVerificacion;
    private LocalDateTime expiracionCodigo;
    private String nuevoEmailPendiente;

    //fecha en la que se registra un usuario
    private LocalDate fechaRegistro;

    @PrePersist
    public void prePersist() {
        if (this.fechaRegistro == null) {
            this.fechaRegistro = LocalDate.now(); // pone la fecha de hoy
        }
    }

}

