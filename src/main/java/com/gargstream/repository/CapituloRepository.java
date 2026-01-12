package com.gargstream.repository;

import com.gargstream.model.Capitulo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CapituloRepository extends JpaRepository<Capitulo, Long>{
    //métodos base
}
