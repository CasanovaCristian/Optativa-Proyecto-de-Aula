package com.backend.optativa_backend.services;

import com.backend.optativa_backend.dtos.PrestamoCreateDTO;
import com.backend.optativa_backend.dtos.PrestamoDTO;
import com.backend.optativa_backend.entities.Implemento;
import com.backend.optativa_backend.entities.Prestamo;
import com.backend.optativa_backend.entities.Usuario;
import com.backend.optativa_backend.repositories.ImplementoRepository;
import com.backend.optativa_backend.repositories.PrestamoRepository;
import com.backend.optativa_backend.repositories.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PrestamoService {

    @Autowired
    private PrestamoRepository prestamoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ImplementoRepository implementoRepository;

    public List<PrestamoDTO> obtenerTodos() {
        return prestamoRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<PrestamoDTO> obtenerPorId(Long id) {
        return prestamoRepository.findById(id)
                .map(this::convertToDTO);
    }

    /**
     * Resultado posible:
     *  - "USUARIO_NO_ENCONTRADO"
     *  - "IMPLEMENTO_NO_ENCONTRADO"
     *  - "SIN_DISPONIBILIDAD"
     *  - PrestamoDTO (éxito)
     */
    public Object crear(PrestamoCreateDTO dto) {
        Usuario usuario = usuarioRepository.findById(dto.getUsuarioId()).orElse(null);
        if (usuario == null) return "USUARIO_NO_ENCONTRADO";

        Implemento implemento = implementoRepository.findById(dto.getImplementoId()).orElse(null);
        if (implemento == null) return "IMPLEMENTO_NO_ENCONTRADO";

        if (implemento.getCantidadDisponible() <= 0) return "SIN_DISPONIBILIDAD";

        Prestamo prestamo = new Prestamo();
        prestamo.setUsuario(usuario);
        prestamo.setImplemento(implemento);
        prestamo.setFechaDevolucionEsperada(dto.getFechaDevolucionEsperada());
        prestamo.setEstado("ACTIVO");
        prestamo.setObservaciones(dto.getObservaciones());

        implemento.setCantidadDisponible(implemento.getCantidadDisponible() - 1);
        implemento.setCantidadEnPrestamo(implemento.getCantidadEnPrestamo() + 1);
        implemento.setEstado(implemento.getCantidadDisponible() - 1 <= 0 ? "EN_PRESTAMO" : "DISPONIBLE");
        implemento.setFechaActualizado(LocalDateTime.now());
        implementoRepository.save(implemento);

        Prestamo saved = prestamoRepository.save(prestamo);
        return convertToDTO(saved);
    }

    /**
     * Resultado posible:
     *  - "NO_ENCONTRADO"
     *  - "NO_ACTIVO"
     *  - PrestamoDTO (éxito)
     */
    public Object registrarDevolucion(Long id) {
        Prestamo prestamo = prestamoRepository.findById(id).orElse(null);
        if (prestamo == null) return "NO_ENCONTRADO";
        if (!prestamo.getEstado().equals("ACTIVO")) return "NO_ACTIVO";

        LocalDateTime ahora = LocalDateTime.now();
        prestamo.setFechaDevolucionReal(ahora);
        prestamo.setEstado(ahora.isAfter(prestamo.getFechaDevolucionEsperada()) ? "VENCIDO" : "DEVUELTO");

        Implemento implemento = prestamo.getImplemento();
        implemento.setCantidadDisponible(implemento.getCantidadDisponible() + 1);
        implemento.setCantidadEnPrestamo(implemento.getCantidadEnPrestamo() - 1);
        implemento.setEstado(implemento.getCantidadDisponible() + 1 >= implemento.getCantidadTotal() ? "DISPONIBLE" : "EN_PRESTAMO");
        implemento.setFechaActualizado(LocalDateTime.now());
        implementoRepository.save(implemento);

        return convertToDTO(prestamoRepository.save(prestamo));
    }

    public boolean eliminar(Long id) {
        if (!prestamoRepository.existsById(id)) return false;
        prestamoRepository.deleteById(id);
        return true;
    }

    public List<PrestamoDTO> obtenerPorEstado(String estado) {
        return prestamoRepository.findByEstado(estado)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PrestamoDTO> obtenerPorUsuario(Long usuarioId) {
        return prestamoRepository.findByUsuarioId(usuarioId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<PrestamoDTO> obtenerPorImplemento(Long implementoId) {
        return prestamoRepository.findByImplementoId(implementoId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private PrestamoDTO convertToDTO(Prestamo prestamo) {
        PrestamoDTO dto = new PrestamoDTO();
        dto.setId(prestamo.getId());
        dto.setUsuarioId(prestamo.getUsuario().getId());
        dto.setUsuarioNombre(prestamo.getUsuario().getNombre());
        dto.setImplementoId(prestamo.getImplemento().getId());
        dto.setImplementoNombre(prestamo.getImplemento().getNombre());
        dto.setFechaPrestamo(prestamo.getFechaPrestamo());
        dto.setFechaDevolucionEsperada(prestamo.getFechaDevolucionEsperada());
        dto.setFechaDevolucionReal(prestamo.getFechaDevolucionReal());
        dto.setEstado(prestamo.getEstado());
        dto.setObservaciones(prestamo.getObservaciones());
        dto.setFechaCreado(prestamo.getFechaCreado());
        return dto;
    }
}