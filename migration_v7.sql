-- ============================================================
-- MIGRACIÓN V7 — ENDURECER RLS DE TABLAS CASA_*
-- Pegar en Supabase → SQL Editor → Run
--
-- migration_v6.sql dejó las políticas de casa_saldos, casa_gastos_fijos
-- y casa_ingresos como "FOR ALL USING (true)" sin restringir el rol,
-- es decir accesibles incluso sin sesión (más laxo que el resto de las
-- tablas del CRM, que ya exigen el rol `authenticated`). Esta migración
-- las alinea con el resto del esquema ahora que el frontend implementa
-- login real.
-- ============================================================

DROP POLICY IF EXISTS "allow all casa_saldos"       ON casa_saldos;
DROP POLICY IF EXISTS "allow all casa_gastos_fijos" ON casa_gastos_fijos;
DROP POLICY IF EXISTS "allow all casa_ingresos"     ON casa_ingresos;

CREATE POLICY "casa_saldos: select" ON casa_saldos FOR SELECT TO authenticated USING (true);
CREATE POLICY "casa_saldos: insert" ON casa_saldos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "casa_saldos: update" ON casa_saldos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "casa_saldos: delete" ON casa_saldos FOR DELETE TO authenticated USING (true);

CREATE POLICY "casa_gastos_fijos: select" ON casa_gastos_fijos FOR SELECT TO authenticated USING (true);
CREATE POLICY "casa_gastos_fijos: insert" ON casa_gastos_fijos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "casa_gastos_fijos: update" ON casa_gastos_fijos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "casa_gastos_fijos: delete" ON casa_gastos_fijos FOR DELETE TO authenticated USING (true);

CREATE POLICY "casa_ingresos: select" ON casa_ingresos FOR SELECT TO authenticated USING (true);
CREATE POLICY "casa_ingresos: insert" ON casa_ingresos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "casa_ingresos: update" ON casa_ingresos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "casa_ingresos: delete" ON casa_ingresos FOR DELETE TO authenticated USING (true);
