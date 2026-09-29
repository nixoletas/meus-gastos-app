import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useT } from '../../i18n';
import { Text } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { expensesForPeriod } from '../../utils/analytics';
import { Period } from '../../utils/date';
import { ExpenseList } from './ExpenseList';

type Props = {
  expenses: Expense[];
  refDate: Date;
  period: Period;
};

type Sort = 'recent' | 'biggest';

/** Todos os lançamentos do período, por data ou do maior para o menor. */
export function ListView({ expenses, refDate, period }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [sort, setSort] = useState<Sort>('recent');

  const list = useMemo(() => {
    const items = expensesForPeriod(expenses, refDate, period);
    return sort === 'biggest' ? [...items].sort((a, b) => b.amount - a.amount) : items;
  }, [expenses, refDate, period, sort]);

  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.segment, { backgroundColor: colors.surface }]}>
        {(['recent', 'biggest'] as Sort[]).map((s) => {
          const active = sort === s;
          return (
            <Pressable
              key={s}
              onPress={() => setSort(s)}
              style={[styles.segmentBtn, active && { backgroundColor: colors.card }]}
            >
              <Text
                style={[styles.segmentText, { color: active ? colors.primary : colors.textMuted }]}
              >
                {s === 'recent' ? t.views.sortRecent : t.views.sortBiggest}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <ExpenseList expenses={list} showDates={sort === 'recent'} />
    </View>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '700' },
});
