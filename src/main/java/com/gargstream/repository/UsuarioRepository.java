package com.gargstream.repository;

import com.gargstream.model.Contenido;
import com.gargstream.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    //SELECT * FROM usuarios WHERE email = ?
    Optional<Usuario> findByEmail(String email);

    List<Usuario> findByMiListaContains(Contenido contenido);
}
