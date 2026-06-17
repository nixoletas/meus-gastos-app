import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
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
  totalForPeriod,
} from '../../src/utils/analytics';
import { formatBRL } from '../../src/utils/currency';
import { Period, shiftPeriod } from '../../src/utils/date';

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { expenses, categories, budgets, getCategory, loading, seeding } = useData();

  // Segunda cor do gradiente do cartão de total (primário → ciano).
  const gradientEnd = isDark ? '#0D9488' : '#0891B2';

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
  const prevTotal = useMemo(
    () => totalForPeriod(expenses, shiftPeriod(refDate, period, -1), period),
    [expenses, refDate, period]
  );
  // Variação percentual em relação ao período anterior.
  const trend = prevTotal > 0 ? (total - prevTotal) / prevTotal : null;

  // Todos os limites do período atual (para a seção "Limite de gastos").
  const periodBudgets = useMemo(
    () =>
      evaluateBudgets(budgets, expenses, categories, refDate)
        .filter((a) => a.budget.period === period)
        .sort((a, b) => b.ratio - a.ratio),
    [budgets, expenses, categories, refDate, period]
  );
  const alerts = periodBudgets.filter((a) => a.level !== 'ok');

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
      <LinearGradient
        colors={[colors.primary, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.totalCard}
      >
        <View style={styles.totalTopRow}>
          <Text style={[styles.totalLabel, { color: hexWithAlpha('#FFFFFF', 0.9) }]}>
            Total gasto {period === 'month' ? 'no mês' : 'no ano'}
          </Text>
          <View style={styles.totalBadge}>
            <MaterialCommunityIcons name="wallet" size={18} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.totalValue}>{formatBRL(total)}</Text>
        <View style={styles.totalFooter}>
          <View style={styles.totalChip}>
            <MaterialCommunityIcons name="receipt-text-outline" size={14} color="#FFFFFF" />
            <Text style={styles.totalChipText}>
              {periodExpenses.length}{' '}
              {periodExpenses.length === 1 ? 'lançamento' : 'lançamentos'}
            </Text>
          </View>
          {trend !== null && (
            <View style={styles.totalChip}>
              <MaterialCommunityIcons
                name={trend > 0 ? 'trending-up' : trend < 0 ? 'trending-down' : 'trending-neutral'}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.totalChipText}>
                {trend > 0 ? '+' : ''}
                {Math.round(trend * 100)}% vs {period === 'month' ? 'mês' : 'ano'} anterior
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>

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

      {/* Limite de gastos */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Limite de gastos
          </Text>
          <Pressable onPress={() => router.push('/limites')} hitSlop={8}>
            <Text style={[styles.sectionAction, { color: colors.primary }]}>
              Gerenciar
            </Text>
          </Pressable>
        </View>

        {periodBudgets.length === 0 ? (
          <Pressable
            onPress={() => router.push('/limites')}
            style={[styles.budgetCta, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.ctaIcon, { backgroundColor: hexWithAlpha(colors.warning, 0.16) }]}>
              <MaterialCommunityIcons name="bell-plus" size={22} color={colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.ctaTitle, { color: colors.text }]}>
                Defina um limite
              </Text>
              <Text style={[styles.ctaText, { color: colors.textMuted }]}>
                Receba alertas ao se aproximar do teto de gastos.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
          </Pressable>
        ) : (
          periodBudgets.map((b) => {
            const barColor =
              b.level === 'exceeded'
                ? colors.danger
                : b.level === 'warning'
                  ? colors.warning
                  : colors.success;
            return (
              <View key={b.budget.id} style={styles.catRow}>
                {b.category ? (
                  <CategoryIcon icon={b.category.icon} color={b.category.color} size={38} />
                ) : (
                  <View style={[styles.globalIcon, { backgroundColor: colors.primarySoft }]}>
                    <MaterialCommunityIcons name="earth" size={20} color={colors.primary} />
                  </View>
                )}
                <View style={styles.catMiddle}>
                  <View style={styles.catLabelRow}>
                    <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                      {b.category?.name ?? 'Limite geral'}
                    </Text>
                    <Text style={[styles.catValue, { color: colors.text }]}>
                      {formatBRL(b.spent)} / {formatBRL(b.budget.limit_amount)}
                    </Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${Math.min(Math.max(b.ratio * 100, 3), 100)}%`,
                          backgroundColor: barColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            );
          })
        )}
      </View>

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
  totalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 15, fontWeight: '500' },
  totalBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalValue: { fontSize: 42, fontWeight: '800', marginVertical: 6, color: '#FFFFFF' },
  totalFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  totalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  totalChipText: { fontSize: 12.5, fontWeight: '600', color: '#FFFFFF' },
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionAction: { fontSize: 14, fontWeight: '700' },
  budgetCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  ctaIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTitle: { fontSize: 15, fontWeight: '700' },
  ctaText: { fontSize: 13, marginTop: 2 },
  globalIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
