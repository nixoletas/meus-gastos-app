import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mascot } from '../src/components/Mascot';
import { PIGGY_BRAND } from '../src/components/mascotSvg';
import { PressableScale } from '../src/components/PressableScale';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/theme/ThemeContext';
import { Text, TextInput } from '../src/theme/typography';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginScreen() {
  const { colors } = useTheme();
  const { signInWithGoogle, sendEmailOtp } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  async function handleGoogle() {
    setError(null);
    setLoadingGoogle(true);
    const { error: err } = await signInWithGoogle();
    setLoadingGoogle(false);
    if (err) setError(err);
  }

  async function handleEmail() {
    setError(null);
    if (!isValidEmail(email)) {
      setError('Digite um e-mail válido.');
      return;
    }
    setLoadingEmail(true);
    const { error: err } = await sendEmailOtp(email);
    setLoadingEmail(false);
    if (err) {
      setError(err);
      return;
    }
    router.push({ pathname: '/otp', params: { email: email.trim() } });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mascotWrap}>
            <Mascot size={132} colors={PIGGY_BRAND} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Meus Gastos</Text>
          <Text style={[styles.slogan, { color: colors.primary }]}>
            Pra onde vai cada centavo.
          </Text>

          <View style={styles.form}>
            {/* Google */}
            <PressableScale
              onPress={handleGoogle}
              disabled={loadingGoogle}
              style={[styles.googleBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              {loadingGoogle ? (
                <ActivityIndicator color={colors.text} />
              ) : (
                <>
                  <MaterialCommunityIcons name="google" size={22} color="#EA4335" />
                  <Text style={[styles.googleText, { color: colors.text }]}>
                    Continuar com Google
                  </Text>
                </>
              )}
            </PressableScale>

            {/* Divisor */}
            <View style={styles.divider}>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textMuted }]}>ou</Text>
              <View style={[styles.line, { backgroundColor: colors.border }]} />
            </View>

            {/* E-mail */}
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
                onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80)}
                onSubmitEditing={handleEmail}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

            <PressableScale
              onPress={handleEmail}
              disabled={loadingEmail}
              style={[styles.button, { backgroundColor: colors.primary }]}
            >
              {loadingEmail ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
                  Continuar com e-mail
                </Text>
              )}
            </PressableScale>

            <Text style={[styles.hint, { color: colors.textMuted }]}>
              Enviamos um código de 6 dígitos por e-mail. Sem senha, sem complicação.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingBottom: 40,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  mascotWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    height: 132,
    marginBottom: 8,
  },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center' },
  slogan: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  form: { gap: 14 },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
  },
  googleText: { fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 2 },
  line: { flex: 1, height: 1 },
  dividerText: { fontSize: 14, fontWeight: '600' },
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
  button: {
    height: 54,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 17, fontWeight: '700' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 2 },
});
