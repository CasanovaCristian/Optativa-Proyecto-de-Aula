package com.backend.optativa_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PrestamoCreateDTO {
    private Long usuarioId;
    private Long implementoId;
    private LocalDateTime fechaDevolucionEsperada;
    private String observaciones;
}
