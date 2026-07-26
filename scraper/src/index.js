import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import scrapeRouter from './routes/scrape.js'
import { requireApiKey } from './middleware/requireApiKey.js'

const app = express()
const PORT = process.env.PORT || 3005

// Sin ALLOWED_ORIGIN configurado, asume el puerto default de Vite en dev.
// La API key (ver requireApiKey) es la protección real; esto es defensa
// en profundidad para bloquear requests directas desde el navegador de
// otros orígenes.
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173'

app.use(cors({ origin: allowedOrigin }))
app.use(express.json())
app.use('/api', requireApiKey, scrapeRouter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Scraper server running on port ${PORT}`)
})
