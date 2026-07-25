-- Campo de descripción libre en pagos.
-- Equivalente al histórico migration_v4.sql.

ALTER TABLE payments ADD COLUMN IF NOT EXISTS descripcion text;
