
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // Use bracket notation to access properties on import.meta to avoid TS compiler errors if types are missing
  // or use the standard Vite approach if @types/vite is not available.
  const meta = import.meta as any;
  if (meta.env && meta.env[key]) {
    return meta.env[key];
  }
  // Fallback para process.env (Vercel Edge/SSR)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Se as variáveis estiverem vazias, o Supabase jogará erro de 'Invalid URL' ou 'Failed to fetch'
export const supabase = createClient(
  supabaseUrl || 'https://chyxrfpcxptdmtbhvmui.supabase.co', 
  supabaseAnonKey || ''
);
