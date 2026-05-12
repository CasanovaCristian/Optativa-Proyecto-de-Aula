package com.backend.optativa_backend.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "implementos")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Implemento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 50)
    private String categoria; // Fútbol, Baloncesto, Voleibol, etc

    @Column(nullable = false)
    private Integer cantidadTotal;

    @Column(nullable = false)
    private Integer cantidadDisponible;

    @Column(nullable = false)
    private Integer cantidadEnPrestamo = 0;

    @Column(nullable = false, length = 50)
    private String condicion; // Excelente, Buena, Regular

    @Column(nullable = false, length = 50)
    private String estado; // DISPONIBLE, EN_PRESTAMO, MANTENIMIENTO

    @Column(length = 255)
    private String observaciones;

    @Column(name = "fecha_creado", nullable = false, updatable = false)
    private LocalDateTime fechaCreado = LocalDateTime.now();

    @Column(name = "fecha_actualizado")
    private LocalDateTime fechaActualizado = LocalDateTime.now();
}
