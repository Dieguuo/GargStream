package com.gargstream.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data//los data hace que no haya que escribir los getter y setters manualmente
@Inheritance(strategy = InheritanceType.JOINED)
@Table(name = "contenidos")
public abstract class Contenido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)//autoincrement
    private Long id;

    @Column(nullable = false)
    private String titulo;
    //la sipnosis
    @Column(length = 3000)
    private String sipnosis;
    //imagen de la portada
    @Column(length = 1000)
    private String rutaCaratula;
    @Column(length = 1000)
    private String rutaFondo;
    //genero del contenido
    private String genero;
    //para la fecha de subida
    private LocalDateTime fechaSubida;

    //media de tmdb
    private Double puntuacionMedia;

    //medias locales
    private Double notaPromedioLocal = 0.0;
    private Integer contadorVotos = 0;

    //trailer
    @Column(name = "youtube_trailer_id")
    private String youtubeTrailerId;
    //lsita de subtitulos
    @OneToMany(mappedBy = "contenido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Subtitulo> subtitulos = new ArrayList<>();


    @PrePersist
    public void alCrear(){
        this.fechaSubida = LocalDateTime.now();
    }
}