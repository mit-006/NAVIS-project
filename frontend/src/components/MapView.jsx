import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

const MapView = () => {
  // Default center (placeholder - will be replaced with actual pilot region coordinates)
  const defaultPosition = [28.6139, 77.2090] // Delhi placeholder

  return (
    <MapContainer
      center={defaultPosition}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={defaultPosition}>
        <Popup>
          <div>
            <h3 className="font-bold">Pilot Region</h3>
            <p className="text-sm text-gray-600">Sample marker for prototype</p>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default MapView
