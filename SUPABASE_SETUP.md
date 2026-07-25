# Configuración de Supabase

Guía paso a paso para crear la base de datos del CRM en Supabase.

---

## 1. Crear el proyecto en Supabase

1. Ir a [https://supabase.com](https://supabase.com) e iniciar sesión.
2. Hacer clic en **New project**.
3. Completar nombre, contraseña de base de datos y región.
4. Esperar a que el proyecto termine de inicializarse (~2 minutos).

---

## 2. Obtener las credenciales

Ir a **Project Settings → API** y copiar:

| Variable | Dónde encontrarla |
|---|---|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_KEY` | `service_role` key (nunca exponerla en el frontend) |

Pegar estos valores en los archivos `.env` correspondientes de `frontend/` y `scraper/`.

---

## 3. Ejecutar el SQL

Ir a **SQL Editor** en el panel de Supabase y pegar el siguiente bloque completo. Luego hacer clic en **Run**.

```sql
-- ============================================================
-- TABLAS
-- ============================================================

-- Leads captados (prospectos)
CREATE TABLE leads (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  nombre                  text,
  rubro                   text,
  ciudad                  text,
  tiene_web               boolean NOT NULL DEFAULT false,
  url_web                 text,
  telefono                text,
  whatsapp                text,
  email                   text,
  instagram               text,
  facebook                text,
  estado                  text NOT NULL DEFAULT 'nuevo'
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
  notas                   text
);

-- Clientes (leads que cerraron)
CREATE TABLE clients (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id                   uuid REFERENCES leads(id) ON DELETE SET NULL,
  created_at                timestamptz NOT NULL DEFAULT now(),
  url_sitio_entregado       text,
  url_demo_stitch           text,
  fecha_inicio              date,
  fecha_vencimiento_hosting date,
  notas                     text
);

-- Pagos asociados a un cliente
CREATE TABLE payments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid REFERENCES clients(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  tipo        text NOT NULL
                CHECK (tipo IN ('proyecto', 'mantenimiento', 'hosting')),
  monto       numeric,
  fecha_cobro date,
  pagado      boolean NOT NULL DEFAULT false
);

-- Configuración de búsquedas del scraper
CREATE TABLE scraper_config (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ciudad           text,
  rubro            text,
  activo           boolean NOT NULL DEFAULT true,
  ultima_ejecucion timestamptz
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE leads          ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_config ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Políticas para leads
-- ------------------------------------------------------------
CREATE POLICY "leads: lectura para usuario autenticado"
  ON leads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "leads: inserción para usuario autenticado"
  ON leads FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "leads: actualización para usuario autenticado"
  ON leads FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "leads: eliminación para usuario autenticado"
  ON leads FOR DELETE
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- Políticas para clients
-- ------------------------------------------------------------
CREATE POLICY "clients: lectura para usuario autenticado"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "clients: inserción para usuario autenticado"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "clients: actualización para usuario autenticado"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "clients: eliminación para usuario autenticado"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- Políticas para payments
-- ------------------------------------------------------------
CREATE POLICY "payments: lectura para usuario autenticado"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "payments: inserción para usuario autenticado"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "payments: actualización para usuario autenticado"
  ON payments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "payments: eliminación para usuario autenticado"
  ON payments FOR DELETE
  TO authenticated
  USING (true);

-- ------------------------------------------------------------
-- Políticas para scraper_config
-- ------------------------------------------------------------
CREATE POLICY "scraper_config: lectura para usuario autenticado"
  ON scraper_config FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "scraper_config: inserción para usuario autenticado"
  ON scraper_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "scraper_config: actualización para usuario autenticado"
  ON scraper_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "scraper_config: eliminación para usuario autenticado"
  ON scraper_config FOR DELETE
  TO authenticated
  USING (true);
```

---

## 4. Crear el usuario de acceso

1. Ir a **Authentication → Users**.
2. Hacer clic en **Add user → Create new user**.
3. Ingresar email y contraseña.

El frontend ya implementa el login con estas credenciales (`frontend/src/pages/Login.jsx`, usando `supabase.auth.signInWithPassword`): todas las rutas del CRM están protegidas por `RequireAuth` y redirigen a `/login` si no hay sesión iniciada. El scraper utiliza la `service_role` key, que bypasea RLS y no necesita usuario.

---

## 5. Verificar las tablas

Ir a **Table Editor** y confirmar que aparecen las cuatro tablas:

- `leads`
- `clients`
- `payments`
- `scraper_config`

---

## Notas sobre las políticas RLS

- Las políticas aplicadas son **permisivas para cualquier usuario autenticado**. Esto es adecuado para un CRM de uso personal o de equipo pequeño donde todos los usuarios tienen acceso total.
- Si en el futuro se necesita aislar datos por usuario, agregar `auth.uid()` a las condiciones `USING`. Ejemplo:
  ```sql
  -- Variante multi-usuario (referencia, no ejecutar ahora)
  USING (user_id = auth.uid())
  ```
- El scraper usa la `service_role` key, que omite RLS completamente. Nunca exponer esa clave en el código del frontend.

---

## Migración v2 — mejoras de scraper

Pegar en **SQL Editor → Run** sobre la base de datos existente. Todos los `IF NOT EXISTS` hacen que sea seguro re-ejecutar.

```sql
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
```

---

## Nota sobre el estado de este documento

Este archivo describe el esquema original y quedó desactualizado respecto al estado real de la base de datos: no incluye las tablas `servicios`, `casa_saldos`, `casa_gastos_fijos`, `casa_ingresos`, ni varias columnas agregadas por `migration_v3.sql` a `migration_v7.sql`. El esquema completo y actualizado vive en `schema.sql` + `migration_v2.sql` … `migration_v7.sql` en la raíz del proyecto (deben aplicarse en orden). Este documento se consolidará en una única fuente de verdad versionada como parte del refactor (ver plan de refactor).

## Migración v7 — endurecer RLS de finanzas de casa

`migration_v6.sql` dejó las políticas de `casa_saldos`, `casa_gastos_fijos` y `casa_ingresos` como `FOR ALL USING (true)` sin restringir el rol — más laxo que el resto de las tablas, que ya exigen `authenticated`. `migration_v7.sql` las alinea con el resto del esquema. Pegar su contenido en **SQL Editor → Run** sobre la base de datos existente.
