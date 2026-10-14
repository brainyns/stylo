package com.stylo.backend.clienta;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Todas las consultas de clientas reciben el salonId: nunca se buscan clientas sin filtrar por salón.
 */
public interface ClientaRepository extends JpaRepository<Clienta, UUID> {

    List<Clienta> findAllBySalonIdOrderByNombreAsc(UUID salonId);

    Optional<Clienta> findByIdAndSalonId(UUID id, UUID salonId);

    boolean existsBySalonIdAndTelefono(UUID salonId, String telefono);
}
