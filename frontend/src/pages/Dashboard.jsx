import React, { useState, useEffect } from 'react'
import MapView from '../components/MapView'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const Dashboard = () => {
  const [healthStatus, setHealthStatus] = useState(null)

  useEffect(() => {
    // Test connection to backend
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(err => console.error('Backend connection failed:', err))
  }, [])

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 relative">
          <MapView />
          {healthStatus && (
            <div className="absolute top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
              Backend: {healthStatus.status}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
