import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CategoryIcon, hexWithAlpha } from '../../src/components/CategoryIcon';
import { ExpenseRow } from '../../src/components/ExpenseRow';
import { PeriodSwitcher } from '../../src/components/PeriodSwitcher';
import { useData } from '../../src/context/DataContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { Expense } from '../../src/types';
import {
  evaluateBudgets,
  expensesForPeriod,
  totalsByCategory,
  totalForPeriod,
} from '../../src/utils/analytics';
import { formatBRL } from '../../src/utils/currency';
import { Period } from '../../src/utils/date';

export default function HomeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { expenses, categories, budgets, getCategory, loading, seeding } = useData();

  const [period, setPeriod] = useState<Period>('month');
  const [refDate, setRefDate] = useState(new Date());

  const periodExpenses = useMemo(
    () => expensesForPeriod(expenses, refDate, period),
    [expenses, refDate, period]
  );
  const total = useMemo(
    () => totalForPeriod(expenses, refDate, period),
    [expenses, refDate, period]
  );
  const byCategory = useMemo(
    () => totalsByCategory(expenses, categories, refDate, period).slice(0, 4),
    [expenses, categories, refDate, period]
  );
  const alerts = useMemo(
    () =>
      evaluateBudgets(budgets, expenses, categories, refDate).filter(
        (a) => a.level !== 'ok' && a.budget.period === period
      ),
    [budgets, expenses, categories, refDate, period]
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.textMuted }]}>
            Olá 👋
          </Text>
          <Text style={[styles.appName, { color: colors.text }]}>Meus Gastos</Text>
        </View>
      </View>

      <PeriodSwitcher
        period={period}
        refDate={refDate}
        onChangePeriod={setPeriod}
        onChangeDate={setRefDate}
      />

      {/* Cartão de total do período */}
      <View style={[styles.totalCard, { backgroundColor: colors.primary }]}>
        <Text style={[styles.totalLabel, { color: hexWithAlpha(colors.onPrimary, 0.85) }]}>
          Total gasto {period === 'month' ? 'no mês' : 'no ano'}
        </Text>
        <Text style={[styles.totalValue, { color: colors.onPrimary }]}>
          {formatBRL(total)}
        </Text>
        <Text style={[styles.totalCount, { color: hexWithAlpha(colors.onPrimary, 0.85) }]}>
          {periodExpenses.length}{' '}
          {periodExpenses.length === 1 ? 'lançamento' : 'lançamentos'}
        </Text>
      </View>

      {/* Alertas de orçamento */}
      {alerts.map((alert) => {
        const exceeded = alert.level === 'exceeded';
        return (
          <View
            key={alert.budget.id}
            style={[
              styles.alert,
              {
                backgroundColor: exceeded ? colors.dangerSoft : hexWithAlpha(colors.warning, 0.15),
                borderColor: exceeded ? colors.danger : colors.warning,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={exceeded ? 'alert-circle' : 'alert'}
              size={22}
              color={exceeded ? colors.danger : colors.warning}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.text }]}>
                {exceeded ? 'Limite ultrapassado' : 'Perto do limite'}
                {alert.category ? ` · ${alert.category.name}` : ' · Geral'}
              </Text>
              <Text style={[styles.alertText, { color: colors.textMuted }]}>
                {formatBRL(alert.spent)} de {formatBRL(alert.budget.limit_amount)} (
                {Math.round(alert.ratio * 100)}%)
              </Text>
            </View>
          </View>
        );
      })}

      {/* Resumo por categoria */}
      {byCategory.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Por categoria
          </Text>
          {byCategory.map((item) => (
            <View key={item.categoryId ?? 'sem'} style={styles.catRow}>
              <CategoryIcon
                icon={item.category?.icon ?? 'tag'}
                color={item.category?.color ?? colors.textMuted}
                size={38}
              />
              <View style={styles.catMiddle}>
                <View style={styles.catLabelRow}>
                  <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                    {item.category?.name ?? 'Sem categoria'}
                  </Text>
                  <Text style={[styles.catValue, { color: colors.text }]}>
                    {formatBRL(item.total)}
                  </Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.max(item.percent * 100, 4)}%`,
                        backgroundColor: item.category?.color ?? colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {periodExpenses.length > 0 && (
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 8 }]}>
          Lançamentos
        </Text>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (loading || seeding) {
      return (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {seeding ? 'Preparando suas categorias...' : 'Carregando...'}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="cash-plus" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          Nenhum gasto por aqui
        </Text>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          Toque no botão + para lançar seu primeiro gasto deste período.
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Expense }) => (
    <ExpenseRow
      expense={item}
      category={getCategory(item.category_id)}
      subcategory={getCategory(item.subcategory_id)}
      onPress={() => router.push({ pathname: '/novo', params: { id: item.id } })}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <FlatList
        data={periodExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  header: { gap: 16, paddingTop: 8, paddingBottom: 12 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 15 },
  appName: { fontSize: 24, fontWeight: '800' },
  totalCard: {
    borderRadius: 22,
    padding: 22,
    ...Platform.select({
      web: { boxShadow: '0 10px 30px rgba(14,165,164,0.3)' } as any,
      default: {
        shadowColor: '#0EA5A4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 6,
      },
    }),
  },
  totalLabel: { fontSize: 15, fontWeight: '500' },
  totalValue: { fontSize: 40, fontWeight: '800', marginVertical: 4 },
  totalCount: { fontSize: 14 },
  alert: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  alertTitle: { fontSize: 15, fontWeight: '700' },
  alertText: { fontSize: 13, marginTop: 2 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catMiddle: { flex: 1, gap: 6 },
  catLabelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  catValue: { fontSize: 15, fontWeight: '700' },
  barTrack: { height: 7, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  empty: { alignItems: 'center', paddingTop: 50, gap: 12 },
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 19, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center', maxWidth: 280, lineHeight: 21 },
});
