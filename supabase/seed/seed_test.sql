-- ============================================================
-- SEED DE DATOS DE TEST (data ficticia, no confundir con datos reales)
-- Ejecutar en Supabase → SQL Editor, después de aplicar supabase/migrations/
-- ============================================================

-- ─── LEADS (10) ───────────────────────────────────────────────────────────────

INSERT INTO leads (id, nombre, rubro, ciudad, tiene_web, url_web, telefono, estado, created_at, fecha_ultimo_movimiento) VALUES

  -- Nuevos (captados hoy y ayer)
  ('11111111-0001-0001-0001-000000000001',
   'Panadería El Trigo', 'Restaurante', 'Tandil',
   false, null, '2494-445566', 'nuevo',
   now(), now()),

  ('11111111-0001-0001-0001-000000000002',
   'Veterinaria Norte', 'Veterinaria', 'Olavarría',
   true, 'https://vetnorte.com.ar', '2284-112233', 'nuevo',
   now() - interval '5 hours', now() - interval '5 hours'),

  -- Contactados
  ('11111111-0001-0001-0001-000000000003',
   'Peluquería Estilo & Co', 'Peluquería', 'Azul',
   false, null, '2281-334455', 'contactado',
   now() - interval '3 days', now() - interval '2 days'),

  ('11111111-0001-0001-0001-000000000004',
   'Odontología Sonrisa', 'Odontología', 'Bolívar',
   true, 'https://sonrisabolivar.com', '2314-556677', 'contactado',
   now() - interval '5 days', now() - interval '4 days'),

  -- Demo enviado
  ('11111111-0001-0001-0001-000000000005',
   'Ferretería Central', 'Ferretería', 'Tandil',
   false, null, '2494-778899', 'demo_enviado',
   now() - interval '8 days', now() - interval '6 days'),

  -- Negociando
  ('11111111-0001-0001-0001-000000000006',
   'Contaduría López & Asoc.', 'Contaduría', 'Olavarría',
   true, 'https://lopezcontadores.com.ar', '2284-990011', 'negociando',
   now() - interval '12 days', now() - interval '9 days'),

  -- Cerrados este mes (necesitan fecha_ultimo_movimiento en el mes actual)
  ('11111111-0001-0001-0001-000000000007',
   'Farmacia San Martín', 'Farmacia', 'Tandil',
   true, 'https://farmaciasanmartin.com.ar', '2494-221133', 'cerrado',
   now() - interval '20 days',
   date_trunc('month', now()) + interval '5 days'),

  ('11111111-0001-0001-0001-000000000008',
   'Gimnasio FitLife', 'Gimnasio', 'Azul',
   false, null, '2281-443355', 'cerrado',
   now() - interval '25 days',
   date_trunc('month', now()) + interval '8 days'),

  -- Descartado
  ('11111111-0001-0001-0001-000000000009',
   'Restaurante La Pampa', 'Restaurante', 'Bolívar',
   false, null, '2314-665544', 'descartado',
   now() - interval '15 days', now() - interval '14 days'),

  -- Otro nuevo (para que la tabla de últimos leads muestre variedad)
  ('11111111-0001-0001-0001-000000000010',
   'Veterinaria Del Sur', 'Veterinaria', 'Tandil',
   true, 'https://vetsur.com.ar', '2494-887766', 'nuevo',
   now() - interval '1 hour', now() - interval '1 hour');


-- ─── CLIENTS (2 clientes, de los leads cerrados) ──────────────────────────────

INSERT INTO clients (id, lead_id, nombre, fecha_inicio, fecha_vencimiento_hosting, url_sitio_entregado, created_at) VALUES

  ('22222222-0002-0002-0002-000000000001',
   '11111111-0001-0001-0001-000000000007',
   'Farmacia San Martín',
   date_trunc('month', now())::date + 5,
   (date_trunc('month', now()) + interval '1 year')::date,
   'https://farmaciasanmartin.com.ar',
   date_trunc('month', now()) + interval '5 days'),

  ('22222222-0002-0002-0002-000000000002',
   '11111111-0001-0001-0001-000000000008',
   'Gimnasio FitLife',
   date_trunc('month', now())::date + 8,
   (date_trunc('month', now()) + interval '1 year')::date,
   null,
   date_trunc('month', now()) + interval '8 days');


-- ─── PAYMENTS ─────────────────────────────────────────────────────────────────

INSERT INTO payments (client_id, tipo, monto, fecha_cobro, pagado) VALUES

  -- Farmacia San Martín
  ('22222222-0002-0002-0002-000000000001', 'proyecto',      85000,
   (date_trunc('month', now()) + interval '5 days')::date,  true),

  ('22222222-0002-0002-0002-000000000001', 'mantenimiento', 15000,
   (date_trunc('month', now()) + interval '10 days')::date, true),

  ('22222222-0002-0002-0002-000000000001', 'hosting',        4500,
   (date_trunc('month', now()) + interval '10 days')::date, false),

  -- Gimnasio FitLife
  ('22222222-0002-0002-0002-000000000002', 'proyecto',      60000,
   (date_trunc('month', now()) + interval '8 days')::date,  true),

  ('22222222-0002-0002-0002-000000000002', 'mantenimiento', 12000,
   (date_trunc('month', now()) + interval '12 days')::date, false),

  ('22222222-0002-0002-0002-000000000002', 'hosting',        4500,
   (date_trunc('month', now()) + interval '12 days')::date, false);
