package com.stylo.backend.panel;

import com.stylo.backend.cita.Cita;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/**
 * Consultas de solo lectura para el panel. Como en los demás repositorios, todas reciben el salonId.
 */
public interface PanelRepository extends Repository<Cita, UUID> {

    /** Citas atendidas entre desde (incluido) y hasta (excluido), con lo justo para las métricas. */
    @Query("""
            select new com.stylo.backend.panel.CitaAtendida(c.cliente.id, c.cliente.nombre, c.inicio, c.servicio, c.precio)
            from Cita c
            where c.salon.id = :salonId and c.estado = com.stylo.backend.cita.EstadoCita.COMPLETADA
                and c.inicio >= :desde and c.inicio < :hasta
            """)
    List<CitaAtendida> atendidasEntre(@Param("salonId") UUID salonId, @Param("desde") Instant desde,
            @Param("hasta") Instant hasta);

    /** Primera visita de cada cliente, para separar clientes nuevos de los que regresan. */
    @Query("""
            select new com.stylo.backend.panel.PrimeraVisita(c.cliente.id, min(c.inicio))
            from Cita c
            where c.salon.id = :salonId and c.estado = com.stylo.backend.cita.EstadoCita.COMPLETADA
            group by c.cliente.id
            """)
    List<PrimeraVisita> primerasVisitas(@Param("salonId") UUID salonId);
}
