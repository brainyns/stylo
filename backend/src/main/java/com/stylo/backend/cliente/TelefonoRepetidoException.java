package com.stylo.backend.cliente;

public class TelefonoRepetidoException extends RuntimeException {

    public TelefonoRepetidoException() {
        super("Ya tienes un cliente con ese número");
    }
}
