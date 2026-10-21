package com.stylo.backend.cliente;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.repository.Repository;

/**
 * Todas las consultas de clientes reciben el salonId: nunca se buscan clientes sin filtrar por salón.
 * Hereda de Repository (no de JpaRepository) para no exponer findAll, findById ni deleteById sin filtro.
 */
public interface ClienteRepository extends Repository<Cliente, UUID> {

    // saveAndFlush: así @UpdateTimestamp y el UNIQUE (salon_id, telefono) se aplican dentro del servicio
    Cliente saveAndFlush(Cliente cliente);

    void delete(Cliente cliente);

    List<Cliente> findAllBySalonIdOrderByNombreAsc(UUID salonId);

    Optional<Cliente> findByIdAndSalonId(UUID id, UUID salonId);

    boolean existsBySalonIdAndTelefono(UUID salonId, String telefono);
}
