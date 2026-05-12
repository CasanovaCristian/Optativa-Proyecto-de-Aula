package com.backend.optativa_backend.repositories;

import com.backend.optativa_backend.entities.Implemento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ImplementoRepository extends JpaRepository<Implemento, Long> {
    List<Implemento> findByCategoria(String categoria);
    List<Implemento> findByEstado(String estado);
    List<Implemento> findByNombreContainingIgnoreCase(String nombre);
}
