-- Columnas de enriquecimiento del scraper (score, prioridad, geolocalización,
-- presencia digital). Equivalente al histórico migration_v2.sql.

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS tipo_presencia      text
    CHECK (tipo_presencia IN ('web_propia','instagram','facebook','linktree','ninguna')),
  ADD COLUMN IF NOT EXISTS linktree            text,
  ADD COLUMN IF NOT EXISTS rating              numeric,
  ADD COLUMN IF NOT EXISTS reviews_count       integer,
  ADD COLUMN IF NOT EXISTS image_count         integer,
  ADD COLUMN IF NOT EXISTS categoria_google    text,
  ADD COLUMN IF NOT EXISTS direccion           text,
  ADD COLUMN IF NOT EXISTS lat                 numeric,
  ADD COLUMN IF NOT EXISTS lng                 numeric,
  ADD COLUMN IF NOT EXISTS descripcion_google  text,
  ADD COLUMN IF NOT EXISTS cerrado_permanente  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS score               integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS prioridad           text
    CHECK (prioridad IN ('alta','media','baja'));

CREATE INDEX IF NOT EXISTS idx_leads_score     ON leads (score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_prioridad ON leads (prioridad);
CREATE INDEX IF NOT EXISTS idx_leads_ciudad    ON leads (ciudad);
