import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useData } from '../../context/DataContext';
import { useT } from '../../i18n';
import { Text } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { relativeDayLabel } from '../../utils/date';
import { ExpenseRow } from '../ExpenseRow';

type Props = {
  expenses: Expense[];
  /** Mostra a data em cima de cada linha (lista fora de um dia específico). */
  showDates?: boolean;
  limit?: number;
};

/** Lista de lançamentos que abre o gasto ao tocar — o fim de toda visualização. */
export function ExpenseList({ expenses, showDates = true, limit }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const { getCategory } = useData();

  if (expenses.length === 0) {
    return (
      <Text style={[styles.empty, { color: colors.textMuted }]}>{t.views.noExpensesThere}</Text>
    );
  }

  const shown = limit ? expenses.slice(0, limit) : expenses;
  let lastDate = '';

  return (
    <View style={styles.list}>
      {shown.map((e) => {
        const header = showDates && e.occurred_at !== lastDate;
        lastDate = e.occurred_at;
        return (
          <View key={e.id} style={{ gap: 6 }}>
            {header && (
              <Text style={[styles.date, { color: colors.textMuted }]}>
                {relativeDayLabel(e.occurred_at)}
              </Text>
            )}
            <ExpenseRow
              expense={e}
              category={getCategory(e.category_id)}
              subcategory={getCategory(e.subcategory_id)}
              onPress={() => router.push({ pathname: '/novo', params: { id: e.id } })}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 8 },
  date: { fontSize: 12, fontWeight: '700', marginTop: 4, marginLeft: 4 },
  empty: { fontSize: 14, textAlign: 'center', paddingVertical: 12 },
});
