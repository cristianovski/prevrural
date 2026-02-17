import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// --- 1. IMPORTAÇÕES (Sentry + PWA) ---
import * as Sentry from "@sentry/react"; // Monitoramento
import { registerSW } from 'virtual:pwa-register' // Funcionalidade de App Instalável

// --- 2. CONFIGURAÇÃO DO SENTRY (Monitoramento de Erros) ---
Sentry.init({
  // Sua chave DSN real que você me passou
  dsn: "https://4b8216174c35c0936f489aa9f2ff6a82@o4510892803293184.ingest.de.sentry.io/4510892905791568",

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Performance (1.0 = 100% das transações)
  tracesSampleRate: 1.0, 
  
  // Gravação de Tela (Replay)
  replaysOnErrorSampleRate: 1.0, // Grava 100% das vezes que der erro
  replaysSessionSampleRate: 0.1, // Grava 10% das sessões normais (pra ver uso)
});

// --- 3. CONFIGURAÇÃO DO PWA (Atualização do App) ---
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Nova versão disponível. Atualizar agora?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("App pronto para usar offline!");
  },
})

// --- 4. RENDERIZAÇÃO ---
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)