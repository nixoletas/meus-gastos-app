import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useScrollToTop } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ReportExportModal } from '../../src/components/ReportExportModal';
import { useAuth } from '../../src/context/AuthContext';
import { useLedger } from '../../src/context/LedgerContext';
import { useT } from '../../src/i18n';
import { Text } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/ThemeContext';

/**
 * Porta de entrada das features que não cabem na barra de abas — família e
 * relatórios. Ajustes fica no fim porque é configuração, não uso do dia.
 */
export default function MaisScreen() {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session } = useAuth();
  const { members, isShared, activeLedger } = useLedger();

  const [reportOpen, setReportOpen] = useState(false);

  // Tocar na aba já ativa volta ao topo em vez de não fazer nada.
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  // Resumo da linha de Família: de quem é o caderno aberto ou quantas pessoas
  // acompanham o meu.
  const ativos = members.filter((m) => m.status === 'active').length;
  const resumoFamilia = isShared
    ? t.sharing.subtitleViewing(activeLedger?.ownerName || activeLedger?.ownerEmail || '')
    : ativos === 0
      ? t.sharing.subtitleNobody
      : t.sharing.subtitleCount(ativos);

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t.tabs.more}</Text>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Pressable onPress={() => router.push('/familia')} style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="account-multiple-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{t.tabs.family}</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
              {resumoFamilia}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Pressable onPress={() => setReportOpen(true)} style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="file-excel" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{t.settings.exportExcel}</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
              {t.settings.exportExcelSub}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, marginTop: 14 }]}>
        <Pressable onPress={() => router.push('/ajustes')} style={styles.row}>
          <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="cog" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>{t.settings.title}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <ReportExportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        userEmail={session?.user.email}
      />
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
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16 },
  card: { borderRadius: 18, padding: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 8, marginLeft: 54 },
});
