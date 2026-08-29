import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useT } from '../i18n';
import { getActiveLang } from '../i18n/active';
import { loadItemsOfExpense } from '../lib/receipts';
import { useTheme } from '../theme/ThemeContext';
import { Text } from '../theme/typography';
import { ExpenseItem } from '../types';
import { formatBRL } from '../utils/currency';

type Props = {
  expenseId: string;
  /** Cor da categoria, para o item continuar visualmente ligado ao gasto. */
  color: string;
};

/** "1,24 kg" ou "3 un" — só aparece quando diz alguma coisa. */
function quantidadeLabel(
  quantity: number,
  unit: string | null,
  defaultUnit: string
): string | null {
  const valor = Number(quantity);
  if (!Number.isFinite(valor) || valor <= 0) return null;
  if (valor === 1 && !unit) return null;
  const separador = getActiveLang() === 'en' ? '.' : ',';
  const numero = Number.isInteger(valor)
    ? String(valor)
    : valor
        .toFixed(3)
        .replace(/0+$/, '')
        .replace(/\.$/, '')
        .replace('.', separador);
  return `${numero} ${unit ?? defaultUnit}`;
}

/**
 * As subcompras de um gasto, abertas dentro dele.
 *
 * Busca sob demanda: só o lançamento que a pessoa abriu vai ao banco. Item
 * não tem data própria — ele pertence ao gasto, e é aí que faz sentido ler.
 */
export function ExpenseItems({ expenseId, color }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [items, setItems] = useState<ExpenseItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    loadItemsOfExpense(expenseId).then((rows) => {
      if (alive) setItems(rows);
    });
    return () => {
      alive = false;
    };
  }, [expenseId]);

  if (items === null) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.textMuted} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <Text style={[styles.vazio, { color: colors.textMuted }]}>
        {t.expenseRow.noItems}
      </Text>
    );
  }

  return (
    <View style={styles.lista}>
      {items.map((item) => {
        const quantidade = quantidadeLabel(
          Number(item.quantity),
          item.unit,
          t.expenseRow.defaultUnit
        );
        return (
          <View key={item.id} style={styles.linha}>
            <View style={[styles.marcador, { backgroundColor: color }]} />
            <Text style={[styles.nome, { color: colors.text }]} numberOfLines={1}>
              {item.description}
            </Text>
            {!!quantidade && (
              <Text style={[styles.quantidade, { color: colors.textMuted }]}>{quantidade}</Text>
            )}
            <Text style={[styles.valor, { color: colors.text }]}>
              {formatBRL(Number(item.total))}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { paddingVertical: 8, paddingLeft: 34 },
  vazio: { fontSize: 12, paddingVertical: 6, paddingLeft: 34 },
  lista: { paddingLeft: 34, paddingBottom: 4, gap: 4 },
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  marcador: { width: 4, height: 4, borderRadius: 2, opacity: 0.6 },
  nome: { flex: 1, fontSize: 13 },
  quantidade: { fontSize: 11 },
  valor: { fontSize: 13, fontWeight: '600' },
});
