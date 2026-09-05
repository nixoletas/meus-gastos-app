import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../../src/components/PressableScale';
import { SharedLedgerBanner } from '../../src/components/SharedLedgerBanner';
import { useLedger } from '../../src/context/LedgerContext';
import { useT } from '../../src/i18n';
import { useTheme } from '../../src/theme/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const { canWrite } = useLedger();
  const insets = useSafeAreaInsets();
  // No Android, garante uma folga mínima sobre a navbar do sistema mesmo
  // quando o inset reportado é pequeno.
  const bottomInset =
    Platform.OS === 'android' ? Math.max(insets.bottom, 12) : insets.bottom;

  return (
    <View style={{ flex: 1 }}>
      <SharedLedgerBanner />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          // Garante que a barra fique acima da navbar nativa do Android (insets.bottom).
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            height: 60 + bottomInset,
            paddingBottom: bottomInset + 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.tabs.home,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="graficos"
          options={{
            title: t.tabs.charts,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chart-donut" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categorias"
          options={{
            title: t.tabs.categories,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shape" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="limites"
          options={{
            title: t.tabs.limits,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="bell-alert" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="mais"
          options={{
            title: t.tabs.more,
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="dots-horizontal" size={size} color={color} />
            ),
          }}
        />
        {/* Ajustes continua sendo rota, mas entra pelo "Mais" — a barra só
            comporta cinco abas e configuração não é uso do dia. */}
        <Tabs.Screen name="ajustes" options={{ href: null, title: t.tabs.settings }} />
      </Tabs>

      {/* Botão flutuante para lançar um gasto rapidamente, presente em todas as
          abas — some no caderno em que só se pode olhar. */}
      {canWrite && (
      <PressableScale
        onPress={() => {
          router.push('/novo');
        }}
        scaleTo={0.9}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: 60 + bottomInset + 18,
            shadowColor: colors.primary,
          },
        ]}
      >
        <MaterialCommunityIcons name="plus" size={32} color={colors.onPrimary} />
      </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 8px 20px rgba(0,0,0,0.25)' } as any,
      default: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
      },
    }),
  },
});
