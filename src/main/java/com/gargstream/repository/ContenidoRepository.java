package com.gargstream.repository;

import com.gargstream.model.Contenido;
import org.springframework.data.jpa.repository.JpaRepository;
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

    //poner en el fuutro más métodos para buscar

}