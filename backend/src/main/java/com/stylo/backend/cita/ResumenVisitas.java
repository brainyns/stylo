package com.stylo.backend.cita;

import java.time.Instant;
import java.util.UUID;

/**
 * Por cliente: su última visita (cita completada) y su próxima cita programada.
 */
public record ResumenVisitas(UUID clienteId, Instant ultimaVisita, Instant proximaCita) {
}
