# crm-leads

Sistema CRM para captación y gestión de leads, compuesto por un frontend React y un scraper Node.js que obtiene datos mediante Outscraper y los almacena en Supabase.

## Estructura del proyecto

```
crm-leads/
├── frontend/   # Aplicación React (Vite + Tailwind + React Router)
├── scraper/    # Servicio Node.js (Express + Axios + Outscraper)
├── .gitignore
└── README.md
```

## Requisitos

- Node.js >= 18
- Cuenta en [Supabase](https://supabase.com)
- API Key de [Outscraper](https://outscraper.com)

## Configuración

### Frontend

```bash
cd frontend
cp .env.example .env
# Completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env
npm install
npm run dev
```

### Scraper

```bash
cd scraper
cp .env.example .env
# Completar SUPABASE_URL, SUPABASE_SERVICE_KEY y OUTSCRAPER_API_KEY en .env
npm install
npm run dev
```

## Variables de entorno

### Frontend (`frontend/.env`)

| Variable | Descripción |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Clave anon/public de Supabase |

### Scraper (`scraper/.env`)

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Clave service_role de Supabase |
| `OUTSCRAPER_API_KEY` | API Key de Outscraper |
