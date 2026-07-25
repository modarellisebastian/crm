-- Amplía los estados válidos del pipeline de leads.
-- Equivalente al histórico migration_v3.sql.

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
