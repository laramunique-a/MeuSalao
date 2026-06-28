import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './styles/globals.css'
import { registerSW } from 'virtual:pwa-register'

// Inicializa o Sentry para monitoramento de erros em produção
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE, // 'development' ou 'production'
  enabled: import.meta.env.PROD, // Só ativa em produção (Vercel) — não polui em dev
  integrations: [
    Sentry.replayIntegration({
      // Mascara dados sensíveis automaticamente
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Captura 100% das sessões com erro, 0% das sessões normais
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
})

// Registra o Service Worker do PWA
registerSW({ immediate: true })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
