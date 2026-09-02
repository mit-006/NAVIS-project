// API service for communicating with the backend
const API_BASE = '/api'

export const healthCheck = async () => {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}

export const getRiskData = async (regionId) => {
  const res = await fetch(`${API_BASE}/risk/${regionId}`)
  return res.json()
}

export const getRedZones = async () => {
  const res = await fetch(`${API_BASE}/redzones`)
  return res.json()
}

export const getRelocationSites = async () => {
  const res = await fetch(`${API_BASE}/relocationsites`)
  return res.json()
}
