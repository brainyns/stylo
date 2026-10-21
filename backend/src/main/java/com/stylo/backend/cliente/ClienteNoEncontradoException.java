package com.stylo.backend.cliente;

/**
 * El cliente no existe o es de otro salón. Ambos casos responden igual (404) para no revelar que existe.
 */
public class ClienteNoEncontradoException extends RuntimeException {

    public ClienteNoEncontradoException() {
        super("Cliente no encontrado");
    }
}
