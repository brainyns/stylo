package com.stylo.backend.clienta;

public class TelefonoRepetidoException extends RuntimeException {

    public TelefonoRepetidoException() {
        super("Ya tienes una clienta con ese número");
    }
}
