-- Migration V5: auto-transición contactado → sin_respuesta vía pg_cron
-- OPCIONAL — solo si querés que corra en el servidor cada hora sin abrir la app
-- Ejecutar en Supabase → SQL Editor

-- 1. Habilitar pg_cron (solo hace falta una vez por proyecto)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Agendar el job: cada hora revisa leads contactados con >72hs de inactividad
SELECT cron.schedule(
  'contactado-sin-respuesta-72h',        -- nombre del job
  '0 * * * *',                           -- cada hora en punto
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
