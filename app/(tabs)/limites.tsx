import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import { useScrollToTop } from 'expo-router';
import React,
  { useMemo,
  useRef,
  useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '../../src/theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../src/components/AppIcon';
import { CategoryIcon, hexWithAlpha } from '../../src/components/CategoryIcon';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { PressableScale } from '../../src/components/PressableScale';
import { useData } from '../../src/context/DataContext';
import { useLedger } from '../../src/context/LedgerContext';
import { useT } from '../../src/i18n';
import { useTheme } from '../../src/theme/ThemeContext';
import { evaluateBudgets } from '../../src/utils/analytics';
import { formatBRL, maskCurrencyInput, rawToReais } from '../../src/utils/currency';
import { Period } from '../../src/utils/date';

export default function LimitesScreen() {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { canWrite } = useLedger();
  const { budgets, expenses, categories, categoriesWithSubs, setBudget, deleteBudget } =
    useData();

  const scrollRef = useRef<ScrollView>(null);
  // Tocar na aba já ativa volta ao topo em vez de não fazer nada.
  useScrollToTop(scrollRef);

  // Formulário de novo limite.
  const [period, setPeriod] = useState<Period>('month');
  const [categoryId, setCategoryId] = useState<string | null>(null); // null = geral
  const [raw, setRaw] = useState('');

  // Limite aguardando confirmação de remoção (guarda o nome pra mostrar no diálogo).
  const [removing, setRemoving] = useState<{ id: string; label: string } | null>(null);
  const [removingBusy, setRemovingBusy] = useState(false);

  const alerts = useMemo(
    () => evaluateBudgets(budgets, expenses, categories, new Date()),
    [budgets, expenses, categories]
  );

  const amount = rawToReais(raw);
  const canSave = amount > 0;

  async function handleAdd() {
    if (!canSave) {
      return;
    }
    await setBudget({ category_id: categoryId, period, limit_amount: amount });
    setRaw('');
    setCategoryId(null);
  }

  async function handleRemove() {
    if (!removing) return;
    setRemovingBusy(true);
    await deleteBudget(removing.id);
    setRemovingBusy(false);
    setRemoving(null);
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
      <Text style={[styles.title, { color: colors.text }]}>{t.limits.title}</Text>
      <Text style={[styles.intro, { color: colors.textMuted }]}>
        {t.limits.intro}
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
                      {a.category?.name ?? t.common.generalLimit}
                    </Text>
                    <Text style={[styles.budgetSub, { color: colors.textMuted }]}>
                      {t.limits.budgetSub(
                        a.budget.period === 'month' ? t.limits.monthly : t.limits.yearly,
                        formatBRL(a.spent),
                        formatBRL(a.budget.limit_amount)
                      )}
                    </Text>
                  </View>
                  {canWrite && (
                    <Pressable
                      onPress={() =>
                        setRemoving({
                          id: a.budget.id,
                          label: a.category?.name ?? t.common.generalLimit,
                        })
                      }
                      hitSlop={10}
                    >
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={20}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  )}
                </View>
                <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                  <View style={[styles.barFill, { width: `${Math.min(a.ratio * 100, 100)}%` }]}>
                    {a.segments.length > 0 ? (
                      // Limite geral: cada categoria pinta sua fatia do gasto.
                      a.segments.map((s) => (
                        <View
                          key={s.categoryId ?? '__none__'}
                          style={{
                            width: `${s.share * 100}%`,
                            height: '100%',
                            backgroundColor: s.category?.color ?? colors.textMuted,
                          }}
                        />
                      ))
                    ) : (
                      <View style={{ flex: 1, backgroundColor: color }} />
                    )}
                  </View>
                </View>
                {a.segments.length > 0 && (
                  <View style={styles.legend}>
                    {a.segments.map((s) => (
                      <View key={s.categoryId ?? '__none__'} style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            {
                              backgroundColor: s.category?.color ?? colors.textMuted,
                            },
                          ]}
                        />
                        <Text style={[styles.legendText, { color: colors.textMuted }]}>
                          {s.category?.name ?? t.common.noCategory} {Math.round(s.share * 100)}%
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.percentRow}>
                  <Text style={[styles.percent, { color }]}>
                    {t.limits.usedPercent(Math.round(a.ratio * 100))}
                  </Text>
                  <Text style={[styles.remaining, { color: colors.textMuted }]}>
                    {a.spent >= a.budget.limit_amount
                      ? t.limits.overBy(formatBRL(a.spent - a.budget.limit_amount))
                      : t.limits.remaining(
                          formatBRL(a.budget.limit_amount - a.spent)
                        )}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Novo limite — quem só visualiza o caderno não define teto de gasto. */}
      {canWrite && (
      <>
      <Text style={[styles.formTitle, { color: colors.text }]}>{t.limits.newLimit}</Text>
      <View style={[styles.formCard, { backgroundColor: colors.card }]}>
        {/* Período */}
        <View style={[styles.segment, { backgroundColor: colors.surface }]}>
          {(['month', 'year'] as Period[]).map((p) => {
            const active = period === p;
            return (
              <Pressable
                key={p}
                onPress={() => {
                  setPeriod(p);
                }}
                style={[styles.segmentBtn, active && { backgroundColor: colors.card }]}
              >
                <Text style={{ color: active ? colors.primary : colors.textMuted, fontWeight: '700' }}>
                  {p === 'month' ? t.limits.monthly : t.limits.yearly}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Categoria (geral + categorias-mãe) */}
        <Text style={[styles.fieldLabel, { color: colors.text }]}>{t.limits.applyTo}</Text>
        <View style={styles.chipsWrap}>
          <Pressable
            onPress={() => {
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
            <Text style={[styles.chipText, { color: colors.text }]}>{t.common.general}</Text>
          </Pressable>
          {categoriesWithSubs.map((cat) => {
            const active = cat.id === categoryId;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
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
        <Text style={[styles.fieldLabel, { color: colors.text }]}>
          {t.limits.limitAmount}
        </Text>
        <View style={[styles.amountBox, { backgroundColor: colors.surface }]}>
          <Text style={[styles.currency, { color: colors.textMuted }]}>R$</Text>
          <TextInput
            value={maskCurrencyInput(raw)}
            onChangeText={(text) => {
              setRaw(text.replace(/\D/g, '').slice(0, 11));
            }}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
            keyboardType="number-pad"
            style={[styles.amountInput, { color: colors.text }]}
            placeholder={t.limits.amountPlaceholder}
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
            {t.limits.saveLimit}
          </Text>
        </PressableScale>
      </View>
      </>
      )}
    </ScrollView>

    <ConfirmDialog
      visible={removing !== null}
      title={t.limits.removeTitle(removing?.label ?? '')}
      message={t.limits.removeMessage}
      confirmLabel={t.common.remove}
      cancelLabel={t.common.cancel}
      icon="bell-off-outline"
      busy={removingBusy}
      onConfirm={handleRemove}
      onCancel={() => setRemoving(null)}
    />
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
  barFill: { height: '100%', borderRadius: 5, flexDirection: 'row', overflow: 'hidden' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 12, rowGap: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, fontWeight: '600' },
  percentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  percent: { fontSize: 13, fontWeight: '600' },
  remaining: { fontSize: 13, fontWeight: '600' },
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
