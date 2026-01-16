
import { createClient } from '@supabase/supabase-js';

// Tenta obter de múltiplas fontes comuns em ambientes de deploy
const supabaseUrl = 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  (process as any).env?.VITE_SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  (process as any).env?.VITE_SUPABASE_ANON_KEY || 
  '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.error("ERRO CRÍTICO: As chaves do Supabase não foram encontradas!");
  console.info("Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão configuradas no painel da Vercel em 'Environment Variables'.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
