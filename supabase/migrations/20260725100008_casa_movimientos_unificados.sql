-- Unifica casa_ingresos y casa_gastos_fijos (dos tablas espejo, una para dinero
-- entrante y otra para saliente) en una sola tabla casa_movimientos con un campo
-- tipo_movimiento ('ingreso' | 'egreso'). Migra los datos existentes y elimina
-- las tablas viejas.
--
-- ⚠️ Esta migración es destructiva (DROP TABLE casa_ingresos, casa_gastos_fijos)
-- una vez copiados los datos a casa_movimientos. Si tenés datos reales cargados,
-- te recomendamos exportarlos primero (Table Editor → Export as CSV) por las dudas.

BEGIN;

CREATE TABLE IF NOT EXISTS casa_movimientos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mes              text        NOT NULL, -- formato 'YYYY-MM'
  nombre           text        NOT NULL,
  tipo_movimiento  text        NOT NULL CHECK (tipo_movimiento IN ('ingreso', 'egreso')),
  categoria        text,                 -- ej. 'sueldo_usd' | 'freelance' (solo ingresos)
  moneda           text        NOT NULL DEFAULT 'ars' CHECK (moneda IN ('ars', 'usd')),
  monto            numeric     NOT NULL DEFAULT 0,
  vencimiento_dia  int,                  -- solo relevante para egresos
  resuelto         boolean     NOT NULL DEFAULT false, -- "cobrado" (ingreso) / "pagado" (egreso)
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Migrar datos de las tablas viejas si todavía existen (no-op si ya se migró antes)
DO $$
BEGIN
  IF to_regclass('public.casa_ingresos') IS NOT NULL THEN
    INSERT INTO casa_movimientos (mes, nombre, tipo_movimiento, categoria, moneda, monto, resuelto, created_at)
    SELECT mes, nombre, 'ingreso', tipo, moneda, monto, cobrado, created_at
    FROM casa_ingresos;

    DROP TABLE casa_ingresos;
  END IF;

  IF to_regclass('public.casa_gastos_fijos') IS NOT NULL THEN
    INSERT INTO casa_movimientos (mes, nombre, tipo_movimiento, categoria, moneda, monto, vencimiento_dia, resuelto, created_at)
    SELECT mes, nombre, 'egreso', NULL, 'ars', monto, vencimiento_dia, pagado, created_at
    FROM casa_gastos_fijos;

    DROP TABLE casa_gastos_fijos;
  END IF;
END $$;

ALTER TABLE casa_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "casa_movimientos: select" ON casa_movimientos;
DROP POLICY IF EXISTS "casa_movimientos: insert" ON casa_movimientos;
DROP POLICY IF EXISTS "casa_movimientos: update" ON casa_movimientos;
DROP POLICY IF EXISTS "casa_movimientos: delete" ON casa_movimientos;
CREATE POLICY "casa_movimientos: select" ON casa_movimientos FOR SELECT TO authenticated USING (true);
CREATE POLICY "casa_movimientos: insert" ON casa_movimientos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "casa_movimientos: update" ON casa_movimientos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "casa_movimientos: delete" ON casa_movimientos FOR DELETE TO authenticated USING (true);

COMMIT;
