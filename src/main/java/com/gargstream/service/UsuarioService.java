package com.gargstream.service;

import com.gargstream.model.Usuario;
import com.gargstream.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public Usuario buscarPorEmail(String email) {
        // el métdo findByEmail del repo
        Optional<Usuario> optionalUsuario = usuarioRepository.findByEmail(email);

        return optionalUsuario.orElse(null);
    }
}