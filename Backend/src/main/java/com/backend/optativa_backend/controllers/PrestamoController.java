package com.backend.optativa_backend.controllers;

import com.backend.optativa_backend.dtos.PrestamoCreateDTO;
import com.backend.optativa_backend.dtos.PrestamoDTO;
import com.backend.optativa_backend.services.PrestamoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/prestamos")
@CrossOrigin(origins = "http://127.0.0.1:5500")
public class PrestamoController {

    @Autowired
    private PrestamoService prestamoService;

    @GetMapping
    public ResponseEntity<List<PrestamoDTO>> obtenerTodos() {
        return ResponseEntity.ok(prestamoService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PrestamoDTO> obtenerPorId(@PathVariable Long id) {
        return prestamoService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PrestamoDTO> crear(@RequestBody PrestamoCreateDTO dto) {
        Object resultado = prestamoService.crear(dto);

        return switch (resultado.toString()) {
            case "USUARIO_NO_ENCONTRADO", "IMPLEMENTO_NO_ENCONTRADO" ->
                    ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
            case "SIN_DISPONIBILIDAD" ->
                    ResponseEntity.status(HttpStatus.CONFLICT).build();
            default ->
                    ResponseEntity.status(HttpStatus.CREATED).body((PrestamoDTO) resultado);
        };
    }

    @PutMapping("/{id}/devolver")
    public ResponseEntity<PrestamoDTO> registrarDevolucion(@PathVariable Long id) {
        Object resultado = prestamoService.registrarDevolucion(id);

        return switch (resultado.toString()) {
            case "NO_ENCONTRADO" -> ResponseEntity.notFound().build();
            case "NO_ACTIVO"     -> ResponseEntity.status(HttpStatus.CONFLICT).build();
            default              -> ResponseEntity.ok((PrestamoDTO) resultado);
        };
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return prestamoService.eliminar(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<PrestamoDTO>> obtenerPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(prestamoService.obtenerPorEstado(estado));
    }

    @GetMapping("/usuario/{usuarioId}")
    public ResponseEntity<List<PrestamoDTO>> obtenerPorUsuario(@PathVariable Long usuarioId) {
        return ResponseEntity.ok(prestamoService.obtenerPorUsuario(usuarioId));
    }

    @GetMapping("/implemento/{implementoId}")
    public ResponseEntity<List<PrestamoDTO>> obtenerPorImplemento(@PathVariable Long implementoId) {
        return ResponseEntity.ok(prestamoService.obtenerPorImplemento(implementoId));
    }
}