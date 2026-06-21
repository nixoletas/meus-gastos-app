import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Session } from '@supabase/supabase-js';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

// Client ID Web do Google (audiência do ID token). O client Android (pacote + SHA-1)
// autoriza o dispositivo e é configurado no Google Cloud, não aqui.
const GOOGLE_WEB_CLIENT_ID =
  '436861130559-3ist73kgtuhel59p28vol4brr63lm054.apps.googleusercontent.com';

GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

type AuthResult = { error: string | null };

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  /** Entra/cria conta com o Google. */
  signInWithGoogle: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Traduz mensagens comuns de erro do Supabase/Google para português. */
function traduzErro(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('network')) return 'Sem conexão. Verifique sua internet.';
  if (m.includes('play services'))
    return 'Google Play Services indisponível ou desatualizado.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas. Aguarde um instante e tente de novo.';
  return message;
}

/** Erros de cancelamento do usuário não devem virar mensagem de erro. */
function foiCancelado(e: any): boolean {
  const s = `${e?.code ?? ''} ${e?.message ?? ''}`.toLowerCase();
  return s.includes('cancel') || s.includes('-5') || s.includes('12501');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle: AuthContextValue['signInWithGoogle'] = async () => {
    try {
      // Login nativo via Google Play Services e troca do ID token por sessão.
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        return { error: null }; // usuário cancelou
      }

      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      return { error: error ? traduzErro(error.message) : null };
    } catch (e: any) {
      if (foiCancelado(e)) return { error: null };
      return { error: traduzErro(String(e?.message ?? e)) };
    }
  };

  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignora — pode não haver sessão Google ativa
    }
    await supabase.auth.signOut();
  };

  const deleteAccount: AuthContextValue['deleteAccount'] = async () => {
    const { error } = await supabase.rpc('delete_account');
    if (error) return { error: traduzErro(error.message) };
    await signOut();
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        configured: isSupabaseConfigured,
        signInWithGoogle,
        signOut,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
}
