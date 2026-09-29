import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PaymentLogo } from '../src/components/PaymentLogo';
import { PressableScale } from '../src/components/PressableScale';
import { useData } from '../src/context/DataContext';
import { useLedger } from '../src/context/LedgerContext';
import { KIND_ICONS } from '../src/data/paymentProviders';
import { useT } from '../src/i18n';
import { Text } from '../src/theme/typography';
import { useTheme } from '../src/theme/ThemeContext';
import { formatBRL } from '../src/utils/currency';
import { paymentLabel } from '../src/utils/payment';

/** Lista dos meios de pagamento do caderno, com quanto já passou por cada um. */
export default function PagamentosScreen() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const { canWrite } = useLedger();
  const { paymentMethods, expenses } = useData();

  // Total de todos os tempos por meio — ajuda a reconhecer qual é qual.
  const usage = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const e of expenses) {
      if (!e.payment_method_id) continue;
      const u = map.get(e.payment_method_id) ?? { total: 0, count: 0 };
      u.total += e.amount;
      u.count += 1;
      map.set(e.payment_method_id, u);
    }
    return map;
  }, [expenses]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t.payment.manageTitle}
        </Text>
        {canWrite ? (
          <Pressable onPress={() => router.push('/pagamento')} hitSlop={12} style={styles.backBtn}>
            <MaterialCommunityIcons name="plus" size={26} color={colors.primary} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {paymentMethods.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="credit-card-multiple" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.payment.empty}</Text>
            {canWrite && (
              <PressableScale
                onPress={() => router.push('/pagamento')}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
                <Text style={[styles.emptyBtnText, { color: colors.onPrimary }]}>
                  {t.payment.addFirst}
                </Text>
              </PressableScale>
            )}
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {paymentMethods.map((pm, index) => {
              const u = usage.get(pm.id);
              return (
                <View key={pm.id}>
                  {index > 0 && (
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  )}
                  <Pressable
                    onPress={() => router.push({ pathname: '/pagamento', params: { id: pm.id } })}
                    style={styles.row}
                  >
                    <PaymentLogo provider={pm.provider} kind={pm.kind} color={pm.color} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                        {paymentLabel(pm, t)}
                      </Text>
                      <View style={styles.rowSubLine}>
                        <MaterialCommunityIcons
                          name={KIND_ICONS[pm.kind] as any}
                          size={13}
                          color={colors.textMuted}
                        />
                        <Text style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
                          {t.payment.kinds[pm.kind]}
                          {u ? ` · ${t.home.entriesCount(u.count)} · ${formatBRL(u.total)}` : ''}
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  content: {
    padding: 16,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  card: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowTitle: { fontSize: 16, fontWeight: '600' },
  rowSubLine: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  rowSub: { fontSize: 13, flexShrink: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 54 },
  empty: { alignItems: 'center', paddingTop: 50, gap: 14, paddingHorizontal: 12 },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 15, textAlign: 'center', lineHeight: 21, maxWidth: 320 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 48,
    borderRadius: 14,
  },
  emptyBtnText: { fontSize: 16, fontWeight: '700' },
});
