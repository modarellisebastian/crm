# crm-leads

CRM personal para gestión de prospectos/clientes y finanzas del hogar, compuesto por un frontend React y un scraper Node.js que obtiene datos mediante Apify y los almacena en Supabase.

## Estructura del proyecto

```
crm-leads/
├── frontend/          # Aplicación React (Vite + Tailwind + React Router)
├── scraper/           # Servicio Node.js (Express + Axios + Apify)
├── supabase/
│   ├── migrations/    # Esquema de la base de datos, versionado y ordenado
│   ├── optional/       # Scripts SQL opcionales (no se aplican con db push)
│   └── seed/          # Datos de prueba (ficticios)
├── .gitignore
└── README.md
```

## Requisitos

- Node.js >= 18
- Cuenta en [Supabase](https://supabase.com) — opcionalmente, [Supabase CLI](https://supabase.com/docs/guides/cli) para aplicar `supabase/migrations/` con `supabase db push`
- Cuenta y token de API de [Apify](https://apify.com)

## Configuración

Para crear el proyecto Supabase y aplicar el esquema, ver `SUPABASE_SETUP.md`.

### Frontend

```bash
cd frontend
cp .env.example .env
# Completar VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y VITE_SCRAPER_URL en .env
npm install
npm run dev
```

### Scraper

```bash
cd scraper
cp .env.example .env
# Completar SUPABASE_URL, SUPABASE_SERVICE_KEY y APIFY_API_TOKEN en .env
npm install
npm run dev
```

### Autenticación

El frontend requiere login (Supabase Auth, email/password). Crear el usuario manualmente en el dashboard de Supabase (**Authentication → Users → Add user**) — ver `SUPABASE_SETUP.md` para el detalle. Sin sesión iniciada, cualquier ruta del CRM redirige a `/login`.

## Variables de entorno

### Frontend (`frontend/.env`)

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anon/public de Supabase |
| `VITE_SCRAPER_URL` | URL del microservicio scraper (ej. `http://localhost:3005`) |

### Scraper (`scraper/.env`)

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Clave service_role de Supabase (nunca exponer en el frontend) |
| `APIFY_API_TOKEN` | Token de API de Apify |
| `PORT` | Puerto del microservicio (default 3001) |

**Importante:** `.env.example` en ambas carpetas debe contener solo placeholders. Las credenciales reales van únicamente en `.env` / `.env.local`, que están en `.gitignore`.
