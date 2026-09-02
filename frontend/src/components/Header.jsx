import React from 'react'

const Header = () => {
  return (
    <header className="bg-blue-900 text-white px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center font-bold">
            RQ
          </div>
          <h1 className="text-xl font-bold">NAVIS</h1>
          <span className="text-blue-200 text-sm ml-2">Disaster Management Decision Support</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-blue-200">Prototype v0.1</span>
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-sm">
            A
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
