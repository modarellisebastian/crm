export const SCRAPER_URL = import.meta.env.VITE_SCRAPER_URL || 'http://localhost:3005'

export function scraperHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'x-scraper-api-key': import.meta.env.VITE_SCRAPER_API_KEY || '',
    ...extra,
  }
}
