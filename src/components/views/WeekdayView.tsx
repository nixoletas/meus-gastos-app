import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useT } from '../../i18n';
import { Text } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { totalsByWeekday } from '../../utils/analytics';
import { formatBRL } from '../../utils/currency';
import { Period } from '../../utils/date';
import { BarChart } from './BarChart';
import { ExpenseList } from './ExpenseList';

type Props = {
  expenses: Expense[];
  refDate: Date;
  period: Period;
};

/**
 * Por dia da semana, pela MÉDIA por dia: um mês com cinco sábados não faz o
 * sábado parecer caro só por ter aparecido mais vezes.
 */
export function WeekdayView({ expenses, refDate, period }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setSelected(null), [refDate, period]);

  const days = useMemo(
    () => totalsByWeekday(expenses, refDate, period),
    [expenses, refDate, period]
  );
  const avg = (d: (typeof days)[number]) => (d.days > 0 ? d.total / d.days : d.total);
  const top = days.reduce((best, d) => (avg(d) > avg(best) ? d : best), days[0]);
  const chosen = days.find((d) => String(d.weekday) === selected);

  return (
    <View style={{ gap: 16 }}>
      {top && top.total > 0 && (
        <View style={[styles.headline, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.headlineTitle, { color: colors.text }]}>
            {t.views.mostSpentWeekday(t.views.weekdaysLong[top.weekday])}
          </Text>
          <Text style={[styles.headlineSub, { color: colors.textMuted }]}>
            {t.views.avgPerDay(formatBRL(avg(top)))}
          </Text>
        </View>
      )}

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <BarChart
          bars={days.map((d) => ({
            key: String(d.weekday),
            value: avg(d),
            label: t.views.weekdaysShort[d.weekday],
          }))}
          selectedKey={selected}
          onSelect={setSelected}
          color={colors.primary}
        />
        {!chosen && (
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t.views.tapBar}</Text>
        )}
      </View>

      {chosen && (
        <View style={{ gap: 10 }}>
          <View style={styles.chosenHead}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.chosenTitle, { color: colors.text }]}>
                {t.views.weekdaysShort[chosen.weekday]}
              </Text>
              <Text style={[styles.headlineSub, { color: colors.textMuted }]}>
                {t.views.avgPerDay(formatBRL(avg(chosen)))}
              </Text>
            </View>
            <Text style={[styles.chosenTitle, { color: colors.text }]}>
              {formatBRL(chosen.total)}
            </Text>
          </View>
          <ExpenseList expenses={chosen.expenses} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headline: { borderRadius: 16, padding: 14, gap: 2 },
  headlineTitle: { fontSize: 17, fontWeight: '800' },
  headlineSub: { fontSize: 13 },
  card: { borderRadius: 18, padding: 14, paddingTop: 18 },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  chosenHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chosenTitle: { fontSize: 17, fontWeight: '800' },
});
