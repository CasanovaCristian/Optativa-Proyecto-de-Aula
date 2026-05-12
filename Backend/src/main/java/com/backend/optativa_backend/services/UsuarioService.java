package com.backend.optativa_backend.services;

import com.backend.optativa_backend.dtos.UsuarioCreateDTO;
import com.backend.optativa_backend.dtos.UsuarioDTO;
import com.backend.optativa_backend.entities.Usuario;
import com.backend.optativa_backend.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    public Optional<UsuarioDTO> login(String email, String password) {
        return usuarioRepository.findByEmail(email)
                .filter(u -> u.getPassword().equals(password) && Boolean.TRUE.equals(u.getActivo()))
                .map(this::convertToDTO);
    }

    public Object registrar(UsuarioCreateDTO dto) {
        if (usuarioRepository.findByEmail(dto.getEmail()).isPresent()) {
            return "EMAIL_DUPLICADO";
        }
        Usuario usuario = new Usuario();
        usuario.setNombre(dto.getNombre());
        usuario.setEmail(dto.getEmail());
        usuario.setPassword(dto.getPassword());
        usuario.setRol(dto.getRol() != null ? dto.getRol() : "EMPLEADO");
        usuario.setActivo(true);
        return convertToDTO(usuarioRepository.save(usuario));
    }

    public List<UsuarioDTO> obtenerTodos() {
        return usuarioRepository.findAll()
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public Optional<UsuarioDTO> obtenerPorId(Long id) {
        return usuarioRepository.findById(id).map(this::convertToDTO);
    }

    public Optional<UsuarioDTO> actualizar(Long id, UsuarioDTO dto) {
        return usuarioRepository.findById(id)
                .map(u -> {
                    u.setNombre(dto.getNombre());
                    u.setRol(dto.getRol());
                    u.setActivo(dto.getActivo());
                    return convertToDTO(usuarioRepository.save(u));
                });
    }

    public boolean eliminar(Long id) {
        if (!usuarioRepository.existsById(id)) return false;
        usuarioRepository.deleteById(id);
        return true;
    }

    public List<UsuarioDTO> obtenerPorRol(String rol) {
        return usuarioRepository.findByRol(rol)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<UsuarioDTO> obtenerActivos() {
        return usuarioRepository.findByActivo(true)
                .stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private UsuarioDTO convertToDTO(Usuario u) {
        UsuarioDTO dto = new UsuarioDTO();
        dto.setId(u.getId());
        dto.setNombre(u.getNombre());
        dto.setEmail(u.getEmail());
        dto.setRol(u.getRol());
        dto.setActivo(u.getActivo());
        dto.setFechaRegistro(u.getFechaRegistro());
        dto.setFechaActualizado(u.getFechaActualizado());
        return dto;
    }
}