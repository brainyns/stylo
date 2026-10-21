package com.stylo.backend.auth;

import com.stylo.backend.salon.Salon;
import com.stylo.backend.salon.TipoNegocio;
import java.util.UUID;

public record SalonResponse(UUID id, String nombre, String email, TipoNegocio tipo) {

    static SalonResponse from(Salon salon) {
        return new SalonResponse(salon.getId(), salon.getNombre(), salon.getEmail(), salon.getTipo());
    }
}
