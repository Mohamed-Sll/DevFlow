import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { readBrowserPreference } from './lib/browser-storage'

const storedTheme = readBrowserPreference('app-theme-mode')
document.documentElement.setAttribute('data-theme', storedTheme === 'light' ? 'light' : 'dark')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.warn('O modo offline não ficou disponível neste navegador.', error)
    })
  }, { once: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
