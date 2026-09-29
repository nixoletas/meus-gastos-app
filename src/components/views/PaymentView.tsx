import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useData } from '../../context/DataContext';
import { useLedger } from '../../context/LedgerContext';
import { useT } from '../../i18n';
import { categoryPalette } from '../../theme/colors';
import { Text } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { NO_PAYMENT_KEY, totalsByPaymentMethod } from '../../utils/analytics';
import { formatBRL } from '../../utils/currency';
import { Period } from '../../utils/date';
import { paymentLabel } from '../../utils/payment';
import { PaymentLogo } from '../PaymentLogo';
import { PieChart } from '../PieChart';
import { PressableScale } from '../PressableScale';
import { ExpenseList } from './ExpenseList';
import { RankRow } from './RankRow';

type Props = {
  expenses: Expense[];
  refDate: Date;
  period: Period;
};

/** Por meio de pagamento: donut + ranking com os logos, "Não informado" no fim. */
export function PaymentView({ expenses, refDate, period }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const { canWrite } = useLedger();
  const { getPaymentMethod, paymentMethods } = useData();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setSelected(null), [refDate, period]);

  const groups = useMemo(
    () => totalsByPaymentMethod(expenses, refDate, period),
    [expenses, refDate, period]
  );

  // Dois meios do mesmo banco (Nubank crédito e Nubank pix) teriam a mesma cor
  // no donut; o segundo pega uma cor livre da paleta.
  const colorOf = useMemo(() => {
    const used = new Set<string>();
    const map = new Map<string, string>();
    let spare = 0;
    for (const g of groups) {
      if (g.key === NO_PAYMENT_KEY) {
        map.set(g.key, colors.textMuted);
        continue;
      }
      let c = getPaymentMethod(g.key)?.color ?? colors.textMuted;
      if (used.has(c.toLowerCase())) {
        while (spare < categoryPalette.length && used.has(categoryPalette[spare].toLowerCase())) {
          spare += 1;
        }
        c = categoryPalette[spare % categoryPalette.length];
        spare += 1;
      }
      used.add(c.toLowerCase());
      map.set(g.key, c);
    }
    return map;
  }, [groups, getPaymentMethod, colors.textMuted]);

  const known = groups.filter((g) => g.key !== NO_PAYMENT_KEY);
  const unknown = groups.find((g) => g.key === NO_PAYMENT_KEY);
  const total = groups.reduce((s, g) => s + g.total, 0);
  const focus = groups.find((g) => g.key === selected);

  if (known.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="credit-card-multiple" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          {t.views.paymentEmpty}
        </Text>
        {canWrite && paymentMethods.length === 0 && (
          <PressableScale
            onPress={() => router.push('/pagamento')}
            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.onPrimary} />
            <Text style={{ color: colors.onPrimary, fontWeight: '700' }}>
              {t.payment.addFirst}
            </Text>
          </PressableScale>
        )}
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.chartWrap}>
        <PieChart
          data={groups.map((g) => ({ key: g.key, value: g.total, color: colorOf.get(g.key)! }))}
          size={220}
          thickness={34}
          selectedKey={selected}
          onSelectSlice={setSelected}
        >
          {focus ? (
            <>
              {focus.key === NO_PAYMENT_KEY ? null : (
                <PaymentLogo
                  provider={getPaymentMethod(focus.key)?.provider}
                  kind={getPaymentMethod(focus.key)?.kind}
                  color={getPaymentMethod(focus.key)?.color}
                  size={30}
                />
              )}
              <Text style={[styles.centerValue, { color: colors.text }]}>
                {formatBRL(focus.total)}
              </Text>
              <Text style={[styles.centerLabel, { color: colors.textMuted }]}>
                {t.charts.percentOfTotal(Math.round(focus.percent * 100))}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.centerLabel, { color: colors.textMuted }]}>{t.charts.total}</Text>
              <Text style={[styles.centerValue, { color: colors.text }]}>{formatBRL(total)}</Text>
            </>
          )}
        </PieChart>
      </View>

      {unknown && (
        <View style={[styles.note, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.noteText, { color: colors.textMuted }]}>
            {t.views.unknownShare(Math.round(unknown.percent * 100))}
          </Text>
        </View>
      )}

      {groups.map((g) => {
        const pm = g.key === NO_PAYMENT_KEY ? undefined : getPaymentMethod(g.key);
        const color = colorOf.get(g.key)!;
        const open = selected === g.key;
        return (
          <RankRow
            key={g.key}
            icon={
              <PaymentLogo
                provider={pm?.provider}
                kind={pm?.kind ?? 'outro'}
                color={pm ? pm.color : colors.textMuted}
                size={40}
              />
            }
            title={pm ? paymentLabel(pm, t) : t.payment.none}
            subtitle={t.home.entriesCount(g.count)}
            total={g.total}
            percent={g.percent}
            color={color}
            expanded={open}
            dimmed={selected !== null && !open}
            onPress={() => setSelected(open ? null : g.key)}
          >
            <ExpenseList expenses={g.expenses} />
          </RankRow>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  chartWrap: { alignItems: 'center', marginVertical: 4 },
  centerLabel: { fontSize: 13, fontWeight: '500' },
  centerValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  noteText: { fontSize: 13, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 30, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 15, textAlign: 'center', maxWidth: 300, lineHeight: 21 },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
  },
});
