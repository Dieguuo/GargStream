package com.gargstream.dto;

import com.gargstream.model.Contenido;
import lombok.Data;

@Data
public class HistorialDTO {
    private Contenido contenido;
    private Double segundosVistos;
    private Double duracionTotal;
    private Integer porcentaje;
    //para las temporadas
    private String informacionExtra;
}
