create table if not exists client_notes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  texto      text not null,
  created_at timestamptz not null default now()
);
create index if not exists client_notes_client_id_idx on client_notes(client_id);
alter table client_notes enable row level security;
create policy "allow all for authenticated"
  on client_notes for all
  to authenticated
  using (true) with check (true);
