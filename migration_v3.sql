-- Migration V3: nuevos estados del pipeline
-- Ejecutar en Supabase → SQL Editor

-- 1. Buscar y eliminar el CHECK constraint sobre el campo estado
--    (usa pg_constraint en lugar de information_schema para evitar falsos positivos)
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'leads'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%estado%'
  LOOP
    EXECUTE 'ALTER TABLE leads DROP CONSTRAINT ' || quote_ident(r.conname);
  END LOOP;
END $$;

-- 2. Agregar el nuevo CHECK con los estados extendidos
ALTER TABLE leads
  ADD CONSTRAINT leads_estado_check
  CHECK (estado IN (
    'nuevo',
    'contactado',
    'sin_respuesta',
    'interesado',
    'en_espera',
    'demo_enviado',
    'negociando',
    'cerrado',
    'descartado'
  ));
