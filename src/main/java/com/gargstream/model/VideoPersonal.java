package com.gargstream.model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@DiscriminatorValue("VIDEO")
public class VideoPersonal extends Contenido{

    //nombre del que lo ha subido
    private String autor;
    //ruta del video
    private String rutaVideo;
}
