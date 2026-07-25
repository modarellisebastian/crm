-- Generaliza el scraper más allá del nicho de gimnasios: los criterios de
-- exclusión de cadenas y los umbrales de scoring dejan de estar hardcodeados
-- en scrape.js y pasan a ser configurables por ciudad+rubro. Los defaults
-- reproducen exactamente el comportamiento anterior (hardcodeado para
-- gimnasios en Argentina/español).

ALTER TABLE scraper_config
  ADD COLUMN IF NOT EXISTS excluir_keywords       text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pais                    text    NOT NULL DEFAULT 'AR',
  ADD COLUMN IF NOT EXISTS idioma                  text    NOT NULL DEFAULT 'es',
  ADD COLUMN IF NOT EXISTS reviews_sweet_spot_min  integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS reviews_sweet_spot_max  integer NOT NULL DEFAULT 150,
  ADD COLUMN IF NOT EXISTS reviews_grande_max      integer NOT NULL DEFAULT 300;
