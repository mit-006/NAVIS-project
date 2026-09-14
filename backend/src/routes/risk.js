import express from 'express'
const router = express.Router()

// These routes are intentionally explicit until the real risk engine is wired in.
router.get('/risk/:regionId', (req, res) => {
  const regionId = String(req.params.regionId || '').trim()
  if (!regionId || regionId.length > 100 || !/^[a-zA-Z0-9_-]+$/.test(regionId)) {
    return res.status(400).json({ error: 'Invalid regionId' })
  }

  return res.status(501).json({
    regionId,
    status: 'not_implemented',
    message: 'Risk assessment is currently computed from the static frontend datasets; backend risk calculation is not implemented.'
  })
})

router.get('/redzones', (req, res) => {
  return res.status(501).json({
    type: 'FeatureCollection',
    features: [],
    status: 'not_implemented',
    message: 'Red zones API is not implemented.'
  })
})

router.get('/relocationsites', (req, res) => {
  return res.status(501).json({
    sites: [],
    status: 'not_implemented',
    message: 'Relocation sites API is not implemented.'
  })
})

export default router
