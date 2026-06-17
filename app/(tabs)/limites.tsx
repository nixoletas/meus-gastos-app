import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../src/components/AppIcon';
import { CategoryIcon, hexWithAlpha } from '../../src/components/CategoryIcon';
import { PressableScale } from '../../src/components/PressableScale';
import { useData } from '../../src/context/DataContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { evaluateBudgets } from '../../src/utils/analytics';
import { formatBRL, maskCurrencyInput, rawToReais } from '../../src/utils/currency';
import { Period } from '../../src/utils/date';
import { notifySuccess, notifyWarning, tapLight } from '../../src/utils/haptics';

export default function LimitesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { budgets, expenses, categories, categoriesWithSubs, setBudget, deleteBudget } =
    useData();

  const scrollRef = useRef<ScrollView>(null);

  // Formulário de novo limite.
  const [period, setPeriod] = useState<Period>('month');
  const [categoryId, setCategoryId] = useState<string | null>(null); // null = geral
  const [raw, setRaw] = useState('');

  const alerts = useMemo(
    () => evaluateBudgets(budgets, expenses, categories, new Date()),
    [budgets, expenses, categories]
  );

  const amount = rawToReais(raw);
  const canSave = amount > 0;

  async function handleAdd() {
    if (!canSave) {
      notifyWarning();
      return;
    }
    await setBudget({ category_id: categoryId, period, limit_amount: amount });
    notifySuccess();
    setRaw('');
    setCategoryId(null);
  }

  function confirmRemove(id: string) {
    const msg = 'Remover este limite?';
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(msg)) deleteBudget(id);
      return;
    }
    deleteBudget(id);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Meus Limites</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>
        Defina um teto de gastos (geral ou por categoria) e o app avisa quando você
        se aproximar (80%) ou ultrapassar o limite.
      </Text>

      {/* Limites existentes */}
      {alerts.length > 0 && (
        <View style={styles.list}>
          {alerts.map((a) => {
            const color =
              a.level === 'exceeded'
                ? colors.danger
                : a.level === 'warning'
                  ? colors.warning
                  : colors.success;
            return (
              <View key={a.budget.id} style={[styles.budgetCard, { backgroundColor: colors.card }]}>
                <View style={styles.budgetTop}>
                  {a.category ? (
                    <CategoryIcon icon={a.category.icon} color={a.category.color} size={40} />
                  ) : (
                    <View style={[styles.globalIcon, { backgroundColor: colors.primarySoft }]}>
                      <MaterialCommunityIcons name="earth" size={22} color={colors.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.budgetName, { color: colors.text }]}>
                      {a.category?.name ?? 'Limite geral'}
                    </Text>
                    <Text style={[styles.budgetSub, { color: colors.textMuted }]}>
                      {a.budget.period === 'month' ? 'Mensal' : 'Anual'} ·{' '}
                      {formatBRL(a.spent)} de {formatBRL(a.budget.limit_amount)}
                    </Text>
                  </View>
                  <Pressable onPress={() => confirmRemove(a.budget.id)} hitSlop={10}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
                <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.min(a.ratio * 100, 100)}%`, backgroundColor: color },
                    ]}
                  />
                </View>
                <Text style={[styles.percent, { color }]}>
                  {Math.round(a.ratio * 100)}% utilizado
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Novo limite */}
      <Text style={[styles.formTitle, { color: colors.text }]}>Novo limite</Text>
      <View style={[styles.formCard, { backgroundColor: colors.card }]}>
        {/* Período */}
        <View style={[styles.segment, { backgroundColor: colors.surface }]}>
          {(['month', 'year'] as Period[]).map((p) => {
            const active = period === p;
            return (
              <Pressable
                key={p}
                onPress={() => {
                  tapLight();
                  setPeriod(p);
                }}
                style={[styles.segmentBtn, active && { backgroundColor: colors.card }]}
              >
                <Text style={{ color: active ? colors.primary : colors.textMuted, fontWeight: '700' }}>
                  {p === 'month' ? 'Mensal' : 'Anual'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Categoria (geral + categorias-mãe) */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Aplicar a</Text>
        <View style={styles.chipsWrap}>
          <Pressable
            onPress={() => {
              tapLight();
              setCategoryId(null);
            }}
            style={[
              styles.chip,
              {
                backgroundColor: categoryId === null ? hexWithAlpha(colors.primary, 0.16) : colors.surface,
                borderColor: categoryId === null ? colors.primary : 'transparent',
              },
            ]}
          >
            <MaterialCommunityIcons name="earth" size={18} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.text }]}>Geral</Text>
          </Pressable>
          {categoriesWithSubs.map((cat) => {
            const active = cat.id === categoryId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  tapLight();
                  setCategoryId(cat.id);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? hexWithAlpha(cat.color, 0.16) : colors.surface,
                    borderColor: active ? cat.color : 'transparent',
                  },
                ]}
              >
                <AppIcon icon={cat.icon} size={18} color={cat.color} />
                <Text style={[styles.chipText, { color: colors.text }]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Valor */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Valor do limite</Text>
        <View style={[styles.amountBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.currency, { color: colors.textMuted }]}>R$</Text>
          <TextInput
            value={maskCurrencyInput(raw)}
            onChangeText={(t) => setRaw(t.replace(/\D/g, '').slice(0, 11))}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
            keyboardType="number-pad"
            style={[styles.amountInput, { color: colors.text }]}
            placeholder="0,00"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <PressableScale
          onPress={handleAdd}
          disabled={!canSave}
          scaleTo={0.97}
          style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.surface }]}
        >
          <Text style={[styles.saveText, { color: canSave ? colors.onPrimary : colors.textMuted }]}>
            Salvar limite
          </Text>
        </PressableScale>
      </View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 14,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  intro: { fontSize: 15, lineHeight: 21 },
  list: { gap: 12 },
  budgetCard: { borderRadius: 16, padding: 14, gap: 10 },
  budgetTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  globalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetName: { fontSize: 16, fontWeight: '700' },
  budgetSub: { fontSize: 13, marginTop: 2 },
  barTrack: { height: 8, borderRadius: 5, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 5 },
  percent: { fontSize: 13, fontWeight: '600' },
  formTitle: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  formCard: { borderRadius: 18, padding: 16, gap: 12 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  fieldLabel: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  currency: { fontSize: 20, fontWeight: '700' },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    height: '100%',
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveText: { fontSize: 17, fontWeight: '700' },
});
