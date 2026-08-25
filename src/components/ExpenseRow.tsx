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
  // Gasto com notinha mostra o que tem dentro sem precisar abrir.
  const detail =
    expense.items_count > 0
      ? `${expense.items_count} ${expense.items_count === 1 ? 'item' : 'itens'}`
      : expense.has_receipt
        ? 'notinha'
        : null;
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
        {(!!secondary || !!detail) && (
          <View style={styles.metaRow}>
            {!!secondary && (
              <Text style={[styles.meta, styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>
                {secondary}
              </Text>
            )}
            {!!detail && (
              <View style={[styles.badge, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons
                  name="receipt-text-outline"
                  size={11}
                  color={colors.textMuted}
                />
                <Text style={[styles.badgeText, { color: colors.textMuted }]}>{detail}</Text>
              </View>
            )}
          </View>
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
  middle: { flex: 1, gap: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { flexShrink: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13 },
  amount: { fontSize: 16, fontWeight: '700' },
});

