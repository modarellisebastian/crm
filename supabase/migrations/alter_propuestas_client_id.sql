alter table public.propuestas
  add column if not exists client_id uuid null references public.clients(id) on delete set null;

create index if not exists propuestas_client_id_idx on public.propuestas(client_id);
