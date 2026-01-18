package com.gargstream.model;


import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Historial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "contenido_id")
    private Contenido contenido;

    private Double segundosVistos;

    private Double duracionTotal;

    private LocalDateTime fechaUltimaVisualizacion;

    @PrePersist
    @PreUpdate
    public void actualizarFecha(){
        this.fechaUltimaVisualizacion = LocalDateTime.now();
    }
}
