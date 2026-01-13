package com.gargstream.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import java.util.*;

@Entity
@Data
@EqualsAndHashCode(callSuper = true)
@DiscriminatorValue("SERIE")
public class Serie extends Contenido{

    //creador de la serie
    private String creador;
    //año de inicio
    private Integer anioInicio;
    //año en el que ha terminado (si lo ha hecho)
    private Integer anioFin;

    //hacer la relación, ya que una serie puede tener muchas temporadas
    @OneToMany(mappedBy = "serie", cascade = CascadeType.ALL)//casacade all para que si se borra la serie se borren las temporadas.
    private List<Temporada> temporadas;

    //puntuacion media
    private Double puntuacionMedia;


}
