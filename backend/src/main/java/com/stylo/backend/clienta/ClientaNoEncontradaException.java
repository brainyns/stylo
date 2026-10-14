package com.stylo.backend.clienta;

/**
 * La clienta no existe o es de otro salón. Ambos casos responden igual (404) para no revelar que existe.
 */
public class ClientaNoEncontradaException extends RuntimeException {

    public ClientaNoEncontradaException() {
        super("Clienta no encontrada");
    }
}
