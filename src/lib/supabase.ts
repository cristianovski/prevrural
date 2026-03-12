import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Logs apenas em desenvolvimento
if (import.meta.env.DEV) {
  console.log("🔍 VITE_SUPABASE_URL:", supabaseUrl ? "Carregada" : "VAZIA!");
  console.log("🔍 VITE_SUPABASE_ANON_KEY:", supabaseAnonKey ? "Chave encontrada!" : "CHAVE VAZIA!");
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("🚨 ERRO FATAL: Variáveis de ambiente do Supabase não carregadas. Verifique o arquivo .env");
}

export const supabase = createClient(
  supabaseUrl || 'https://fallback.supabase.co',
  supabaseAnonKey || 'fallback'
);