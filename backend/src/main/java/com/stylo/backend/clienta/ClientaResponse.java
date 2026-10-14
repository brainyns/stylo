package com.stylo.backend.clienta;

import java.time.Instant;
import java.util.UUID;

public record ClientaResponse(
        UUID id,
        String nombre,
        String telefono,
        String tono,
        String formula,
        Integer frecuenciaSemanas,
        String notas,
        Instant creadoEn,
        Instant actualizadoEn) {

    static ClientaResponse from(Clienta clienta) {
        return new ClientaResponse(
                clienta.getId(),
                clienta.getNombre(),
                clienta.getTelefono(),
                clienta.getTono(),
                clienta.getFormula(),
                clienta.getFrecuenciaSemanas(),
                clienta.getNotas(),
                clienta.getCreadoEn(),
                clienta.getActualizadoEn());
    }
}
