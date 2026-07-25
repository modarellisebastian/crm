-- Tablas de finanzas del hogar: saldos, gastos fijos e ingresos mensuales.
-- Equivalente al histórico migration_v6.sql. Las políticas RLS ya se crean
-- restringidas a `authenticated` (a diferencia del histórico, que las dejó
-- sin restricción de rol — ver 20260725100006_harden_casa_rls.sql).

CREATE TABLE IF NOT EXISTS casa_saldos (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha        date        NOT NULL DEFAULT CURRENT_DATE,
  bbva         numeric     NOT NULL DEFAULT 0,
  mercadopago  numeric     NOT NULL DEFAULT 0,
  efectivo     numeric     NOT NULL DEFAULT 0,
  cuenta_dni   numeric     NOT NULL DEFAULT 0,
  dolarapp_usd numeric     NOT NULL DEFAULT 0,
  tipo_cambio  numeric     NOT NULL DEFAULT 1500,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS casa_gastos_fijos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mes              text        NOT NULL, -- formato 'YYYY-MM'
  nombre           text        NOT NULL,
  monto            numeric     NOT NULL DEFAULT 0,
  vencimiento_dia  int,
  pagado           boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS casa_ingresos (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mes        text        NOT NULL, -- formato 'YYYY-MM'
  nombre     text        NOT NULL,
  tipo       text        NOT NULL DEFAULT 'freelance'
               CHECK (tipo IN ('sueldo_usd', 'freelance')),
  moneda     text        NOT NULL DEFAULT 'ars'
               CHECK (moneda IN ('ars', 'usd')),
  monto      numeric     NOT NULL DEFAULT 0,
  cobrado    boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE casa_saldos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE casa_gastos_fijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE casa_ingresos     ENABLE ROW LEVEL SECURITY;

-- DROP + CREATE por si ya existen con estos mismos nombres (idempotencia;
-- Postgres no soporta CREATE POLICY IF NOT EXISTS). Las políticas laxas
-- históricas ("allow all casa_*", sin restricción de rol) tienen nombres
-- distintos y se eliminan en 20260725100006_harden_casa_rls.sql.

DROP POLICY IF EXISTS "casa_saldos: select" ON casa_saldos;
DROP POLICY IF EXISTS "casa_saldos: insert" ON casa_saldos;
DROP POLICY IF EXISTS "casa_saldos: update" ON casa_saldos;
DROP POLICY IF EXISTS "casa_saldos: delete" ON casa_saldos;
CREATE POLICY "casa_saldos: select" ON casa_saldos FOR SELECT TO authenticated USING (true);
CREATE POLICY "casa_saldos: insert" ON casa_saldos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "casa_saldos: update" ON casa_saldos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "casa_saldos: delete" ON casa_saldos FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "casa_gastos_fijos: select" ON casa_gastos_fijos;
DROP POLICY IF EXISTS "casa_gastos_fijos: insert" ON casa_gastos_fijos;
DROP POLICY IF EXISTS "casa_gastos_fijos: update" ON casa_gastos_fijos;
DROP POLICY IF EXISTS "casa_gastos_fijos: delete" ON casa_gastos_fijos;
CREATE POLICY "casa_gastos_fijos: select" ON casa_gastos_fijos FOR SELECT TO authenticated USING (true);
CREATE POLICY "casa_gastos_fijos: insert" ON casa_gastos_fijos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "casa_gastos_fijos: update" ON casa_gastos_fijos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "casa_gastos_fijos: delete" ON casa_gastos_fijos FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "casa_ingresos: select" ON casa_ingresos;
DROP POLICY IF EXISTS "casa_ingresos: insert" ON casa_ingresos;
DROP POLICY IF EXISTS "casa_ingresos: update" ON casa_ingresos;
DROP POLICY IF EXISTS "casa_ingresos: delete" ON casa_ingresos;
CREATE POLICY "casa_ingresos: select" ON casa_ingresos FOR SELECT TO authenticated USING (true);
CREATE POLICY "casa_ingresos: insert" ON casa_ingresos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "casa_ingresos: update" ON casa_ingresos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "casa_ingresos: delete" ON casa_ingresos FOR DELETE TO authenticated USING (true);
