import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// RADARES INJETADOS (Vão aparecer no Console do Navegador)
console.log("🔍 Lendo URL do Supabase:", supabaseUrl);
console.log("🔍 Lendo Chave do Supabase:", supabaseKey ? "Chave encontrada!" : "CHAVE VAZIA!");

if (!supabaseUrl || !supabaseKey) {
  console.error("🚨 ERRO FATAL: As variáveis de ambiente do .env não foram carregadas pelo Vite!");
}

export const supabase = createClient(supabaseUrl || 'https://falha.supabase.co', supabaseKey || 'falha');