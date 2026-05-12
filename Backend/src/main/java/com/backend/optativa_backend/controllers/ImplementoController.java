package com.backend.optativa_backend.controllers;

import com.backend.optativa_backend.dtos.ImplementoCreateDTO;
import com.backend.optativa_backend.dtos.ImplementoDTO;
import com.backend.optativa_backend.services.ImplementoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/implementos")
@CrossOrigin(origins = "http://127.0.0.1:5500")
public class ImplementoController {

    @Autowired
    private ImplementoService implementoService;

    @GetMapping
    public ResponseEntity<List<ImplementoDTO>> obtenerTodos() {
        return ResponseEntity.ok(implementoService.obtenerTodos());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ImplementoDTO> obtenerPorId(@PathVariable Long id) {
        return implementoService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ImplementoDTO> crear(@RequestBody ImplementoCreateDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(implementoService.crear(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ImplementoDTO> actualizar(@PathVariable Long id, @RequestBody ImplementoDTO dto) {
        return implementoService.actualizar(id, dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        return implementoService.eliminar(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/categoria/{categoria}")
    public ResponseEntity<List<ImplementoDTO>> obtenerPorCategoria(@PathVariable String categoria) {
        return ResponseEntity.ok(implementoService.obtenerPorCategoria(categoria));
    }

    @GetMapping("/estado/{estado}")
    public ResponseEntity<List<ImplementoDTO>> obtenerPorEstado(@PathVariable String estado) {
        return ResponseEntity.ok(implementoService.obtenerPorEstado(estado));
    }

    @GetMapping("/buscar/{nombre}")
    public ResponseEntity<List<ImplementoDTO>> buscarPorNombre(@PathVariable String nombre) {
        return ResponseEntity.ok(implementoService.buscarPorNombre(nombre));
    }
}