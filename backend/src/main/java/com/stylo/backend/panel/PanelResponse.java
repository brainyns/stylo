package com.stylo.backend.panel;

import com.stylo.backend.cita.CitaResponse;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

/**
 * Métricas del negocio. Los ingresos salen del precio de las citas atendidas (COP, sin decimales);
 * los días, semanas (de lunes a domingo) y meses son los de Colombia.
 */
public record PanelResponse(
        LocalDate hoy,
        Ingresos ingresos,
        // Últimos 30 días, del más antiguo a hoy, incluidos los días sin cobros
        List<IngresoDelDia> ingresosPorDia,
        List<CitaResponse> citasHoy,
        // Próximas citas programadas después de hoy
        List<CitaResponse> proximasCitas,
        // Últimos 90 días
        List<ServicioPedido> serviciosTop,
        List<ClienteFrecuente> clientesFrecuentes,
        Clientes clientes) {

    /** Lo cobrado en un periodo y en cuántas citas. */
    public record Periodo(long total, long cobros) {

        static final Periodo VACIO = new Periodo(0, 0);

        Periodo sumar(Long precio) {
            return precio == null ? this : new Periodo(total + precio, cobros + 1);
        }
    }

    public record Ingresos(
            Periodo hoy,
            Periodo semana,
            Periodo mes,
            // El mes pasado hasta el mismo día, para comparar cortes iguales
            Periodo mesAnteriorAlMismoDia,
            // Del mes en curso; null si aún no hay cobros
            Long ticketPromedio,
            double cobrosPorDia) {
    }

    public record IngresoDelDia(LocalDate fecha, long total, long cobros) {
    }

    public record ServicioPedido(String servicio, long veces, long total) {
    }

    public record ClienteFrecuente(UUID id, String nombre, long visitas, long gastado) {
    }

    public record Clientes(
            // Del mes en curso
            long nuevosMes,
            long recurrentesMes,
            long visitasMes,
            long atendidosMes,
            // Últimos 6 meses, del más antiguo al actual
            List<ClientesDelMes> porMes) {
    }

    public record ClientesDelMes(YearMonth mes, long nuevos, long recurrentes) {
    }
}
