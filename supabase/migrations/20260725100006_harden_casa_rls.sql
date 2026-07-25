-- El histórico migration_v6.sql había creado las políticas de casa_saldos,
-- casa_gastos_fijos y casa_ingresos como "FOR ALL USING (true)" sin
-- restringir el rol ("allow all casa_*"), es decir accesibles incluso sin
-- sesión iniciada — más laxo que el resto de las tablas del CRM, que ya
-- exigían `authenticated`. Las políticas correctas ya se crean en
-- 20260725100005_casa_finanzas.sql; esta migración solo elimina las
-- laxas históricas si todavía existen en la base (equivalente al
-- histórico migration_v7.sql).

DROP POLICY IF EXISTS "allow all casa_saldos"       ON casa_saldos;
DROP POLICY IF EXISTS "allow all casa_gastos_fijos" ON casa_gastos_fijos;
DROP POLICY IF EXISTS "allow all casa_ingresos"     ON casa_ingresos;
