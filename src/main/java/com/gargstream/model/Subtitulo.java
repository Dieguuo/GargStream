package com.gargstream.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "subtitulos")
public class Subtitulo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    //el idioma
    private String idioma;
    //nombre que se muestra al usuario
    private String etiqueta;
    //la ruta del archivo físico del subtitulo
    private String rutaArchivo;

    //muchos subs pertenencen a un contenido
    @ManyToOne
    @JoinColumn(name = "contenido_id")
    @JsonIgnore//para que no entre en bucle infinito
    private Contenido contenido;

    //muchos subs pertenencen a un capitulo
    @ManyToOne
    @JoinColumn(name = "capitulo_id")
    @JsonIgnore//para que no entre en bucle infinito
    private Capitulo capitulo;
}
