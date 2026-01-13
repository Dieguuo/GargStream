package com.gargstream.dto;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.*;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class DetallesTMDB {

    //datos básicos por si acaso
    private String title;

    @JsonProperty("overview")
    private String sinopsis;

    @JsonProperty("release_date")
    private String fechaLanzamiento;

    @JsonProperty("poster_path")
    private String rutaPoster;

    @JsonProperty("vote_average")
    private Double puntuacionMedia;

    //datos nuevos
    @JsonProperty("runtime")
    private Integer duracion;
    //generos
    private List<Genero> genres;
    //director
    private Creditos credits;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Genero{
        private String name;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Creditos{
        private List<Personal> crew;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Personal{
        private String job; //el director, escritor...
        private String name; //el nombre real
    }

}
