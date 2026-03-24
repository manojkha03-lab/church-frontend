import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const renderFatal = (error) => {
  const root = document.getElementById('root')
  if (!root) return

  const message = error?.message || 'Unknown startup error'
  root.innerHTML = `
    <div style="background:#b91c1c;color:#fff;padding:20px;font-family:Arial,sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;">
      <div style="max-width:720px;background:rgba(0,0,0,0.2);padding:20px;border-radius:12px;">
        <h1 style="margin:0 0 10px;">App Failed to Load</h1>
        <p style="margin:0 0 8px;">${message}</p>
        <p style="margin:0 0 16px;opacity:0.9;">Open browser console for details, then reload.</p>
        <button onclick="location.reload()" style="background:#fff;color:#b91c1c;border:none;padding:10px 14px;border-radius:8px;cursor:pointer;font-weight:700;">Reload Page</button>
      </div>
    </div>
  `
}

const bootstrap = async () => {
  try {
    const root = document.getElementById('root')
    if (!root) {
      throw new Error('Missing root element (#root)')
    }

    // Dynamic import ensures App module errors are catchable and visible to users.
    const { default: App } = await import('./App.jsx')

    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  } catch (error) {
    console.error('Startup crash:', error)
    renderFatal(error)
  }
}

window.addEventListener('error', (event) => {
  console.error('Global runtime error:', event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
})

bootstrap()