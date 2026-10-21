package com.stylo.backend.cita;

/**
 * La cita no existe o es de otro salón. Ambos casos responden igual (404) para no revelar que existe.
 */
public class CitaNoEncontradaException extends RuntimeException {

    public CitaNoEncontradaException() {
        super("Cita no encontrada");
    }
}
