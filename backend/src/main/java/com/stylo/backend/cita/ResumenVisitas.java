package com.stylo.backend.cita;

import java.time.Instant;
import java.util.UUID;

/**
 * Por cliente: su última visita (cita completada), su próxima cita programada,
 * cuántas visitas lleva y cuánto ha pagado en ellas (suma del precio de las citas completadas, en COP).
 */
public record ResumenVisitas(UUID clienteId, Instant ultimaVisita, Instant proximaCita, long visitas, long gastado) {
}
