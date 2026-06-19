import { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

// Necessário para finalizar o fluxo de OAuth aberto no navegador (mobile).
WebBrowser.maybeCompleteAuthSession();

type AuthResult = { error: string | null };

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  configured: boolean;
  /** Entra/cria conta com o Google. */
  signInWithGoogle: () => Promise<AuthResult>;
  /** Envia um código (OTP) de 6 dígitos para o e-mail. */
  sendEmailOtp: (email: string) => Promise<AuthResult>;
  /** Confirma o código de 6 dígitos e autentica. */
  verifyEmailOtp: (email: string, token: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<AuthResult>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Traduz mensagens comuns de erro do Supabase para português. */
function traduzErro(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('token has expired') || m.includes('expired'))
    return 'O código expirou. Peça um novo.';
  if (m.includes('invalid') && m.includes('token')) return 'Código inválido. Confira os dígitos.';
  if (m.includes('otp') && m.includes('invalid')) return 'Código inválido. Confira os dígitos.';
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return 'E-mail inválido.';
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Muitas tentativas. Aguarde um instante e tente de novo.';
  if (m.includes('network')) return 'Sem conexão. Verifique sua internet.';
  return message;
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
      if (Platform.OS === 'web') {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo:
              typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        });
        return { error: error ? traduzErro(error.message) : null };
      }

      // Mobile: abre o navegador e troca o "code" por sessão (PKCE).
      const redirectTo = Linking.createURL('/');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data?.url) {
        return { error: error ? traduzErro(error.message) : 'Falha ao abrir o Google.' };
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== 'success' || !result.url) {
        return { error: null }; // usuário cancelou
      }

      const { queryParams } = Linking.parse(result.url);
      const code = queryParams?.code as string | undefined;
      if (code) {
        const { error: exErr } = await supabase.auth.exchangeCodeForSession(code);
        return { error: exErr ? traduzErro(exErr.message) : null };
      }
      return { error: 'Não foi possível concluir o login com o Google.' };
    } catch (e: any) {
      return { error: traduzErro(String(e?.message ?? e)) };
    }
  };

  const sendEmailOtp: AuthContextValue['sendEmailOtp'] = async (email) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    return { error: error ? traduzErro(error.message) : null };
  };

  const verifyEmailOtp: AuthContextValue['verifyEmailOtp'] = async (email, token) => {
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });
    return { error: error ? traduzErro(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const deleteAccount: AuthContextValue['deleteAccount'] = async () => {
    const { error } = await supabase.rpc('delete_account');
    if (error) return { error: traduzErro(error.message) };
    await supabase.auth.signOut();
    return { error: null };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        configured: isSupabaseConfigured,
        signInWithGoogle,
        sendEmailOtp,
        verifyEmailOtp,
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
