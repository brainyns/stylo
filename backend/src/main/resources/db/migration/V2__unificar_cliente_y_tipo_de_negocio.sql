-- Stylo sirve a peluquerías y barberías: "clienta" pasa a "cliente".
ALTER TABLE clienta RENAME TO cliente;
ALTER TABLE cliente RENAME CONSTRAINT clienta_pkey TO cliente_pkey;
ALTER TABLE cliente RENAME CONSTRAINT clienta_salon_id_fkey TO cliente_salon_id_fkey;
ALTER TABLE cliente RENAME CONSTRAINT clienta_frecuencia_semanas_check TO cliente_frecuencia_semanas_check;
ALTER TABLE cliente RENAME CONSTRAINT uk_clienta_salon_telefono TO uk_cliente_salon_telefono;
ALTER INDEX idx_clienta_salon_id RENAME TO idx_cliente_salon_id;

-- Los salones que ya existían eran peluquerías
ALTER TABLE salon
    ADD COLUMN tipo VARCHAR(20) NOT NULL DEFAULT 'PELUQUERIA'
        CONSTRAINT salon_tipo_check CHECK (tipo IN ('PELUQUERIA', 'BARBERIA', 'MIXTO'));
