package com.gargstream.service;

import com.gargstream.dto.RespuestaTMDB;
import com.gargstream.dto.DetallesTMDB;
import com.gargstream.model.Capitulo;
import com.gargstream.model.Serie;
import com.gargstream.model.Temporada;
import com.gargstream.repository.ContenidoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;


import java.util.ArrayList;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class SerieService {

    private final ContenidoRepository contenidoRepository;
    private final AlmacenamientoService almacenamientoService;
    private final TmdbService tmdbService;

    @Value("${tmdb.api.key}")
    private String apiKey;

    //pedir solo el nombre para crear la carpeta de la serie
    public Serie crearSerie(String nombreBusqueda){
        Serie serie = new Serie();
        serie.setTitulo(nombreBusqueda);//por si no se encuentra en internet que se guarde con ese nombre
        // inicializar lista de temporadas
        serie.setTemporadas((new ArrayList<>()));

        RestTemplate restTemplate = new RestTemplate();
        //buscar la serie
        String urlBusqueda = "https://api.themoviedb.org/3/search/tv?api_key=" + apiKey + "&query=" + nombreBusqueda + "&language=es-ES";

        try{
            RespuestaTMDB respuesta = restTemplate.getForObject(urlBusqueda, RespuestaTMDB.class);

            if(respuesta != null && respuesta.getResults() != null && !respuesta.getResults().isEmpty()){

                //cargar el primer resultado
                RespuestaTMDB.DatosPelicula datosBasicos = respuesta.getResults().getFirst();
                Long idTmdb = datosBasicos.getIdTmdb();


                //buscar el trailer con el id de la serie
                String idTrailer = tmdbService.obtenerTrailer(idTmdb, "tv");
                if(idTrailer != null){
                    serie.setYoutubeTrailerId(idTrailer);
                }

                //sacar los detalles
                String urlDetalles = "https://api.themoviedb.org/3/tv/" + idTmdb + "?api_key=" + apiKey + "&language=es-ES";

                DetallesTMDB detalles = restTemplate.getForObject(urlDetalles, DetallesTMDB.class);

                if(detalles != null){
                    //el nombre
                    if(datosBasicos.getName() != null){
                        serie.setTitulo(datosBasicos.getName());
                    }

                    //sinopsis
                    serie.setSipnosis(detalles.getSinopsis());
                    //puntuación media
                    serie.setPuntuacionMedia(detalles.getPuntuacionMedia());


                    //fecha inicio
                    if(detalles.getFechaInicio() != null && detalles.getFechaInicio().length() >= 4){
                        serie.setAnioInicio(Integer.parseInt(detalles.getFechaInicio().substring(0,4)));
                    }
                    //fecha fin
                    if(detalles.getFechaFin() != null && detalles.getFechaFin().length() >= 4){
                        serie.setAnioFin(Integer.parseInt(detalles.getFechaFin().substring(0,4)));
                    }

                    //géneros
                    if(detalles.getGenres() != null){
                        String generosTexto = detalles.getGenres().stream().map(DetallesTMDB.Genero::getName).collect(Collectors.joining(", "));
                        serie.setGenero(generosTexto);
                    }

                    //creador
                    if(detalles.getCreadores() != null){
                        String creadoresTexto = detalles.getCreadores().stream().map(DetallesTMDB.Creador::getName).collect(Collectors.joining(", "));
                        serie.setCreador(creadoresTexto);
                    }


                    //caracutla
                    if(detalles.getRutaPoster() != null){
                        serie.setRutaCaratula("https://image.tmdb.org/t/p/w500" + detalles.getRutaPoster());

                    }

                    //imagen de fondo
                    if(detalles.getRutaFondo() != null){
                        serie.setRutaFondo("https://image.tmdb.org/t/p/original" + detalles.getRutaFondo());
                    }

                    //si me da tiempo, añadir función de descargar series

                }

            }
        }catch (Exception e){
            System.out.println("Error buscando la serie: "+e.getMessage());
        }

        return contenidoRepository.save(serie);

    }

    //método para añadir los capitulos
    public Capitulo agregarCapitulo(Long idSerie, Integer numTemporada, Integer numCapitulo, String tituloCapitulo, MultipartFile archivo, MultipartFile archivoSubtitulo){
        //buscar la serie en la base de datos
        Serie serie = (Serie) contenidoRepository.findById(idSerie).orElseThrow(() -> new RuntimeException("No se ha encontrado la serie"));

        //por si la lsita es nula la inicializo para evitar errores
        if (serie.getTemporadas() == null) {
            serie.setTemporadas(new ArrayList<>());
        }

        //busca si ya existe la temporada y si no la crea
        Temporada temporada = serie.getTemporadas().stream().filter(t -> t.getNumeroTemporada().equals(numTemporada)).findFirst().orElseGet(() -> {
            Temporada nueva = new Temporada();
            nueva.setNumeroTemporada(numTemporada);
            nueva.setSerie(serie);
            serie.getTemporadas().add(nueva);
            return nueva;
        });

        //guardar el archivo
        String nombreArchivo = almacenamientoService.store(archivo);
        String urlvideo = "/api/archivos/" + nombreArchivo;

        //crear el objeto cap
        Capitulo capitulo = new Capitulo();
        capitulo.setNumeroCapitulo(numCapitulo);
        capitulo.setTitulo(tituloCapitulo);
        capitulo.setRutaVideo(urlvideo);
        capitulo.setTemporada(temporada);

        //añadirlo a la lista de la temp
        temporada.getCapitulos().add(capitulo);

        //añadir subtitulos si los hay
        if(archivoSubtitulo != null && !archivoSubtitulo.isEmpty()){
            String nombreSubtitulo = almacenamientoService.store(archivoSubtitulo);
            String urlSubtitulo = "/api/archivos/" + nombreSubtitulo;

            // crearel objeto subtitulo
            com.gargstream.model.Subtitulo sub = new com.gargstream.model.Subtitulo();
            sub.setRutaArchivo(urlSubtitulo);
            sub.setIdioma("es");
            sub.setEtiqueta("Español");
            sub.setCapitulo(capitulo); //y se vincula a capitulo

            // guardarlo
            capitulo.getSubtitulos().add(sub);
        }

        //guardar la serie
        contenidoRepository.save(serie);

        return capitulo;
    }
}