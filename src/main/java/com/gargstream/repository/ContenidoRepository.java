package com.gargstream.repository;

import com.gargstream.model.Contenido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.*;

@Repository
public interface ContenidoRepository extends JpaRepository<Contenido, Long>{

    //buscar contenido cuyo título contenga el texto que se le ponga
    List<Contenido> findByTituloContainingIgnoreCase(String titulo);
    //para buscar por genero
    List<Contenido> findByGenero(String genero);
    //buscar los contenidos subidos más recientes
    List<Contenido> findAllByOrderByFechaSubidaDesc();

    //para las novedades
    //encuentra los top 10 ordenados por id descendiente.
    List<Contenido> findTop10ByOrderByIdDesc();

    //para que no coja capítulos de series para el carrusel
    @Query("SELECT c FROM Contenido c WHERE TYPE(c) <> Capitulo")
    List<Contenido> findAllSinCapitulos();

    //poner en el fuutro más métodos para buscar

}