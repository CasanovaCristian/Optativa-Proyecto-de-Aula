package com.backend.optativa_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ImplementoCreateDTO {
    private String nombre;
    private String categoria;
    private Integer cantidadTotal;
    private String condicion;
    private String estado;
    private String observaciones;
}
