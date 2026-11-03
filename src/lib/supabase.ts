import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Valida se as variáveis de ambiente do Supabase foram configuradas corretamente.
 */
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== 'https://seu-projeto.supabase.co' &&
    supabaseAnonKey !== 'sua-chave-anon-publica' &&
    !supabaseUrl.includes('seu-projeto')
  );
};

// URL e chave de fallback para evitar que a aplicação quebre durante o boot
// caso o arquivo .env ainda não tenha sido preenchido com as chaves reais.
const fallbackUrl = 'https://placeholder-project.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder';

export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured() ? supabaseAnonKey : fallbackKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Inicia o fluxo real de autenticação com o Google OAuth via Supabase Auth.
 */
export const signInWithGoogle = async () => {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase não configurado. Por favor, adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ao seu arquivo .env.'
    );
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Encerra a sessão do usuário no Supabase e limpa os dados persistidos no navegador.
 */
export const signOutUser = async () => {
  if (!isSupabaseConfigured()) {
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

