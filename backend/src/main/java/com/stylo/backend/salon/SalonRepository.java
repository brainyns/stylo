package com.stylo.backend.salon;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SalonRepository extends JpaRepository<Salon, UUID> {

    Optional<Salon> findByEmail(String email);

    boolean existsByEmail(String email);
}
