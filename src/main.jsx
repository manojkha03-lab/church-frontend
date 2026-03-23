import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

console.log('Starting church web app...')

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
  console.log('App rendered successfully!')
} catch (error) {
  console.error('Failed to render app:', error)
  // Fallback UI
  document.getElementById('root').innerHTML = `
    <div style="background: red; color: white; padding: 20px; font-family: Arial;">
      <h1>❌ App Failed to Load</h1>
      <p>Error: ${error.message}</p>
      <p>Check the browser console for more details.</p>
      <button onclick="location.reload()" style="background: white; color: red; border: none; padding: 10px; cursor: pointer;">Reload Page</button>
    </div>
  `
}