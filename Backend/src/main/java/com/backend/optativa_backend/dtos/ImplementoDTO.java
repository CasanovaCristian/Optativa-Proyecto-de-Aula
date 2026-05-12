package com.backend.optativa_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImplementoDTO {
    private Long id;
    private String nombre;
    private String categoria;
    private Integer cantidadTotal;
    private Integer cantidadDisponible;
    private Integer cantidadEnPrestamo;
    private String condicion;
    private String estado;
    private String observaciones;
    private LocalDateTime fechaCreado;
    private LocalDateTime fechaActualizado;
}
