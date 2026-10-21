package com.stylo.backend.cita;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.UUID;

public record CitaRequest(
        @NotNull(message = "Elige el cliente")
        UUID clienteId,

        @NotNull(message = "Elige la fecha y la hora")
        Instant inicio,

        @Min(value = 5, message = "La duración debe estar entre 5 y 600 minutos")
        @Max(value = 600, message = "La duración debe estar entre 5 y 600 minutos")
        Integer duracionMinutos,

        @NotBlank(message = "Escribe el servicio")
        @Size(max = 120, message = "El servicio no puede superar 120 caracteres")
        String servicio,

        @PositiveOrZero(message = "El precio no puede ser negativo")
        @Max(value = 100_000_000, message = "El precio no puede superar $100.000.000")
        Long precio,

        EstadoCita estado,

        String notas) {

    private static final int DURACION_POR_DEFECTO = 60;

    public CitaRequest {
        servicio = servicio != null ? servicio.trim() : null;
        duracionMinutos = duracionMinutos != null ? duracionMinutos : DURACION_POR_DEFECTO;
        estado = estado != null ? estado : EstadoCita.PROGRAMADA;
        notas = notas == null || notas.isBlank() ? null : notas.trim();
    }
}
