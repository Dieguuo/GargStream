package com.gargstream.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

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
                    String idioma = video.path("iso_639_1").asText(); //lee el idioma del vídeo
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


    //métodos para buscar los caps de las series
    public Long buscarIdSerie(String nombreSerie){
        try{
            //codificar el nombre de la serie
            String query = URLEncoder.encode(nombreSerie, StandardCharsets.UTF_8);
            String url = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + query + "&language=es-ES";

            ResponseEntity<String> respuesta = restTemplate.getForEntity(url, String.class);
            JsonNode root = mapper.readTree(respuesta.getBody());
            JsonNode resultados = root.path("results");

            if (resultados.isArray() && resultados.size() > 0){
                //devolver el id de la primera coincidencia
                return resultados.get(0).path("id").asLong();
            }
        } catch (Exception e) {
            System.out.println("Error buscando el id de la serie en TMDB: " + e.getMessage());
        }
        return null;

    }

    //obtener los datos específicos de un cap
    public JsonNode obtenerDatosCapitulo(Long idSerieTmdb, Integer temporada, Integer capitulo){
        try {
            // el endpoint especídfico para episodios
            String url = "https://api.themoviedb.org/3/tv/" + idSerieTmdb + "/season/" + temporada + "/episode/" + capitulo + "?api_key=" + apiKey + "&language=es-ES";

            ResponseEntity<String> respuesta = restTemplate.getForEntity(url, String.class);
            return mapper.readTree(respuesta.getBody()); //devolver el json completo del cap
        } catch (Exception e) {
            System.out.println("Capítulo no encontrado en TMDB (" + temporada + "x" + capitulo + "): " + e.getMessage());
            return null;
        }
    }
}



















