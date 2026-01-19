package com.gargstream.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "capitulos")
public class Capitulo extends Contenido{

    //el num del cap
    private Integer numeroCapitulo;
    //la ruta del vídeo
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
