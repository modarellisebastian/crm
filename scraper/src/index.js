import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import scrapeRouter from './routes/scrape.js'

const app = express()
const PORT = process.env.PORT || 3005

app.use(cors())
app.use(express.json())
app.use('/api', scrapeRouter)

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(PORT, () => {
  console.log(`Scraper server running on port ${PORT}`)
})
