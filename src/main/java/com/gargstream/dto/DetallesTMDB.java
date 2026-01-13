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


    //DATOS SERIES
    @JsonProperty("first_air_date")
    private String fechaInicio; //primer cap

    @JsonProperty("last_air_date")
    private String fechaFin; //último cap

    @JsonProperty("created_by")
    private List<Creador> creadores; //lista de los nombres de los creadores

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

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Creador{
        private String name;
    }

}
