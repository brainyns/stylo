package com.stylo.backend.cita;

public enum EstadoCita {
    PROGRAMADA,
    // El cliente vino: cuenta como visita para calcular cuándo le toca volver
    COMPLETADA,
    CANCELADA,
    NO_ASISTIO
}
