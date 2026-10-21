package com.stylo.backend.cliente;

import java.time.Instant;
import java.util.UUID;

public record ClienteResponse(
        UUID id,
        String nombre,
        String telefono,
        String tono,
        String formula,
        Integer frecuenciaSemanas,
        String notas,
        Instant creadoEn,
        Instant actualizadoEn) {

    static ClienteResponse from(Cliente cliente) {
        return new ClienteResponse(
                cliente.getId(),
                cliente.getNombre(),
                cliente.getTelefono(),
                cliente.getTono(),
                cliente.getFormula(),
                cliente.getFrecuenciaSemanas(),
                cliente.getNotas(),
                cliente.getCreadoEn(),
                cliente.getActualizadoEn());
    }
}
