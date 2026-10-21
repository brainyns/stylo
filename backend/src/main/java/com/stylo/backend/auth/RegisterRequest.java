package com.stylo.backend.auth;

import com.stylo.backend.salon.TipoNegocio;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "El nombre del negocio es obligatorio")
        @Size(max = 120, message = "El nombre del negocio no puede superar 120 caracteres")
        String nombre,

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no es válido")
        @Size(max = 160, message = "El correo no puede superar 160 caracteres")
        String email,

        // BCrypt solo usa los primeros 72 bytes de la contraseña
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
        String password,

        @Size(max = 20, message = "El teléfono no puede superar 20 caracteres")
        String telefono,

        @NotNull(message = "Elige el tipo de negocio")
        TipoNegocio tipo) {

    // Se recorta antes de validar, para que " correo@x.com " pase @Email
    public RegisterRequest {
        email = email != null ? email.trim() : null;
    }
}
