import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GoogleIcon } from '../src/components/GoogleIcon';
import { Mascot } from '../src/components/Mascot';
import { PIGGY_BRAND } from '../src/components/mascotSvg';
import { PressableScale } from '../src/components/PressableScale';
import { useAuth } from '../src/context/AuthContext';
import { useT } from '../src/i18n';
import { useTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/theme/typography';

export default function LoginScreen() {
  const { colors } = useTheme();
  const t = useT();
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogle() {
    setError(null);
    setLoadingGoogle(true);
    const { error: err } = await signInWithGoogle();
    setLoadingGoogle(false);
    if (err) setError(err);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mascotWrap}>
          <Mascot size={132} colors={PIGGY_BRAND} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Meus Gastos</Text>
        <Text style={[styles.slogan, { color: colors.primary }]}>
          {t.login.slogan}
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
                <GoogleIcon size={22} />
                <Text style={[styles.googleText, { color: colors.text }]}>
                  {t.login.google}
                </Text>
              </>
            )}
          </PressableScale>

          {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}

          <Text style={[styles.hint, { color: colors.textMuted }]}>
            {t.login.hint}
          </Text>

          <Text style={[styles.consent, { color: colors.textMuted }]}>
            {t.login.consentPrefix}{' '}
            <Text
              style={{ color: colors.primary, fontWeight: '700' }}
              onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}
            >
              {t.login.terms}
            </Text>{' '}
            {t.login.consentMiddle}{' '}
            <Text
              style={{ color: colors.primary, fontWeight: '700' }}
              onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
            >
              {t.login.privacy}
            </Text>
            .
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  error: { fontSize: 14, textAlign: 'center' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 2 },
  consent: { fontSize: 12.5, textAlign: 'center', lineHeight: 18, marginTop: 4 },
});
