import express from 'express'
const router = express.Router()

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'navis-backend',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  })
})

export default router
