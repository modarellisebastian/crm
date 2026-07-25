-- ============================================================
-- CRM CAPTADOR DE LEADS — SCHEMA COMPLETO
-- Pegar en Supabase → SQL Editor → Run
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- TABLAS
-- ────────────────────────────────────────────────────────────

-- Leads captados por el scraper (prospectos)
CREATE TABLE leads (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  nombre                  text,
  rubro                   text,
  ciudad                  text,
  tiene_web               boolean     NOT NULL DEFAULT false,
  url_web                 text,
  telefono                text,
  whatsapp                text,
  email                   text,
  instagram               text,
  facebook                text,
  estado                  text        NOT NULL DEFAULT 'nuevo'
                            CHECK (estado IN (
                              'nuevo',
                              'contactado',
                              'demo_enviado',
                              'negociando',
                              'cerrado',
                              'descartado'
                            )),
  fecha_contacto          timestamptz,
  fecha_ultimo_movimiento timestamptz,
  notas                   text,
  place_id                text
);

-- Clientes (leads que cerraron)
CREATE TABLE clients (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                   uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  nombre                    text,
  rubro                     text,
  ciudad                    text,
  email                     text,
  telefono                  text,
  fecha_inicio              date,
  fecha_vencimiento_hosting date,
  url_sitio_entregado       text,
  url_demo_stitch           text,
  notas                     text
);

-- Pagos asociados a un cliente
CREATE TABLE payments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        REFERENCES clients(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  tipo        text        NOT NULL
                CHECK (tipo IN ('proyecto', 'mantenimiento', 'hosting', 'soporte')),
  monto       numeric,
  fecha_cobro date,
  pagado      boolean     NOT NULL DEFAULT false,
  horas       numeric
);

-- Servicios recurrentes o únicos por cliente
CREATE TABLE servicios (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid        REFERENCES clients(id) ON DELETE CASCADE,
  nombre      text,
  tipo        text,
  frecuencia  text,
  monto       numeric,
  valor_hora  numeric,
  activo      boolean     NOT NULL DEFAULT true
);

-- Configuración de búsquedas del scraper
CREATE TABLE scraper_config (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ciudad           text,
  rubro            text,
  activo           boolean     NOT NULL DEFAULT true,
  ultima_ejecucion timestamptz
);

-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────

ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE servicios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_config ENABLE ROW LEVEL SECURITY;

-- leads
CREATE POLICY "leads: select" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "leads: insert" ON leads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads: update" ON leads FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "leads: delete" ON leads FOR DELETE TO authenticated USING (true);

-- clients
CREATE POLICY "clients: select" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients: insert" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients: update" ON clients FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "clients: delete" ON clients FOR DELETE TO authenticated USING (true);

-- payments
CREATE POLICY "payments: select" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "payments: insert" ON payments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "payments: update" ON payments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "payments: delete" ON payments FOR DELETE TO authenticated USING (true);

-- servicios
CREATE POLICY "servicios: select" ON servicios FOR SELECT TO authenticated USING (true);
CREATE POLICY "servicios: insert" ON servicios FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "servicios: update" ON servicios FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "servicios: delete" ON servicios FOR DELETE TO authenticated USING (true);

-- scraper_config
CREATE POLICY "scraper_config: select" ON scraper_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "scraper_config: insert" ON scraper_config FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "scraper_config: update" ON scraper_config FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "scraper_config: delete" ON scraper_config FOR DELETE TO authenticated USING (true);
