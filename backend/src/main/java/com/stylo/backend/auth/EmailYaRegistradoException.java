package com.stylo.backend.auth;

public class EmailYaRegistradoException extends RuntimeException {

    public EmailYaRegistradoException() {
        super("Ya existe un negocio registrado con ese correo");
    }
}
