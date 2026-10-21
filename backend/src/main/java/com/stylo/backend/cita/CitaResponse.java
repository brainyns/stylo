package com.stylo.backend.cita;

import com.stylo.backend.cliente.Cliente;
import java.time.Instant;
import java.util.UUID;

public record CitaResponse(
        UUID id,
        ClienteDeCita cliente,
        Instant inicio,
        Integer duracionMinutos,
        String servicio,
        Long precio,
        EstadoCita estado,
        String notas) {

    /** Lo justo del cliente para mostrar la cita y escribirle por WhatsApp. */
    public record ClienteDeCita(UUID id, String nombre, String telefono) {

        static ClienteDeCita from(Cliente cliente) {
            return new ClienteDeCita(cliente.getId(), cliente.getNombre(), cliente.getTelefono());
        }
    }

    static CitaResponse from(Cita cita) {
        return new CitaResponse(
                cita.getId(),
                ClienteDeCita.from(cita.getCliente()),
                cita.getInicio(),
                cita.getDuracionMinutos(),
                cita.getServicio(),
                cita.getPrecio(),
                cita.getEstado(),
                cita.getNotas());
    }
}
