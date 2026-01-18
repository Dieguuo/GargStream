package com.gargstream.service;


import com.gargstream.model.Contenido;
import com.gargstream.model.Historial;
import com.gargstream.model.Usuario;
import com.gargstream.repository.ContenidoRepository;
import com.gargstream.repository.HistorialRepository;
import com.gargstream.repository.UsuarioRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class HistorialService {

    private final HistorialRepository historialRepository;
    private final UsuarioRepository usuarioRepository;
    private final ContenidoRepository contenidoRepository;

    @Transactional
    public void registrarLatido(String emailUsuario, Long idContenido, Double segundos, Double total){

        Usuario usuario = usuarioRepository.findByEmail(emailUsuario).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        Contenido contenido = contenidoRepository.findById(idContenido).orElseThrow(() -> new RuntimeException("Contenido no encontrado."));

        //bucar si ya existe el historial para actualizarlo.
        Historial historial = historialRepository.findByUsuarioAndContenido(usuario, contenido).orElseGet(() -> {
            //si no existe crear un nuevo
            Historial nuevo = new Historial();
            nuevo.setUsuario(usuario);
            nuevo.setContenido(contenido);
            return nuevo;
        });

        //actualizar los datos
        historial.setSegundosVistos(segundos);
        historial.setDuracionTotal(total);
        historial.setFechaUltimaVisualizacion(LocalDateTime.now());

        //guardarlo en la bd
        historialRepository.save(historial);

    }
}
