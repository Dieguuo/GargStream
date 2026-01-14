package com.gargstream.service;

import com.gargstream.dto.DetallesTMDB;
import com.gargstream.dto.RespuestaTMDB;
import com.gargstream.model.Pelicula;
import com.gargstream.repository.ContenidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;


import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PeliculaService {

    private final ContenidoRepository contenidoRepository;
    private final AlmacenamientoService almacenamientoService;

    //la clave de la api tmdb
    @Value("${tmdb.api.key}")
    private String apiKey;

    //metodo que sube el archivo y descarga los datos
    public Pelicula guardarPelicula(String titulo, MultipartFile archivo, MultipartFile archivoSubtitulo){
        //guardar el archivo físico
        String nombreArchivo = almacenamientoService.store(archivo);
        String urlVideo = "/api/archivos/" + nombreArchivo;

        //crear el objeto película
        Pelicula pelicula = new Pelicula();
        pelicula.setTitulo(titulo);
        pelicula.setRutaVideo(urlVideo);

        //si se ponen subtitulos guardalos también
        if(archivoSubtitulo != null && !archivoSubtitulo.isEmpty()){
            String nombreSubtitulo = almacenamientoService.store(archivoSubtitulo);
            String urlSubtitulo = "/api/archivos/" + nombreSubtitulo;
            pelicula.setRutaSubtitulo(urlSubtitulo);
        }

        //conectarse a internet para poder llamar a la api y que busque los datos restantes
        RestTemplate restTemplate = new RestTemplate();

        //la url de búsqueda en tmdb
        // CORREGIDO: Aquí usamos el endpoint "search" y ponemos el título en "query"
        String urlBusqueda = "https://api.themoviedb.org/3/search/movie?api_key=" + apiKey + "&query=" + titulo + "&language=es-ES";

        try{
            //convertir el json a la clase java
            RespuestaTMDB respuesta = restTemplate.getForObject(urlBusqueda, RespuestaTMDB.class);

            //si hay varios resultados se coge el primero
            if(respuesta != null && respuesta.getResults() != null && !respuesta.getResults().isEmpty()){
                Long idTmdb= respuesta.getResults().getFirst().getIdTmdb();

                String urlDetalles = "https://api.themoviedb.org/3/movie/" + idTmdb + "?api_key=" + apiKey + "&language=es-ES&append_to_response=credits";

                DetallesTMDB datos = restTemplate.getForObject(urlDetalles, DetallesTMDB.class);

                //la fecha está en yyyymmdd, voy a sacar solo el año
                if(datos != null){
                    //mapear los datos básicos
                    pelicula.setSipnosis(datos.getSinopsis());
                    pelicula.setPuntuacionMedia(datos.getPuntuacionMedia());
                    pelicula.setDuracionMinutos(datos.getDuracion());

                    //la fecha está en yyyymmdd, sacar solo el año
                    if(datos.getFechaLanzamiento() != null && datos.getFechaLanzamiento().length() >=4){
                        pelicula.setAnioLanzamiento(Integer.parseInt(datos.getFechaLanzamiento().substring(0,4)));

                    }

                    //para la carátura hay que añadir la base de la url, ya que solo viene el fianl en la db
                    if(datos.getRutaPoster() != null){
                        String urlImagenCompleta = "https://image.tmdb.org/t/p/w500" + datos.getRutaPoster();
                        pelicula.setRutaCaratula(urlImagenCompleta);
                    }

                    //sacar el genero
                    if (datos.getGenres() != null){
                        String generosTexto = datos.getGenres().stream().map(DetallesTMDB.Genero::getName).collect(Collectors.joining(", "));
                        pelicula.setGenero(generosTexto);
                    }

                    //el director
                    if(datos.getCredits() != null && datos.getCredits().getCrew() != null){
                        for(DetallesTMDB.Personal persona : datos.getCredits().getCrew()){
                            if("Director".equals(persona.getJob())){
                                pelicula.setDirector(persona.getName());
                                break;
                            }
                        }
                    }
                }

            }

        }catch (Exception e){
            System.out.println("Error al buscar en TMDB: " + e.getMessage());
            //aunque falle el internet la película se guarda igual.
        }

        //gardarlo en la db
        return contenidoRepository.save(pelicula);

    }
}