package com.stylo.backend.cita;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

/**
 * Igual que ClienteRepository: todas las consultas reciben el salonId y no se expone nada sin filtrar por salón.
 */
public interface CitaRepository extends Repository<Cita, UUID> {

    Cita saveAndFlush(Cita cita);

    void delete(Cita cita);

    @EntityGraph(attributePaths = "cliente")
    Optional<Cita> findByIdAndSalonId(UUID id, UUID salonId);

    @EntityGraph(attributePaths = "cliente")
    List<Cita> findAllBySalonIdAndInicioGreaterThanEqualAndInicioLessThanOrderByInicioAsc(
            UUID salonId, Instant desde, Instant hasta);

    @EntityGraph(attributePaths = "cliente")
    List<Cita> findAllBySalonIdAndClienteIdOrderByInicioDesc(UUID salonId, UUID clienteId);

    String RESUMEN = """
            select new com.stylo.backend.cita.ResumenVisitas(c.cliente.id,
                max(case when c.estado = com.stylo.backend.cita.EstadoCita.COMPLETADA then c.inicio end),
                min(case when c.estado = com.stylo.backend.cita.EstadoCita.PROGRAMADA and c.inicio >= :ahora
                    then c.inicio end))
            from Cita c
            """;

    @Query(RESUMEN + "where c.salon.id = :salonId group by c.cliente.id")
    List<ResumenVisitas> resumenPorCliente(@Param("salonId") UUID salonId, @Param("ahora") Instant ahora);

    @Query(RESUMEN + "where c.salon.id = :salonId and c.cliente.id = :clienteId group by c.cliente.id")
    Optional<ResumenVisitas> resumenDeCliente(@Param("salonId") UUID salonId, @Param("clienteId") UUID clienteId,
            @Param("ahora") Instant ahora);
}
