ALTER TABLE casa_saldos ADD COLUMN IF NOT EXISTS bbva_usd numeric DEFAULT 0;
ALTER TABLE casa_saldos ADD COLUMN IF NOT EXISTS tipo_cambio_oficial numeric DEFAULT 0;
