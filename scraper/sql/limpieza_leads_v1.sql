-- =============================================================================
-- LIMPIEZA DE LEADS v1
-- DRY RUN: reemplazá COMMIT; por ROLLBACK; al final para ver los counts
--          sin aplicar ningún cambio. Cuando los números cierren, volvé a COMMIT;
-- =============================================================================

BEGIN;

-- =============================================================================
-- BLOQUE 1 — Limpiar URLs de Google Business (g.dev / goo.gl)
-- No toca estado ni notas. Corre antes del bloque 2 para que los leads
-- afectados queden sin web_propia y caigan en el filtro de canal digital.
-- =============================================================================

-- Preview: cuántos leads tienen una URL de Google Business
SELECT COUNT(*) AS bloque1_afectados
FROM leads
WHERE estado = 'nuevo'
  AND (
    url_web LIKE '%g.dev%'
    OR url_web LIKE '%goo.gl%'
  );

UPDATE leads
SET
  url_web        = NULL,
  tiene_web      = false,
  tipo_presencia = 'ninguna'
WHERE estado = 'nuevo'
  AND (
    url_web LIKE '%g.dev%'
    OR url_web LIKE '%goo.gl%'
  );


-- =============================================================================
-- BLOQUE 2 — Descartar leads sin canal digital
-- Se descarta todo lead nuevo que no tenga ningún medio para contactarlo
-- digitalmente: sin WhatsApp, Instagram, Facebook, Linktree ni web propia.
-- =============================================================================

-- Preview
SELECT COUNT(*) AS bloque2_afectados
FROM leads
WHERE estado = 'nuevo'
  AND whatsapp   IS NULL
  AND instagram  IS NULL
  AND facebook   IS NULL
  AND linktree   IS NULL
  AND tiene_web  = false;

UPDATE leads
SET
  estado                  = 'descartado',
  notas                   = COALESCE(notas || ' | ', '') || 'auto_descarte: sin canal digital',
  fecha_ultimo_movimiento = now()
WHERE estado = 'nuevo'
  AND whatsapp   IS NULL
  AND instagram  IS NULL
  AND facebook   IS NULL
  AND linktree   IS NULL
  AND tiene_web  = false;


-- =============================================================================
-- BLOQUE 3 — Descartar leads de provincia equivocada
-- Ciudades argentinas con nombre repetido en distintas provincias generan
-- falsos positivos. Cada caso se agrega como una condición OR dentro del
-- filtro para mantener el patrón consistente.
-- =============================================================================

-- Preview
SELECT COUNT(*) AS bloque3_afectados
FROM leads
WHERE estado = 'nuevo'
  AND (
    -- Junín (Buenos Aires) vs Junín (Mendoza)
    (ciudad = 'Junín' AND LOWER(direccion) LIKE '%mendoza%')

    -- Agregar más casos aquí con el mismo patrón:
    -- OR (ciudad = 'Mercedes' AND LOWER(direccion) LIKE '%corrientes%')
    -- OR (ciudad = 'General Roca' AND LOWER(direccion) LIKE '%chubut%')
  );

UPDATE leads
SET
  estado                  = 'descartado',
  notas                   = COALESCE(notas || ' | ', '') || 'auto_descarte: provincia equivocada',
  fecha_ultimo_movimiento = now()
WHERE estado = 'nuevo'
  AND (
    (ciudad = 'Junín' AND LOWER(direccion) LIKE '%mendoza%')
    -- OR (ciudad = 'NombreCiudad' AND LOWER(direccion) LIKE '%provinciaErronea%')
  );


-- =============================================================================
-- BLOQUE 4 — Descartar leads de categoría no relacionada con gimnasios
-- Solo se descartan leads cuya categoria_google es no-null y no pertenece
-- a la lista blanca. Los leads sin categoría (null) se conservan.
-- El motivo en notas incluye la categoría detectada para auditoría.
-- =============================================================================

-- Preview
SELECT COUNT(*) AS bloque4_afectados
FROM leads
WHERE estado = 'nuevo'
  AND categoria_google IS NOT NULL
  AND categoria_google NOT IN (
    'Gimnasio',
    'Centro deportivo',
    'Polideportivo',
    'Box de CrossFit',
    'CrossFit',
    'Centro fitness',
    'Gimnasio 24 horas',
    'Estudio de pilates',
    'Estudio de yoga',
    'Centro de entrenamiento personal'
  );

UPDATE leads
SET
  estado                  = 'descartado',
  notas                   = COALESCE(notas || ' | ', '') || 'auto_descarte: categoria_google no relacionada (' || categoria_google || ')',
  fecha_ultimo_movimiento = now()
WHERE estado = 'nuevo'
  AND categoria_google IS NOT NULL
  AND categoria_google NOT IN (
    'Gimnasio',
    'Centro deportivo',
    'Polideportivo',
    'Box de CrossFit',
    'CrossFit',
    'Centro fitness',
    'Gimnasio 24 horas',
    'Estudio de pilates',
    'Estudio de yoga',
    'Centro de entrenamiento personal'
  );


-- =============================================================================
-- BLOQUE 5 — Resumen final
-- =============================================================================

-- Distribución por estado (todos los leads)
SELECT
  estado,
  COUNT(*) AS cantidad
FROM leads
GROUP BY estado
ORDER BY cantidad DESC;

-- Distribución por prioridad (solo leads activos, excluye descartados)
SELECT
  prioridad,
  COUNT(*) AS cantidad
FROM leads
WHERE estado != 'descartado'
GROUP BY prioridad
ORDER BY
  CASE prioridad
    WHEN 'alta'  THEN 1
    WHEN 'media' THEN 2
    WHEN 'baja'  THEN 3
    ELSE 4
  END;


COMMIT;
