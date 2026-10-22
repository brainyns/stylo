package com.stylo.backend.panel;

import java.time.Instant;
import java.util.UUID;

/** Una cita completada, reducida a lo que usan las métricas del panel. El precio puede faltar. */
public record CitaAtendida(UUID clienteId, String clienteNombre, Instant inicio, String servicio, Long precio) {
}
