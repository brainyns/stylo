package com.stylo.backend.cliente;

import com.stylo.backend.cita.ResumenVisitas;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

public record ClienteResponse(
        UUID id,
        String nombre,
        String telefono,
        String email,
        String tono,
        String formula,
        Integer frecuenciaSemanas,
        String notas,
        // Calculados a partir de las citas
        Instant ultimaVisita,
        Instant proximaCita,
        // Última visita + frecuencia; null si aún no ha venido
        Instant leTocaVolver,
        Instant creadoEn,
        Instant actualizadoEn) {

    static ClienteResponse from(Cliente cliente, ResumenVisitas resumen) {
        Instant ultimaVisita = resumen != null ? resumen.ultimaVisita() : null;
        Instant proximaCita = resumen != null ? resumen.proximaCita() : null;
        Instant leTocaVolver = ultimaVisita != null
                ? ultimaVisita.plus(Duration.ofDays(7L * cliente.getFrecuenciaSemanas()))
                : null;
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNombre(),
                cliente.getTelefono(),
                cliente.getEmail(),
                cliente.getTono(),
                cliente.getFormula(),
                cliente.getFrecuenciaSemanas(),
                cliente.getNotas(),
                ultimaVisita,
                proximaCita,
                leTocaVolver,
                cliente.getCreadoEn(),
                cliente.getActualizadoEn());
    }
}
