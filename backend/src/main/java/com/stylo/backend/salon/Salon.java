package com.stylo.backend.salon;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "salon")
@Getter
@Setter
public class Salon {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nombre", nullable = false, length = 120)
    private String nombre;

    @Column(name = "email", nullable = false, unique = true, length = 160)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "telefono", length = 20)
    private String telefono;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private TipoNegocio tipo = TipoNegocio.PELUQUERIA;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;
}
