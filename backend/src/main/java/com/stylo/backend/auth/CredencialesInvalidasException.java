package com.stylo.backend.auth;

/**
 * Login fallido. El mensaje es genérico a propósito: no revela si el correo existe.
 */
public class CredencialesInvalidasException extends RuntimeException {

    public CredencialesInvalidasException() {
        super("Correo o contraseña incorrectos");
    }
}
