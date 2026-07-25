-- ============================================================
-- MIGRACIÓN V6 — FINANZAS DEL HOGAR
-- Pegar en Supabase → SQL Editor → Run
-- ============================================================

-- Saldos actuales (una fila por día, se usa la más reciente)
CREATE TABLE casa_saldos (
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

-- Gastos fijos mensuales (alquiler, seguro, tarjetas, etc.)
CREATE TABLE casa_gastos_fijos (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  mes              text        NOT NULL, -- formato 'YYYY-MM'
  nombre           text        NOT NULL,
  monto            numeric     NOT NULL DEFAULT 0,
  vencimiento_dia  int,                  -- día del mes que vence
  pagado           boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Ingresos mensuales (sueldo USD + freelance en pesos)
CREATE TABLE casa_ingresos (
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

-- RLS
ALTER TABLE casa_saldos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE casa_gastos_fijos ENABLE ROW LEVEL SECURITY;
ALTER TABLE casa_ingresos     ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas (ajustar según auth que uses)
CREATE POLICY "allow all casa_saldos"       ON casa_saldos       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all casa_gastos_fijos" ON casa_gastos_fijos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all casa_ingresos"     ON casa_ingresos     FOR ALL USING (true) WITH CHECK (true);
