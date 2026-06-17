import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Category, Expense } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { formatBRL } from '../utils/currency';
import { relativeDayLabel } from '../utils/date';
import { CategoryIcon } from './CategoryIcon';
import { PressableScale } from './PressableScale';

type Props = {
  expense: Expense;
  category: Category | undefined;
  subcategory: Category | undefined;
  onPress: () => void;
};

/** Linha de um gasto na lista. */
export function ExpenseRow({ expense, category, subcategory, onPress }: Props) {
  const { colors } = useTheme();

  const display = subcategory ?? category;
  const icon = display?.icon ?? 'tag';
  const color = category?.color ?? display?.color ?? colors.textMuted;

  const title =
    subcategory?.name ?? category?.name ?? expense.note ?? 'Gasto';
  const subtitle = subcategory
    ? category?.name ?? ''
    : expense.note ?? '';

  return (
    <PressableScale
      onPress={onPress}
      haptic={false}
      style={[styles.row, { backgroundColor: colors.card }]}
    >
      <CategoryIcon icon={icon} color={color} size={44} />
      <View style={styles.middle}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {relativeDayLabel(expense.occurred_at)}
            {subtitle ? ` · ${subtitle}` : ''}
          </Text>
        </View>
      </View>
      <Text style={[styles.amount, { color: colors.text }]}>
        {formatBRL(expense.amount)}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        color={colors.textMuted}
        style={{ marginLeft: 2 }}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  middle: { flex: 1, gap: 2 },
  title: { fontSize: 16, fontWeight: '600' },
  metaRow: { flexDirection: 'row' },
  meta: { fontSize: 13 },
  amount: { fontSize: 16, fontWeight: '700' },
});
