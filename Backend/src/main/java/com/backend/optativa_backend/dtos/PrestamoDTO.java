package com.backend.optativa_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrestamoDTO {
    private Long id;
    private Long usuarioId;
    private String usuarioNombre;
    private Long implementoId;
    private String implementoNombre;
    private LocalDateTime fechaPrestamo;
    private LocalDateTime fechaDevolucionEsperada;
    private LocalDateTime fechaDevolucionReal;
    private String estado;
    private String observaciones;
    private LocalDateTime fechaCreado;
}
