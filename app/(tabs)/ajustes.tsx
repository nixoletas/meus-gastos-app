import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hexWithAlpha } from '../../src/components/CategoryIcon';
import { useAuth } from '../../src/context/AuthContext';
import { useData } from '../../src/context/DataContext';
import { ThemePreference, useTheme } from '../../src/theme/ThemeContext';
import { tapLight } from '../../src/utils/haptics';

export default function AjustesScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { session, signOut } = useAuth();
  const { budgets } = useData();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const themeOptions: { key: ThemePreference; label: string; icon: any }[] = [
    { key: 'light', label: 'Claro', icon: 'white-balance-sunny' },
    { key: 'dark', label: 'Escuro', icon: 'weather-night' },
    { key: 'system', label: 'Sistema', icon: 'cellphone-cog' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>

      {/* Tema */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APARÊNCIA</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.themeRow}>
          {themeOptions.map((opt) => {
            const active = preference === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
                  tapLight();
                  setPreference(opt.key);
                }}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: active ? hexWithAlpha(colors.primary, 0.14) : colors.surface,
                    borderColor: active ? colors.primary : 'transparent',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={24}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.themeText,
                    { color: active ? colors.primary : colors.textMuted },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Orçamentos / alertas */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        LIMITES E ALERTAS
      </Text>
      <Pressable
        onPress={() => router.push('/orcamentos')}
        style={[styles.card, styles.linkRow, { backgroundColor: colors.card }]}
      >
        <View style={[styles.linkIcon, { backgroundColor: hexWithAlpha(colors.warning, 0.16) }]}>
          <MaterialCommunityIcons name="bell-alert" size={22} color={colors.warning} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.linkTitle, { color: colors.text }]}>
            Limites de gasto
          </Text>
          <Text style={[styles.linkSub, { color: colors.textMuted }]}>
            {budgets.length === 0
              ? 'Defina alertas de gasto excessivo'
              : `${budgets.length} ${budgets.length === 1 ? 'limite ativo' : 'limites ativos'}`}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
      </Pressable>

      {/* Conta */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CONTA</Text>
      <View style={[styles.card, { backgroundColor: colors.card, gap: 4 }]}>
        <View style={styles.accountRow}>
          <View style={[styles.linkIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="account" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.linkTitle, { color: colors.text }]} numberOfLines={1}>
              {session?.user.email ?? 'Conectado'}
            </Text>
            <Text style={[styles.linkSub, { color: colors.textMuted }]}>
              Sincronizado na nuvem
            </Text>
          </View>
        </View>

        <Pressable
          onPress={signOut}
          style={[styles.logoutBtn, { backgroundColor: colors.dangerSoft }]}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.danger} />
          <Text style={[styles.logoutText, { color: colors.danger }]}>Sair</Text>
        </Pressable>
      </View>

      <Text style={[styles.footerNote, { color: colors.textMuted }]}>
        Meus Gastos · feito no Brasil 🇧🇷
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 18, padding: 14 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  themeText: { fontSize: 14, fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 16, fontWeight: '600' },
  linkSub: { fontSize: 13, marginTop: 2 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
  },
  logoutText: { fontSize: 16, fontWeight: '700' },
  footerNote: { textAlign: 'center', marginTop: 30, fontSize: 13 },
});
