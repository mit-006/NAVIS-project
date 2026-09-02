import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'

// Global error handler to catch React errors
window.addEventListener('error', (event) => {
  console.error('[GLOBAL ERROR]', event.error);
  document.title = 'ERROR: ' + (event.error?.message || 'unknown');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[UNHANDLED REJECTION]', event.reason);
  document.title = 'REJECTION: ' + (event.reason?.message || 'unknown');
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </ErrorBoundary>,
)
