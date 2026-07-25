-- ============================================================
-- SEED FINANZAS CASA
-- Ejecutar DESPUÉS de migration_v6.sql
-- ============================================================

-- ── SALDOS (estado al 06/07/2026) ────────────────────────────

INSERT INTO casa_saldos (fecha, bbva, mercadopago, efectivo, cuenta_dni, dolarapp_usd, tipo_cambio)
VALUES ('2026-07-06', 1783395, 16900, 0, 0.40, 1092, 1525);


-- ── GASTOS FIJOS JUNIO (mes = '2026-06') ─────────────────────
-- Todos pagados (mes cerrado)

INSERT INTO casa_gastos_fijos (mes, nombre, monto, vencimiento_dia, pagado) VALUES
  ('2026-06', 'BBVA',           900000,  6,  true),
  ('2026-06', 'Seguro Auto/casa', 130000, 1,  true),
  ('2026-06', 'ICBC',            60000,  6,  true),
  ('2026-06', 'Naranja Tarjeta', 15000,  6,  true),
  ('2026-06', 'Inmobiliaria',   1100000, 10, true),
  ('2026-06', 'Contador',        18000,  NULL, true),
  ('2026-06', 'Maternal',       175000,  NULL, true),
  ('2026-06', 'Monotributo',    110000,  NULL, true),
  ('2026-06', 'Préstamo TERE',  430000,  6,  true),
  ('2026-06', 'Servicios',      130000,  NULL, true);


-- ── INGRESOS JUNIO (mes = '2026-06') ─────────────────────────
-- Todos cobrados (mes cerrado)

INSERT INTO casa_ingresos (mes, nombre, tipo, moneda, monto, cobrado) VALUES
  ('2026-06', 'Sueldo DolarApp',        'sueldo_usd', 'usd',  2392,   true),
  ('2026-06', 'HOLAHELLO',              'freelance',  'ars',  700800, true),
  ('2026-06', 'iP Hoteles',             'freelance',  'ars',  100000, true),
  ('2026-06', 'Jero Montagna',          'freelance',  'ars',  200000, true),
  ('2026-06', 'App GYM',                'freelance',  'ars',  69900,  true),
  ('2026-06', 'Percepción IVA Devoluc.','freelance',  'ars',  231380, true);


-- ── GASTOS FIJOS JULIO (mes = '2026-07') ─────────────────────

INSERT INTO casa_gastos_fijos (mes, nombre, monto, vencimiento_dia, pagado) VALUES
  ('2026-07', 'BBVA',             960000,  6,   true),   -- pagado el 06/07
  ('2026-07', 'Seguro Auto/casa', 128700,  1,   true),   -- pagado el 01/07
  ('2026-07', 'ICBC',              60000,  7,   false),  -- pagar mañana
  ('2026-07', 'Naranja Tarjeta',   15000,  7,   false),  -- pagar mañana
  ('2026-07', 'Inmobiliaria',    1100000,  10,  false),  -- pagar mañana
  ('2026-07', 'Contador',          18000,  NULL, false),
  ('2026-07', 'Maternal',         160000,  NULL, false),
  ('2026-07', 'Monotributo',      110000,  NULL, false),
  ('2026-07', 'Préstamo TERE',    457500,  6,   true),   -- pagado el 06/07
  ('2026-07', 'Servicios',        130000,  NULL, false),
  ('2026-07', 'Patente Focus',     28880,  NULL, true);  -- pagado el 06/07


-- ── INGRESOS JULIO (mes = '2026-07') ─────────────────────────

INSERT INTO casa_ingresos (mes, nombre, tipo, moneda, monto, cobrado) VALUES
  ('2026-07', 'Sueldo DolarApp',        'sueldo_usd', 'usd',  2392,   true),   -- impactó el 06/07
  ('2026-07', 'HOLAHELLO',              'freelance',  'ars',  722400, true),   -- cobrado el 02/07
  ('2026-07', 'Percepción IVA Devoluc.','freelance',  'ars',  231380, true),   -- cobrado el 30/06
  ('2026-07', 'iP Hoteles',             'freelance',  'ars',  180600, false),  -- pendiente
  ('2026-07', 'Jero Montagna',          'freelance',  'ars',  200000, false),  -- fin de mes
  ('2026-07', 'Megacompras',            'freelance',  'ars',  390000, false),  -- pendiente
  ('2026-07', 'Peak',                   'freelance',  'ars',  90300,  false);  -- pendiente
