import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput as RNTextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '../src/components/Mascot';
import { PIGGY_BRAND } from '../src/components/mascotSvg';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/theme/typography';

const CODE_LENGTH = 6;

export default function OtpScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { verifyEmailOtp, sendEmailOtp } = useAuth();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(30);
  const inputRef = useRef<RNTextInput>(null);

  const emailStr = typeof email === 'string' ? email : '';

  // Foco automático no campo escondido.
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, []);

  // Contador para reenvio.
  useEffect(() => {
    if (resendIn <= 0) return;
    const id = setInterval(() => setResendIn((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [resendIn]);

  async function verify(value: string) {
    setLoading(true);
    setError(null);
    const { error: err } = await verifyEmailOtp(emailStr, value);
    setLoading(false);
    if (err) {
      setError(err);
      setCode('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // Em caso de sucesso, o AuthGate redireciona automaticamente.
  }

  function handleChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === CODE_LENGTH) {
      verify(digits);
    }
  }

  async function handleResend() {
    if (resendIn > 0 || !emailStr) return;
    setError(null);
    const { error: err } = await sendEmailOtp(emailStr);
    if (err) setError(err);
    else setResendIn(30);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.mascotWrap}>
            <Mascot size={104} colors={PIGGY_BRAND} />
          </View>

          <Text style={[styles.title, { color: colors.text }]}>Digite o código</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Enviamos um código de 6 dígitos para{'\n'}
            <Text style={{ color: colors.text, fontWeight: '700' }}>{emailStr}</Text>
          </Text>

          {/* Quadradinhos do código */}
          <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const filled = i < code.length;
              const active = i === code.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.box,
                    {
                      backgroundColor: colors.card,
                      borderColor: active || filled ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.boxText, { color: colors.text }]}>
                    {code[i] ?? ''}
                  </Text>
                </View>
              );
            })}
          </Pressable>

          {/* Campo invisível que captura a digitação */}
          <RNTextInput
            ref={inputRef}
            value={code}
            onChangeText={handleChange}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            style={styles.hiddenInput}
            caretHidden
          />

          {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 6 }} />}
          {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

          <Pressable onPress={handleResend} disabled={resendIn > 0} style={styles.resend}>
            <Text style={[styles.resendText, { color: resendIn > 0 ? colors.textMuted : colors.primary }]}>
              {resendIn > 0 ? `Reenviar código em ${resendIn}s` : 'Reenviar código'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 12, paddingVertical: 6 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  mascotWrap: { height: 104, marginBottom: 8 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginTop: 8, lineHeight: 23, marginBottom: 28 },
  boxes: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
  box: {
    width: 48,
    height: 58,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: { fontSize: 26, fontWeight: '800' },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  error: { fontSize: 14, marginTop: 14, textAlign: 'center' },
  resend: { marginTop: 22, padding: 8 },
  resendText: { fontSize: 15, fontWeight: '700' },
});
