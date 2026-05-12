package com.backend.optativa_backend.services;

import com.backend.optativa_backend.dtos.ImplementoCreateDTO;
import com.backend.optativa_backend.dtos.ImplementoDTO;
import com.backend.optativa_backend.entities.Implemento;
import com.backend.optativa_backend.repositories.ImplementoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ImplementoService {

    @Autowired
    private ImplementoRepository implementoRepository;

    public List<ImplementoDTO> obtenerTodos() {
        return implementoRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<ImplementoDTO> obtenerPorId(Long id) {
        return implementoRepository.findById(id)
                .map(this::convertToDTO);
    }

    public ImplementoDTO crear(ImplementoCreateDTO dto) {
        Implemento implemento = new Implemento();
        implemento.setNombre(dto.getNombre());
        implemento.setCategoria(dto.getCategoria());
        implemento.setCantidadTotal(dto.getCantidadTotal());
        implemento.setCantidadDisponible(dto.getCantidadTotal());
        implemento.setCantidadEnPrestamo(0);
        implemento.setCondicion(dto.getCondicion());
        implemento.setEstado(dto.getEstado());
        implemento.setObservaciones(dto.getObservaciones());
        implemento.setImagenBase64(dto.getImagenBase64());
        implemento.setPrecioDia(dto.getPrecioDia());
        implemento.setPrecioHora(dto.getPrecioHora());
        implemento.setMarca(dto.getMarca());
        implemento.setTalla(dto.getTalla());

        return convertToDTO(implementoRepository.save(implemento));
    }

    public Optional<ImplementoDTO> actualizar(Long id, ImplementoDTO dto) {
        return implementoRepository.findById(id)
                .map(implemento -> {
                    implemento.setNombre(dto.getNombre());
                    implemento.setCategoria(dto.getCategoria());
                    implemento.setCantidadTotal(dto.getCantidadTotal());
                    implemento.setCondicion(dto.getCondicion());
                    implemento.setEstado(dto.getEstado());
                    implemento.setObservaciones(dto.getObservaciones());
                    implemento.setFechaActualizado(LocalDateTime.now());
                    implemento.setImagenBase64(dto.getImagenBase64());
                    implemento.setPrecioDia(dto.getPrecioDia());
                    implemento.setPrecioHora(dto.getPrecioHora());
                    implemento.setMarca(dto.getMarca());
                    implemento.setTalla(dto.getTalla());

                    return convertToDTO(implementoRepository.save(implemento));
                });
    }

    public boolean eliminar(Long id) {
        if (!implementoRepository.existsById(id)) return false;
        implementoRepository.deleteById(id);
        return true;
    }

    public List<ImplementoDTO> obtenerPorCategoria(String categoria) {
        return implementoRepository.findByCategoria(categoria)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ImplementoDTO> obtenerPorEstado(String estado) {
        return implementoRepository.findByEstado(estado)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ImplementoDTO> buscarPorNombre(String nombre) {
        return implementoRepository.findByNombreContainingIgnoreCase(nombre)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private ImplementoDTO convertToDTO(Implemento implemento) {
        ImplementoDTO dto = new ImplementoDTO();
        dto.setId(implemento.getId());
        dto.setNombre(implemento.getNombre());
        dto.setCategoria(implemento.getCategoria());
        dto.setCantidadTotal(implemento.getCantidadTotal());
        dto.setCantidadDisponible(implemento.getCantidadDisponible());
        dto.setCantidadEnPrestamo(implemento.getCantidadEnPrestamo());
        dto.setCondicion(implemento.getCondicion());
        dto.setEstado(implemento.getEstado());
        dto.setObservaciones(implemento.getObservaciones());
        dto.setFechaCreado(implemento.getFechaCreado());
        dto.setFechaActualizado(implemento.getFechaActualizado());
        dto.setImagenBase64(implemento.getImagenBase64());
        dto.setPrecioDia(implemento.getPrecioDia());
        dto.setPrecioHora(implemento.getPrecioHora());
        dto.setMarca(implemento.getMarca());
        dto.setTalla(implemento.getTalla());

        return dto;
    }
}