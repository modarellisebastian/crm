-- Migration V4: campo descripcion en pagos
-- Ejecutar en Supabase → SQL Editor

ALTER TABLE payments ADD COLUMN IF NOT EXISTS descripcion text;
