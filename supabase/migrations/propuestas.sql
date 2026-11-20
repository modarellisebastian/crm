-- Tabla de propuestas comerciales
create table if not exists propuestas (
  id           uuid primary key default gen_random_uuid(),
  numero       text not null unique,
  cliente_nombre text not null,
  asunto       text not null,
  monto        numeric(12,2) not null default 0,
  fecha        date not null default current_date,
  estado       text not null default 'borrador'
               check (estado in ('borrador', 'enviada', 'aceptada', 'rechazada')),
  notas        text,
  created_at   timestamptz not null default now()
);

create index if not exists propuestas_estado_idx on propuestas(estado);
create index if not exists propuestas_fecha_idx  on propuestas(fecha desc);

alter table propuestas enable row level security;

create policy "allow all for authenticated"
  on propuestas for all
  to authenticated
  using (true)
  with check (true);
