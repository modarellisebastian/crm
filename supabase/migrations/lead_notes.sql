-- Tabla de notas por lead
-- Ejecutar en Supabase SQL Editor

create table if not exists lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads(id) on delete cascade,
  texto      text not null,
  created_at timestamptz not null default now()
);

-- Índice para consultas por lead
create index if not exists lead_notes_lead_id_idx on lead_notes(lead_id);

-- RLS: solo el usuario autenticado puede ver/escribir sus notas
alter table lead_notes enable row level security;

create policy "allow all for authenticated"
  on lead_notes for all
  to authenticated
  using (true)
  with check (true);
