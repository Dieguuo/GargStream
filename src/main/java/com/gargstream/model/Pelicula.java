package com.gargstream.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true) //para usar lombok con herencia es necesario
@DiscriminatorValue("PELICULA")//esto es lo que se va a guardar en la columna tipo_contenido
public class Pelicula extends Contenido{

    //el director
    private String director;
    //el año de lanzamiento
    private Integer anioLanzamiento;
    //la duracción en mins
    private Integer duracionMinutos;
    //puntuacion media
    private Double puntuacionMedia;
    //la ruta de la pelicula
    private String rutaVideo;

}
