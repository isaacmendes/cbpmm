
import { createClient } from '@supabase/supabase-js';

// No Vite/Vercel, as variáveis VITE_ são expostas em import.meta.env
// Usamos uma abordagem segura para evitar quebra de script
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Atenção: Variáveis de ambiente do Supabase não encontradas. Verifique o arquivo .env ou as configurações da Vercel.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);
