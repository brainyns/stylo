CREATE TABLE salon (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre        VARCHAR(120) NOT NULL,
    email         VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    telefono      VARCHAR(20),
    creado_en     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE clienta (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id           UUID         NOT NULL REFERENCES salon (id) ON DELETE CASCADE,
    nombre             VARCHAR(120) NOT NULL,
    telefono           VARCHAR(20)  NOT NULL,
    tono               VARCHAR(40),
    formula            VARCHAR(255),
    frecuencia_semanas INT          NOT NULL DEFAULT 5 CHECK (frecuencia_semanas BETWEEN 1 AND 52),
    notas              TEXT,
    creado_en          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en     TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uk_clienta_salon_telefono UNIQUE (salon_id, telefono)
);

CREATE INDEX idx_clienta_salon_id ON clienta (salon_id);
