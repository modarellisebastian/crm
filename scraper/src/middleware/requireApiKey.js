import { timingSafeEqual } from 'crypto'

// Protege las rutas de negocio (scraping, enriquecimiento) con un secreto
// compartido entre el frontend y este microservicio. Sin esto, cualquiera
// que llegue a la URL del scraper podía disparar scraping y consumir
// crédito de Apify sin ningún control.
export function requireApiKey(req, res, next) {
  const expected = process.env.SCRAPER_API_KEY
  if (!expected) {
    console.warn('[scraper] SCRAPER_API_KEY no está configurada — rechazando todas las requests. Definila en scraper/.env')
    return res.status(500).json({ error: 'Servidor mal configurado: falta SCRAPER_API_KEY' })
  }

  const provided = req.get('x-scraper-api-key') || ''
  const bufExpected = Buffer.from(expected)
  const bufProvided = Buffer.from(provided)

  const valido = bufExpected.length === bufProvided.length && timingSafeEqual(bufExpected, bufProvided)

  if (!valido) {
    return res.status(401).json({ error: 'API key inválida o faltante' })
  }

  next()
}
