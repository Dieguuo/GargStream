package com.gargstream.service;

import com.gargstream.model.Contenido;
import com.gargstream.model.Usuario;
import com.gargstream.model.Valoracion;
import com.gargstream.repository.ContenidoRepository;
import com.gargstream.repository.UsuarioRepository;
import com.gargstream.repository.ValoracionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ValoracionService {

    private final ValoracionRepository valoracionRepository;
    private final ContenidoRepository contenidoRepository;
    private final UsuarioRepository usuarioRepository;

    @Transactional
    public Contenido votar(Long usuarioId, Long contenidoId, int nota) {
        if (nota < 1 || nota > 5) throw new RuntimeException("La nota debe ser entre 1 y 5");

        Usuario usuario = usuarioRepository.findById(usuarioId).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Contenido contenido = contenidoRepository.findById(contenidoId).orElseThrow(() -> new RuntimeException("Contenido no encontrado"));

        //comprobar si ya existe voto de este usuario y si no crea una nueva
        Valoracion valoracion = valoracionRepository.findByUsuarioAndContenido(usuario, contenido).orElse(new Valoracion());

        // actualizar los datos del voto
        valoracion.setUsuario(usuario);
        valoracion.setContenido(contenido);
        valoracion.setPuntuacion(nota);

        // guardar el voto en la tabla de valoraciones
        valoracionRepository.save(valoracion);

        // recalcular la media de los votos
        List<Valoracion> votos = valoracionRepository.findByContenido(contenido);

        double suma = 0;
        for (Valoracion v : votos) {
            suma += v.getPuntuacion();
        }

        double media = votos.isEmpty() ? 0.0 : suma / (double) votos.size();

        // redondear a un decimal
        media = Math.round(media * 10.0) / 10.0;

        // actualizar la película
        contenido.setPuntuacionMedia(media);
        contenido.setNotaPromedioLocal(media);
        contenido.setContadorVotos(votos.size());

        return contenidoRepository.save(contenido);
    }

    // para saber qué nota puso un usuario específico para pintar las estrellas amarillas al cargar
    public int obtenerMiVoto(Long usuarioId, Long contenidoId) {
        Usuario usuario = usuarioRepository.findById(usuarioId).orElse(null);
        Contenido contenido = contenidoRepository.findById(contenidoId).orElse(null);

        if (usuario != null && contenido != null) {
            return valoracionRepository.findByUsuarioAndContenido(usuario, contenido)
                    .map(Valoracion::getPuntuacion)
                    .orElse(0); // 0 es que no ha votado
        }
        return 0;
    }
}