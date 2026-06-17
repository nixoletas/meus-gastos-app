import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../../src/components/PressableScale';
import { useTheme } from '../../src/theme/ThemeContext';
import { tapMedium } from '../../src/utils/haptics';

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // No Android, garante uma folga mínima sobre a navbar do sistema mesmo
  // quando o inset reportado é pequeno.
  const bottomInset =
    Platform.OS === 'android' ? Math.max(insets.bottom, 12) : insets.bottom;

  return (
    <View style={{ flex: 1 }}>
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
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="graficos"
          options={{
            title: 'Gráficos',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chart-donut" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categorias"
          options={{
            title: 'Categorias',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="shape" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="limites"
          options={{
            title: 'Limites',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="bell-alert" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="ajustes"
          options={{
            title: 'Ajustes',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="cog" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      {/* Botão flutuante para lançar um gasto rapidamente, presente em todas as abas. */}
      <PressableScale
        onPress={() => {
          tapMedium();
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
