package com.stylo.backend.panel;

import java.time.Instant;
import java.util.UUID;

public record PrimeraVisita(UUID clienteId, Instant primera) {
}
