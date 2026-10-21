package com.stylo.backend.cita;

public class RangoFechasInvalidoException extends RuntimeException {

    public RangoFechasInvalidoException() {
        super("El rango de fechas no es válido: 'hasta' debe ser posterior a 'desde' y abarcar máximo "
                + CitaService.DIAS_MAXIMOS_RANGO + " días");
    }
}
