import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Importa o registrador do PWA
import { registerSW } from 'virtual:pwa-register'

// Força a atualização do App se houver nova versão
const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm("Nova versão disponível. Atualizar?")) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log("App pronto para usar offline!");
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)