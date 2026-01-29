package com.gargstream.repository;

import com.gargstream.model.Contenido;
import com.gargstream.model.Historial;
import com.gargstream.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.Optional;

public interface HistorialRepository extends JpaRepository<Historial, Long> {

    //para saber si existe ya un registro del usuario y contenido
    Optional<Historial> findByUsuarioAndContenido(Usuario usuario, Contenido contenido);

    //para dar las últimas 10 cosas para ponerlas en la fila de seguir viendo
    List<Historial> findTop10ByUsuarioOrderByFechaUltimaVisualizacionDesc(Usuario usuario);

    @Transactional // necesario para operaciones de borrado
    void deleteByContenido(Contenido contenido);

    void deleteByUsuarioAndContenidoId(Usuario usuario, Long contenidoId);

}
