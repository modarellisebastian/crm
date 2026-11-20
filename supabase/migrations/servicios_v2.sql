-- Drop tabla vieja de servicios y crear nueva desde cero
drop table if exists public.servicios cascade;

create table public.servicios (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  nombre      text not null,
  descripcion text null,
  tipo        text not null default 'recurrente'
              check (tipo in ('recurrente', 'unico')),
  frecuencia  text null
              check (frecuencia in ('mensual', 'bimestral', 'trimestral', 'semestral', 'anual')),
  monto       numeric(12,2) not null default 0,
  moneda      text not null default 'ars'
              check (moneda in ('ars', 'usd')),
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists servicios_client_id_idx on public.servicios(client_id);

alter table public.servicios enable row level security;
create policy "allow all for authenticated"
  on public.servicios for all
  to authenticated
  using (true) with check (true);
