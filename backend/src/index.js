import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import healthRoutes from './routes/health.js'
import riskRoutes from './routes/risk.js'

dotenv.config()

const app = express()
const PORT = Number(process.env.PORT || 3000)

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.disable('x-powered-by')
app.use(cors({
  origin: allowedOrigins,
  credentials: false,
}))
app.use(express.json({ limit: '100kb' }))

app.use('/api', healthRoutes)
app.use('/api', riskRoutes)

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON request body' })
  }
  console.error('Unhandled backend error:', err)
  return res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`NAVIS Backend running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
