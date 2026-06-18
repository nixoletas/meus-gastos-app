import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '../src/components/PressableScale';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/theme/ThemeContext';
import { notifySuccess, notifyWarning } from '../src/utils/sound';

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  async function handleSubmit() {
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    const { error: err } = isSignup
      ? await signUp(email, password)
      : await signIn(email, password);
    setLoading(false);

    if (err) {
      setError(err);
      notifyWarning();
    } else if (isSignup) {
      notifySuccess();
      setInfo(
        'Conta criada! Se a confirmação de e-mail estiver ativa no Supabase, confirme pelo link enviado.'
      );
      setMode('login');
    } else {
      notifySuccess();
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.content}>
          <View style={[styles.logo, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="wallet" size={40} color={colors.onPrimary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Meus Gastos</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {isSignup
              ? 'Crie sua conta para começar a controlar os gastos.'
              : 'Entre para acessar seus gastos em qualquer lugar.'}
          </Text>

          <View style={styles.form}>
            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="email-outline" size={20} color={colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <View style={[styles.inputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Senha"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete={isSignup ? 'new-password' : 'password'}
                textContentType={isSignup ? 'newPassword' : 'password'}
                style={[styles.input, { color: colors.text }]}
                onSubmitEditing={handleSubmit}
              />
            </View>

            {error && (
              <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
            )}
            {info && (
              <Text style={[styles.info, { color: colors.success }]}>{info}</Text>
            )}

            <PressableScale
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              {loading ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                  {isSignup ? 'Criar conta' : 'Entrar'}
                </Text>
              )}
            </PressableScale>

            <Pressable
              onPress={() => {
                setMode(isSignup ? 'login' : 'signup');
                setError(null);
                setInfo(null);
              }}
              style={styles.switch}
            >
              <Text style={[styles.switchText, { color: colors.textMuted }]}>
                {isSignup ? 'Já tem conta? ' : 'Ainda não tem conta? '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  {isSignup ? 'Entrar' : 'Criar agora'}
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center' },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
    lineHeight: 22,
  },
  form: { gap: 14 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 54,
  },
  input: { flex: 1, fontSize: 16, height: '100%' },
  error: { fontSize: 14, marginTop: -2 },
  info: { fontSize: 14, marginTop: -2, lineHeight: 20 },
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  buttonText: { fontSize: 17, fontWeight: '700' },
  switch: { alignItems: 'center', marginTop: 8 },
  switchText: { fontSize: 15 },
});
