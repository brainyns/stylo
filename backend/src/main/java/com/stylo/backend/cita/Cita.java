package com.stylo.backend.cita;

import com.stylo.backend.cliente.Cliente;
import com.stylo.backend.salon.Salon;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "cita")
@Getter
@Setter
public class Cita {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "salon_id", nullable = false)
    private Salon salon;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @Column(name = "inicio", nullable = false)
    private Instant inicio;

    @Column(name = "duracion_minutos", nullable = false)
    private Integer duracionMinutos = 60;

    @Column(name = "servicio", nullable = false, length = 120)
    private String servicio;

    @Column(name = "precio")
    private Long precio;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false, length = 20)
    private EstadoCita estado = EstadoCita.PROGRAMADA;

    @Column(name = "notas", columnDefinition = "TEXT")
    private String notas;

    @CreationTimestamp
    @Column(name = "creado_en", nullable = false, updatable = false)
    private Instant creadoEn;

    @UpdateTimestamp
    @Column(name = "actualizado_en", nullable = false)
    private Instant actualizadoEn;
}
