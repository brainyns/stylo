package com.stylo.backend.clienta;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.repository.Repository;

/**
 * Todas las consultas de clientas reciben el salonId: nunca se buscan clientas sin filtrar por salón.
 * Hereda de Repository (no de JpaRepository) para no exponer findAll, findById ni deleteById sin filtro.
 */
public interface ClientaRepository extends Repository<Clienta, UUID> {

    Clienta save(Clienta clienta);

    void delete(Clienta clienta);

    List<Clienta> findAllBySalonIdOrderByNombreAsc(UUID salonId);

    Optional<Clienta> findByIdAndSalonId(UUID id, UUID salonId);

    boolean existsBySalonIdAndTelefono(UUID salonId, String telefono);
}
