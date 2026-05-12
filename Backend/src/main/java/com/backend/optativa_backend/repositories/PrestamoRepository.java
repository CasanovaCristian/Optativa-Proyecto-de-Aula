package com.backend.optativa_backend.repositories;

import com.backend.optativa_backend.entities.Prestamo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrestamoRepository extends JpaRepository<Prestamo, Long> {
    List<Prestamo> findByEstado(String estado);
    List<Prestamo> findByUsuarioId(Long usuarioId);
    List<Prestamo> findByImplementoId(Long implementoId);
}
