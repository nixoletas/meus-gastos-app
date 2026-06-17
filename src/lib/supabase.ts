import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Indica se o app foi configurado com as credenciais do Supabase.
 * Quando false, mostramos uma tela de aviso em vez de quebrar o app.
 */
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

export const supabase = createClient(
  // Valores "placeholder" evitam que createClient lance erro quando não configurado.
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // Só faz sentido detectar sessão na URL no ambiente web (links mágicos / OAuth).
      detectSessionInUrl: Platform.OS === 'web',
    },
  }
);
