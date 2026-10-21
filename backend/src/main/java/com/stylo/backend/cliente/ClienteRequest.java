package com.stylo.backend.cliente;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ClienteRequest(
        @NotBlank(message = "El nombre es obligatorio")
        @Size(max = 120, message = "El nombre no puede superar 120 caracteres")
        String nombre,

        @NotBlank(message = "El teléfono es obligatorio")
        @Pattern(regexp = "3\\d{9}",
                message = "El teléfono debe ser un celular colombiano de 10 dígitos (puede incluir el prefijo 57)")
        String telefono,

        @Size(max = 40, message = "El tono no puede superar 40 caracteres")
        String tono,

        @Size(max = 255, message = "La fórmula no puede superar 255 caracteres")
        String formula,

        @Min(value = 1, message = "La frecuencia debe estar entre 1 y 52 semanas")
        @Max(value = 52, message = "La frecuencia debe estar entre 1 y 52 semanas")
        Integer frecuenciaSemanas,

        String notas) {

    private static final int FRECUENCIA_POR_DEFECTO = 5;

    // Normaliza antes de validar: el teléfono queda en 10 dígitos y los textos opcionales vacíos en null
    public ClienteRequest {
        nombre = nombre != null ? nombre.trim() : null;
        telefono = normalizarTelefono(telefono);
        tono = textoOpcional(tono);
        formula = textoOpcional(formula);
        notas = textoOpcional(notas);
        frecuenciaSemanas = frecuenciaSemanas != null ? frecuenciaSemanas : FRECUENCIA_POR_DEFECTO;
    }

    /**
     * Deja solo los dígitos y quita el prefijo 57: "+57 300 123 4567" → "3001234567".
     * Si no queda ningún dígito, devuelve el texto tal cual para que lo rechace la validación.
     */
    private static String normalizarTelefono(String telefono) {
        if (telefono == null) {
            return null;
        }
        String digitos = telefono.replaceAll("\\D", "");
        if (digitos.length() == 12 && digitos.startsWith("57")) {
            digitos = digitos.substring(2);
        }
        return digitos.isEmpty() ? telefono.trim() : digitos;
    }

    private static String textoOpcional(String texto) {
        return texto == null || texto.isBlank() ? null : texto.trim();
    }
}
