package com.gargstream.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "capitulos")
public class Capitulo {

    //el id del cap
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    //el num del cap
    private Integer numeroCapitulo;
    //el título
    private String titulo;
    //resumen del cap
    @Column(length = 2000)
    private String sipnosis;
    //duración
    private Integer duracionMinutos;
    //la caratula del cap
    private String rutaCaratula;
    //ruta del cap
    private String rutaVideo;

    //muchos capitulos solo a una temporada
    @ManyToOne
    @JoinColumn(name = "temporada_id")
    @JsonIgnore//evita el bucle infinito
    private Temporada temporada;

    //lista de subtitulos
    @OneToMany(mappedBy = "capitulo", cascade = CascadeType.ALL, orphanRemoval = true)
    private java.util.List<Subtitulo> subtitulos = new java.util.ArrayList<>();


}
