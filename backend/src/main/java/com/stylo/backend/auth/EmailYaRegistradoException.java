package com.stylo.backend.auth;

public class EmailYaRegistradoException extends RuntimeException {

    public EmailYaRegistradoException() {
        super("Ya existe un salón registrado con ese correo");
    }
}
