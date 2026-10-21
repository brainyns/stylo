-- Permite que la cita referencie (cliente_id, salon_id): la base garantiza que el cliente es del mismo salón
ALTER TABLE cliente ADD CONSTRAINT uk_cliente_id_salon UNIQUE (id, salon_id);

CREATE TABLE cita (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id         UUID         NOT NULL REFERENCES salon (id) ON DELETE CASCADE,
    cliente_id       UUID         NOT NULL,
    inicio           TIMESTAMPTZ  NOT NULL,
    duracion_minutos INT          NOT NULL DEFAULT 60 CHECK (duracion_minutos BETWEEN 5 AND 600),
    servicio         VARCHAR(120) NOT NULL,
    -- Pesos colombianos, sin decimales
    precio           BIGINT       CHECK (precio >= 0),
    estado           VARCHAR(20)  NOT NULL DEFAULT 'PROGRAMADA'
        CHECK (estado IN ('PROGRAMADA', 'COMPLETADA', 'CANCELADA', 'NO_ASISTIO')),
    notas            TEXT,
    creado_en        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT fk_cita_cliente_salon FOREIGN KEY (cliente_id, salon_id)
        REFERENCES cliente (id, salon_id) ON DELETE CASCADE
);

CREATE INDEX idx_cita_salon_inicio ON cita (salon_id, inicio);
CREATE INDEX idx_cita_cliente_id ON cita (cliente_id);
