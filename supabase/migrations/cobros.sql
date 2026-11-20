-- Tabla de cobros (reemplaza payments en el nuevo modelo)
create table public.cobros (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.clients(id) on delete cascade,
  servicio_id         uuid null references public.servicios(id) on delete set null,
  descripcion         text not null,
  monto               numeric(12,2) not null default 0,
  moneda              text not null default 'ars'
                      check (moneda in ('ars', 'usd')),
  tipo_cambio         numeric(10,2) null,       -- solo para cobros en USD
  monto_ars           numeric(12,2) null,       -- calculado al cobrar
  fecha_vencimiento   date null,
  fecha_cobro         date null,
  pagado              boolean not null default false,
  movimiento_casa_id  uuid null,                -- FK a casa_movimientos (sin constraint para evitar cross-schema issues)
  notas               text null,
  created_at          timestamptz not null default now()
);

create index if not exists cobros_client_id_idx   on public.cobros(client_id);
create index if not exists cobros_pagado_idx       on public.cobros(pagado);
create index if not exists cobros_fecha_venc_idx   on public.cobros(fecha_vencimiento);

alter table public.cobros enable row level security;
create policy "allow all for authenticated"
  on public.cobros for all
  to authenticated
  using (true) with check (true);
