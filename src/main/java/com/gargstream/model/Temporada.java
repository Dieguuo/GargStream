package com.gargstream.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import java.util.*;


@Entity
@Data
@Table(name = "temporadas")
public class Temporada {

    //el id de la temp
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    //el número de la temp que sea
    private Integer numeroTemporada;
    //por si la temporada tiene nombre
    private String nombre;
    //muchas temporadas solo pertenecen a una serie
    @ManyToOne
    @JoinColumn(name = "serie_id")
    @JsonIgnore //evita un bucle infinito
    private Serie serie;

    //una temporada puede tener muchos capítulos
    @OneToMany(mappedBy = "temporada", cascade = CascadeType.ALL)
    private List<Capitulo> capitulos = new ArrayList<>();
}
