import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useT } from '../../i18n';
import { Text } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { timelineBuckets } from '../../utils/analytics';
import { formatBRL } from '../../utils/currency';
import { monthName, Period, shortMonthName } from '../../utils/date';
import { BarChart } from './BarChart';
import { ExpenseList } from './ExpenseList';

type Props = {
  expenses: Expense[];
  refDate: Date;
  period: Period;
};

/** Linha do tempo: um gasto por dia (mês) ou por mês (ano), com os picos. */
export function TimelineView({ expenses, refDate, period }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setSelected(null), [refDate, period]);

  const buckets = useMemo(
    () => timelineBuckets(expenses, refDate, period),
    [expenses, refDate, period]
  );

  const past = buckets.filter((b) => !b.future);
  const total = past.reduce((s, b) => s + b.total, 0);
  const average = past.length > 0 ? total / past.length : 0;
  const peak = buckets.reduce((best, b) => (b.total > best.total ? b : best), buckets[0]);
  const withoutSpending = past.filter((b) => b.total === 0).length;

  const labelFor = (index: number) =>
    period === 'year'
      ? shortMonthName(index)
      : `${index} ${shortMonthName(refDate.getMonth())}`;

  const bars = buckets.map((b) => ({
    key: String(b.index),
    value: b.total,
    disabled: b.future && b.total === 0,
    label:
      period === 'year'
        ? shortMonthName(b.index)
        : b.index === 1 || b.index % 5 === 0
          ? String(b.index)
          : '',
  }));

  const chosen = buckets.find((b) => String(b.index) === selected);

  return (
    <View style={{ gap: 16 }}>
      <View style={styles.stats}>
        <Stat
          label={period === 'year' ? t.views.monthlyAvg : t.views.dailyAvg}
          value={formatBRL(average)}
        />
        {peak && peak.total > 0 && (
          <Stat
            label={period === 'year' ? t.views.peakMonth : t.views.peakDay}
            value={labelFor(peak.index)}
            sub={formatBRL(peak.total)}
          />
        )}
        {period === 'month' && (
          <Stat label={t.views.daysWithout} value={`${withoutSpending}/${past.length}`} />
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <BarChart
          bars={bars}
          selectedKey={selected}
          onSelect={setSelected}
          color={colors.primary}
          reference={average}
        />
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          {chosen ? '' : t.views.tapBar}
        </Text>
      </View>

      {chosen && (
        <View style={{ gap: 10 }}>
          <View style={styles.chosenHead}>
            <Text style={[styles.chosenTitle, { color: colors.text }]}>
              {period === 'year' ? monthName(chosen.index) : t.views.dayTitle(labelFor(chosen.index))}
            </Text>
            <Text style={[styles.chosenValue, { color: colors.text }]}>
              {formatBRL(chosen.total)}
            </Text>
          </View>
          <ExpenseList expenses={chosen.expenses} showDates={period === 'year'} />
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: colors.card }]}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>
        {value}
      </Text>
      {!!sub && (
        <Text style={[styles.statSub, { color: colors.textMuted }]} numberOfLines={1}>
          {sub}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, borderRadius: 14, padding: 12, gap: 2 },
  statLabel: { fontSize: 12, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '800' },
  statSub: { fontSize: 12 },
  card: { borderRadius: 18, padding: 14, paddingTop: 18 },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  chosenHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chosenTitle: { fontSize: 17, fontWeight: '800' },
  chosenValue: { fontSize: 17, fontWeight: '800' },
});
