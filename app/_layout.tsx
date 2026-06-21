import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavThemeProvider,
  useRouter,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { DataProvider } from '../src/context/DataContext';
import { OnboardingProvider, useOnboarding } from '../src/context/OnboardingContext';
import { ThemeProvider, useTheme } from '../src/theme/ThemeContext';
import { APP_FONTS } from '../src/theme/typography';

/** Redireciona entre onboarding, login e o app conforme a sessão. */
function AuthGate() {
  const { session, loading, configured } = useAuth();
  const { onboarded } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  // Tema de navegação com as cores do app — evita o "flash branco" nas
  // transições (o padrão do React Navigation usa fundo branco).
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.card,
      border: colors.border,
      text: colors.text,
      primary: colors.primary,
    },
  };

  useEffect(() => {
    if (loading || onboarded === null) return;

    const seg = segments[0] as string | undefined;
    // Telas de onde um usuário logado é levado de volta ao app.
    const authScreens = ['login', 'onboarding', 'config'];
    // Telas acessíveis sem sessão (inclui /legal para ler antes de aceitar).
    const publicScreens = [...authScreens, 'legal'];

    if (!configured) {
      if (seg !== 'config') router.replace('/config');
      return;
    }

    if (session) {
      if (seg && authScreens.includes(seg)) router.replace('/(tabs)');
      return;
    }

    // Sem sessão: primeiro o onboarding, depois o login.
    if (!onboarded) {
      if (seg !== 'onboarding' && seg !== 'legal') router.replace('/onboarding');
    } else if (!seg || !publicScreens.includes(seg)) {
      router.replace('/login');
    }
  }, [session, loading, configured, onboarded, segments]);

  if (loading || onboarded === null) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="config" />
        <Stack.Screen name="legal" />
        <Stack.Screen
          name="novo"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="categoria"
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            contentStyle: { backgroundColor: colors.background },
          }}
        />
      </Stack>
    </NavThemeProvider>
  );
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(APP_FONTS);

  // Evita o "flash" da fonte do sistema antes da Space Grotesk carregar.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: '#0B1120' }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <OnboardingProvider>
            <AuthProvider>
              <DataProvider>
                <ThemedStatusBar />
                <AuthGate />
              </DataProvider>
            </AuthProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
