package com.backend.optativa_backend.repositories;

import com.backend.optativa_backend.entities.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    java.util.List<Usuario> findByActivo(Boolean activo);
    java.util.List<Usuario> findByRol(String rol);
}
