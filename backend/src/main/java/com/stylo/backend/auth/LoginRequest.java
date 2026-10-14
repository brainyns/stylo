package com.stylo.backend.auth;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "El correo es obligatorio")
        String email,

        @NotBlank(message = "La contraseña es obligatoria")
        String password) {

    public LoginRequest {
        email = email != null ? email.trim() : null;
    }
}
