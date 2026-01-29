package com.gargstream.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDate;

@Data
@AllArgsConstructor
public class UsuarioDTO {

    //los datos que se van a enviar del usuario para la web.
    // no pongo la contraseña porque es una falta de seguridad bastante grande.
    private Long id;
    private String nombre;
    private String email;
    private String rol;
    private String avatarUrl;
    private LocalDate fechaRegistro;
    private boolean bloqueado;
}
