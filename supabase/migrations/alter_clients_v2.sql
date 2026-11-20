-- Nuevos campos para gestión de clientes completa
alter table public.clients
  add column if not exists cuit            text null,
  add column if not exists direccion       text null,
  add column if not exists condicion_iva   text null default 'monotributo',
  add column if not exists web             text null,
  add column if not exists instagram       text null,
  add column if not exists tipo            text not null default 'puntual'
    check (tipo in ('recurrente', 'puntual'));
