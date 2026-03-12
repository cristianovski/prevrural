import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'

// Sentry (monitoramento de erros) - v8
import * as Sentry from "@sentry/react"
import { browserTracingIntegration, replayIntegration } from "@sentry/react"

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      browserTracingIntegration(),
      replayIntegration(),
    ],
    // Tracing (performance)
    tracesSampleRate: 1.0, // 100% das transações (ajuste para 0.1 em produção)
    // Replay (gravação de sessões)
    replaysSessionSampleRate: 0.1, // 10% das sessões normais
    replaysOnErrorSampleRate: 1.0, // 100% quando ocorre erro
    environment: import.meta.env.MODE, // 'development' ou 'production'
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)