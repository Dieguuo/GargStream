package com.gargstream.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class TmdbService {

    //la clave de la api tmdb
    @Value("${tmdb.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    //metodo para pdoer buscar el trailer
    public String obtenerTrailer(Long tmdbId, String tipoContenido){
        if(tmdbId == null){
            return null;
        }

        try{
            //la url para pedir los vídeos
            String url = "https://api.themoviedb.org/3/" + tipoContenido + "/" + tmdbId + "/videos?api_key=" + apiKey + "&include_video_language=es,en";

            ResponseEntity<String> respuesta = restTemplate.getForEntity(url, String.class);

            //leer el json
            JsonNode root = mapper.readTree(respuesta.getBody());
            JsonNode resultados = root.path("results");

            //variable para guardar el trailer en inglés
            String trailerEnIngles = null;

            //recorrer los vídeos encontrados
            if(resultados.isArray()){
                for(JsonNode video : resultados){
                    String sitio = video.path("site").asText();
                    String tipo = video.path("type").asText();
                    String idioma = video.path("iso_639_1").asText(); //Lee el idioma del vídeo
                    //buscar el trailer en youtube
                    if("YouTube".equalsIgnoreCase(sitio) && "Trailer".equalsIgnoreCase(tipo)){
                        //coger el trailer en español
                        if("es".equalsIgnoreCase(idioma)){
                            return video.path("key").asText();
                        }
                        //si no coger el de ingles
                        if("en".equalsIgnoreCase(idioma) && trailerEnIngles == null){
                            trailerEnIngles = video.path("key").asText();
                        }

                    }


                }
            }

            //devolver el trailer en inglés si no se ha devuelto el de español
            return trailerEnIngles;


        } catch (Exception e) {
            System.out.println("Error buscando el trailer en tmdb: " +e.getMessage());
            return null;
        }
    }
}
