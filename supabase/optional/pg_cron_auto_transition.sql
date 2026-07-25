-- OPCIONAL — no es parte de la cadena de migraciones (no se aplica con
-- `supabase db push`). Ejecutar a mano en el SQL Editor solo si se quiere
-- que la transición contactado → sin_respuesta corra en el servidor cada
-- hora, en vez de (o además de) la lógica equivalente que ya corre en el
-- cliente al cargar frontend/src/pages/Leads.jsx.
-- Equivalente al histórico migration_v5.sql.

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'contactado-sin-respuesta-72h',
  '0 * * * *',
  $$
    UPDATE leads
    SET
      estado                  = 'sin_respuesta',
      fecha_ultimo_movimiento = NOW()
    WHERE
      estado = 'contactado'
      AND COALESCE(fecha_ultimo_movimiento, created_at) < NOW() - INTERVAL '72 hours';
  $$
);

-- Para ver los jobs activos:
-- SELECT * FROM cron.job;

-- Para eliminar el job si ya no lo querés:
-- SELECT cron.unschedule('contactado-sin-respuesta-72h');
