package com.stylo.backend.cita;

import jakarta.validation.constraints.NotNull;

public record CambioEstadoRequest(
        @NotNull(message = "Elige el estado")
        EstadoCita estado) {
}
