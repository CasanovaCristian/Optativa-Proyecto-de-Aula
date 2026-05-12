package com.backend.optativa_backend.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UsuarioCreateDTO {
    private String nombre;
    private String email;
    private String password;
    private String rol;
}
