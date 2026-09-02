import React from 'react'

const Sidebar = () => {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 mb-2">Layers</h2>
        <div className="space-y-2 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded" />
            <span>Risk Assessment</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Flood Hazard</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Landslide Risk</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Red Zones</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span>Evacuation Routes</span>
          </label>
        </div>
      </div>
      
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-800 mb-2">Risk Summary</h2>
        <div className="text-sm space-y-1 text-gray-600">
          <p>High Risk Zones: <span className="font-medium text-red-600">--</span></p>
          <p>Medium Risk Zones: <span className="font-medium text-yellow-600">--</span></p>
          <p>Vulnerable Habitations: <span className="font-medium text-orange-600">--</span></p>
        </div>
      </div>

      <div className="p-4">
        <h2 className="font-semibold text-gray-800 mb-2">Quick Actions</h2>
        <div className="space-y-2">
          <button className="w-full bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
            Run Risk Assessment
          </button>
          <button className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors">
            Generate Report
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
