import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificação de segurança para não quebrar o app silenciosamente
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('As chaves do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) estão faltando no arquivo .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);