package com.gargstream.repository;


import com.gargstream.model.Contenido;
import com.gargstream.model.Usuario;
import com.gargstream.model.Valoracion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ValoracionRepository extends JpaRepository<Valoracion, Long> {

    //buscar el voto específico de un usuario en una película para que no se pueda vota doble
    Optional<Valoracion> findByUsuarioAndContenido(Usuario usuario, Contenido contenido);

    // Obtener todos los votos de una película (para calcular la media)
    List<Valoracion> findByContenido(Contenido contenido);





}
