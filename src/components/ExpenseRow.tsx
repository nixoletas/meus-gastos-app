import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet,
  View,
} from 'react-native';
import { Text } from '../theme/typography';
import { Category, Expense } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { formatBRL } from '../utils/currency';
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

  const title = subcategory?.name ?? category?.name ?? 'Gasto';
  const note = expense.note?.trim();
  // Mostra a nota; se não houver, a categoria-mãe (quando for subcategoria).
  const secondary = note || (subcategory ? category?.name : undefined);

  return (
    <PressableScale
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.card }]}
    >
      <CategoryIcon icon={icon} color={color} size={44} />
      <View style={styles.middle}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {!!secondary && (
          <Text style={[styles.meta, { color: colors.textMuted }]} numberOfLines={1}>
            {secondary}
          </Text>
        )}
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
  meta: { fontSize: 13 },
  amount: { fontSize: 16, fontWeight: '700' },
});

