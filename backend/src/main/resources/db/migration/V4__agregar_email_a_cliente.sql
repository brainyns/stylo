-- Correo opcional del cliente. Los clientes existentes quedan sin correo.
ALTER TABLE cliente ADD COLUMN email VARCHAR(160);
