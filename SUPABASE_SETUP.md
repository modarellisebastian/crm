# Configuración de Supabase

Guía para crear (o poner al día) la base de datos del CRM en Supabase.

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

Pegar estos valores en los archivos `.env` correspondientes de `frontend/` y `scraper/` (nunca en los `.env.example`, que deben quedar solo con placeholders).

---

## 3. Aplicar el esquema

El esquema completo vive versionado en `supabase/migrations/`, en orden:

| Archivo | Contenido |
|---|---|
| `20260725100001_initial_schema.sql` | Tablas base: `leads`, `clients`, `payments`, `servicios`, `scraper_config` + RLS |
| `20260725100002_leads_scraper_enrichment.sql` | Columnas de scoring/geolocalización/presencia digital en `leads` |
| `20260725100003_leads_pipeline_states.sql` | Amplía los estados válidos del pipeline de leads |
| `20260725100004_payments_descripcion.sql` | Campo `descripcion` en `payments` |
| `20260725100005_casa_finanzas.sql` | Tablas de finanzas del hogar: `casa_saldos`, `casa_gastos_fijos`, `casa_ingresos` + RLS |
| `20260725100006_harden_casa_rls.sql` | Elimina las políticas laxas históricas de `casa_*` (sin restricción de rol) |
| `20260725100007_scraper_config_generalizacion.sql` | Agrega a `scraper_config` las columnas `excluir_keywords`, `pais`, `idioma` y los umbrales de scoring, para sacar del código el hardcodeo específico del nicho de gimnasios |

**Con Supabase CLI** (recomendado):

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

**Sin CLI:** ir a **SQL Editor** y pegar el contenido de cada archivo de `supabase/migrations/`, en orden, uno por uno, con **Run**.

Todas las migraciones están escritas para ser seguras de re-aplicar (`IF NOT EXISTS` / `DROP POLICY IF EXISTS` antes de recrear), así que no hay problema en correrlas contra una base que ya tenga estas tablas creadas manualmente de una configuración anterior.

### Opcional: auto-transición de leads en el servidor

`supabase/optional/pg_cron_auto_transition.sql` agenda un job de `pg_cron` que pasa leads de `contactado` a `sin_respuesta` tras 72hs sin movimiento. No es parte de la cadena de migraciones (no se aplica con `db push`) porque el frontend ya hace lo mismo del lado del cliente (`frontend/src/pages/Leads.jsx`) — aplicar este script solo si además se quiere que corra en el servidor sin depender de que alguien tenga la app abierta.

### Datos de prueba (opcional)

`supabase/seed/seed_test.sql` tiene data ficticia de leads/clientes/pagos para probar la UI sin datos reales. Pegar en **SQL Editor → Run** después de las migraciones.

---

## 4. Crear el usuario de acceso

1. Ir a **Authentication → Users**.
2. Hacer clic en **Add user → Create new user**.
3. Ingresar email y contraseña.

El frontend ya implementa el login con estas credenciales (`frontend/src/pages/Login.jsx`, usando `supabase.auth.signInWithPassword`): todas las rutas del CRM están protegidas por `RequireAuth` y redirigen a `/login` si no hay sesión iniciada. El scraper utiliza la `service_role` key, que bypasea RLS y no necesita usuario.

---

## 5. Verificar las tablas

Ir a **Table Editor** y confirmar que aparecen:

- `leads`, `clients`, `payments`, `servicios`, `scraper_config`
- `casa_saldos`, `casa_gastos_fijos`, `casa_ingresos`

---

## Notas sobre las políticas RLS

- Las políticas aplicadas son **permisivas para cualquier usuario autenticado**. Esto es adecuado para un CRM de uso personal donde el único usuario tiene acceso total a todo.
- Si en el futuro se necesita aislar datos por usuario (más de una persona usando el CRM), agregar `auth.uid()` a las condiciones `USING`. Ejemplo:
  ```sql
  -- Variante multi-usuario (referencia, no ejecutar ahora)
  USING (user_id = auth.uid())
  ```
- El scraper usa la `service_role` key, que omite RLS completamente. Nunca exponer esa clave en el código del frontend.

---

## Configurar el scraper para un rubro específico (opcional)

Por defecto, una combinación nueva de `ciudad`+`rubro` no excluye ninguna cadena/franquicia y usa los umbrales de scoring genéricos. Si vas a prospectar un rubro donde ya conocés las cadenas grandes a evitar (por ejemplo, gimnasios), podés precargar la fila en `scraper_config` antes de scrapear:

```sql
INSERT INTO scraper_config (ciudad, rubro, excluir_keywords)
VALUES ('Tandil', 'Gimnasio', ARRAY[
  'megatlon', 'sport club', 'sportclub', 'fitness first', 'bodytech', 'body tech',
  'gold''s gym', 'golds gym', 'snap fitness', 'planet fitness', 'equinox',
  'american fitness', 'muscle factory', 'eko fitness', 'club atlético municipal',
  'colsubsidio', 'world gym', 'anytime fitness', 'básico fit', 'basic fit'
])
ON CONFLICT (ciudad, rubro) DO UPDATE SET excluir_keywords = EXCLUDED.excluir_keywords;
```

## Datos financieros personales (finanzas de casa)

Tus datos reales de `casa_*` no se versionan en este repo — `seed_casa.sql` (si existe en tu copia local) está en `.gitignore` a propósito. Cargá tus datos reales directamente desde la UI del CRM (`/casa`) o pegando tu propio SQL local, pero no lo agregues al control de versiones.
