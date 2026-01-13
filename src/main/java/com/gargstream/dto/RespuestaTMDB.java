package com.gargstream.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.*;

@Data
@JsonIgnoreProperties(ignoreUnknown = true) //para que si la tmdb manda campos extra los ignore
public class RespuestaTMDB {

    //tmdb duevuelve una lista de los resultados dentro de un campo que se llama results
    private List<DatosPelicula> results;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DatosPelicula{
        private String title;

        @JsonProperty("overview")
        private String sinopsis;

        @JsonProperty("release_date")
        private String fechaLanzamiento;

        @JsonProperty("poster_path")
        private String rutaPoster;

        @JsonProperty("vote_average")
        private Double puntuacionMedia;
        //el id en la db de tmdb
        @JsonProperty("id")
        private Long idTmdb;
    }
}
