-- Agrega campo notas opcional a movimientos de casa
ALTER TABLE casa_movimientos ADD COLUMN IF NOT EXISTS notas text;
