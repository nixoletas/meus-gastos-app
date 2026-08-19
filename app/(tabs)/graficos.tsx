import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import React,
  { useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import { LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../../src/theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../src/components/AppIcon';
import { CategoryIcon, hexWithAlpha } from '../../src/components/CategoryIcon';
import { PeriodSwitcher } from '../../src/components/PeriodSwitcher';
import { PieChart, PieSlice } from '../../src/components/PieChart';
import { useData } from '../../src/context/DataContext';
import { useTheme } from '../../src/theme/ThemeContext';
import { useRouter, useScrollToTop } from 'expo-router';
import {
  subcategoryBreakdown,
  subcategoryExpenses,
  totalsByCategory,
  totalForPeriod,
} from '../../src/utils/analytics';
import { formatBRL } from '../../src/utils/currency';
import { Period, relativeDayLabel } from '../../src/utils/date';

export default function GraficosScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { expenses, categories } = useData();

  const [period, setPeriod] = useState<Period>('month');
  const [refDate, setRefDate] = useState(new Date());
  const [expandedSubKey, setExpandedSubKey] = useState<string | null>(null);
  /** Categoria em foco — a mesma pela fatia do donut e pela linha da legenda. */
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  // Posição das linhas da legenda, pra trazer a escolhida pela pizza até a vista.
  const legendTop = useRef(0);
  const rowOffsets = useRef(new Map<string, number>());

  function selectSlice(key: string | null) {
    setSelectedKey(key);
    setExpandedSubKey(null);
  }

  // Escolher pela pizza precisa trazer a linha da legenda pra vista. Espera um
  // tico porque a linha selecionada abre as subcategorias e reposiciona as outras.
  useEffect(() => {
    if (!selectedKey) return;
    const timer = setTimeout(() => {
      const offset = rowOffsets.current.get(selectedKey);
      if (offset == null) return;
      scrollRef.current?.scrollTo({
        y: Math.max(legendTop.current + offset - 12, 0),
        animated: true,
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [selectedKey]);

  function rememberRow(key: string, e: LayoutChangeEvent) {
    rowOffsets.current.set(key, e.nativeEvent.layout.y);
  }

  const byCategory = useMemo(
    () => totalsByCategory(expenses, categories, refDate, period),
    [expenses, categories, refDate, period]
  );
  const total = useMemo(
    () => totalForPeriod(expenses, refDate, period),
    [expenses, refDate, period]
  );

  const slices: PieSlice[] = byCategory.map((item) => ({
    key: item.categoryId ?? 'sem',
    value: item.total,
    color: item.category?.color ?? colors.textMuted,
  }));

  // Detalhe da fatia selecionada (mostrado no centro do donut).
  const selected = byCategory.find((c) => (c.categoryId ?? 'sem') === selectedKey);

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Gráficos</Text>

      <PeriodSwitcher
        period={period}
        refDate={refDate}
        onChangePeriod={setPeriod}
        onChangeDate={setRefDate}
      />

      {byCategory.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="chart-donut" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Sem dados neste período
          </Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Lance alguns gastos para ver a distribuição por categoria.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.chartWrap}>
            <PieChart
              data={slices}
              size={230}
              thickness={36}
              selectedKey={selectedKey}
              onSelectSlice={selectSlice}
            >
              {selected ? (
                <>
                  <View
                    style={[
                      styles.centerDot,
                      { backgroundColor: selected.category?.color ?? colors.textMuted },
                    ]}
                  />
                  <Text style={[styles.centerName, { color: colors.text }]} numberOfLines={1}>
                    {selected.category?.name ?? 'Sem categoria'}
                  </Text>
                  <Text style={[styles.centerValue, { color: colors.text }]}>
                    {formatBRL(selected.total)}
                  </Text>
                  <Text style={[styles.centerLabel, { color: colors.textMuted }]}>
                    {Math.round(selected.percent * 100)}% do total
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.centerLabel, { color: colors.textMuted }]}>Total</Text>
                  <Text style={[styles.centerValue, { color: colors.text }]}>
                    {formatBRL(total)}
                  </Text>
                  <Text style={[styles.centerHint, { color: colors.textMuted }]}>
                    toque numa fatia
                  </Text>
                </>
              )}
            </PieChart>
          </View>

          {selectedKey !== null && (
            <Pressable
              onPress={() => selectSlice(null)}
              style={[styles.clearBtn, { backgroundColor: colors.surface }]}
            >
              <MaterialCommunityIcons name="close" size={14} color={colors.textMuted} />
              <Text style={[styles.clearText, { color: colors.textMuted }]}>Limpar filtro</Text>
            </Pressable>
          )}

          <View
            style={styles.legend}
            onLayout={(e) => {
              legendTop.current = e.nativeEvent.layout.y;
            }}
          >
            {byCategory.map((item) => {
              const rowKey = item.categoryId ?? 'sem';
              const catColor = item.category?.color ?? colors.textMuted;
              const active = selectedKey === rowKey;
              // Com uma categoria em foco, as outras recuam em vez de sumir.
              const dimmed = selectedKey !== null && !active;
              const expanded = active && !!item.categoryId;
              const subs =
                expanded && item.categoryId
                  ? subcategoryBreakdown(expenses, categories, item.categoryId, refDate, period)
                  : [];
              return (
                <View
                  key={rowKey}
                  onLayout={(e) => rememberRow(rowKey, e)}
                  style={[
                    styles.legendRow,
                    {
                      backgroundColor: colors.card,
                      borderColor: active ? catColor : 'transparent',
                      opacity: dimmed ? 0.5 : 1,
                    },
                  ]}
                >
                  <Pressable
                    style={styles.legendHead}
                    onPress={() => selectSlice(active ? null : rowKey)}
                  >
                    <CategoryIcon
                      icon={item.category?.icon ?? 'tag'}
                      color={catColor}
                      size={40}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={styles.legendTop}>
                        <Text style={[styles.legendName, { color: colors.text }]} numberOfLines={1}>
                          {item.category?.name ?? 'Sem categoria'}
                        </Text>
                        <Text style={[styles.legendValue, { color: colors.text }]}>
                          {formatBRL(item.total)}
                        </Text>
                      </View>
                      <View style={styles.legendBottom}>
                        <View style={[styles.barTrack, { backgroundColor: colors.surface }]}>
                          <View
                            style={[
                              styles.barFill,
                              { width: `${Math.max(item.percent * 100, 3)}%`, backgroundColor: catColor },
                            ]}
                          />
                        </View>
                        <Text style={[styles.legendPercent, { color: colors.textMuted }]}>
                          {Math.round(item.percent * 100)}%
                        </Text>
                      </View>
                    </View>
                    {item.categoryId && (
                      <MaterialCommunityIcons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={colors.textMuted}
                      />
                    )}
                  </Pressable>

                  {/* Detalhe por subcategoria (expansível até o gasto individual) */}
                  {expanded && (
                    <View style={[styles.subList, { borderTopColor: colors.border }]}>
                      {subs.map((s) => {
                        const subOpen = expandedSubKey === s.key;
                        const items =
                          subOpen && item.categoryId
                            ? subcategoryExpenses(
                                expenses,
                                categories,
                                item.categoryId,
                                s.key,
                                refDate,
                                period
                              )
                            : [];
                        return (
                          <View key={s.key}>
                            <Pressable
                              style={styles.subRow}
                              onPress={() => setExpandedSubKey(subOpen ? null : s.key)}
                            >
                              <View
                                style={[
                                  styles.subDot,
                                  { backgroundColor: hexWithAlpha(catColor, 0.16) },
                                ]}
                              >
                                <AppIcon icon={s.sub?.icon ?? 'tag'} size={15} color={catColor} />
                              </View>
                              <Text style={[styles.subName, { color: colors.text }]} numberOfLines={1}>
                                {s.sub?.name ?? 'Sem subcategoria'}
                              </Text>
                              <Text style={[styles.subPercent, { color: colors.textMuted }]}>
                                {Math.round(s.percent * 100)}%
                              </Text>
                              <Text style={[styles.subValue, { color: colors.text }]}>
                                {formatBRL(s.total)}
                              </Text>
                              <MaterialCommunityIcons
                                name={subOpen ? 'chevron-up' : 'chevron-down'}
                                size={18}
                                color={colors.textMuted}
                              />
                            </Pressable>

                            {subOpen && (
                              <View style={styles.expenseList}>
                                {items.map((e) => (
                                  <Pressable
                                    key={e.id}
                                    style={styles.expenseRow}
                                    onPress={() =>
                                      router.push({ pathname: '/novo', params: { id: e.id } })
                                    }
                                  >
                                    <View style={[styles.expenseDot, { backgroundColor: catColor }]} />
                                    <Text
                                      style={[styles.expenseName, { color: colors.text }]}
                                      numberOfLines={1}
                                    >
                                      {e.note?.trim() || (s.sub?.name ?? 'Sem subcategoria')}
                                    </Text>
                                    <Text style={[styles.expenseDate, { color: colors.textMuted }]}>
                                      {relativeDayLabel(e.occurred_at)}
                                    </Text>
                                    <Text style={[styles.expenseValue, { color: colors.text }]}>
                                      {formatBRL(e.amount)}
                                    </Text>
                                  </Pressable>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 18,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  chartWrap: { alignItems: 'center', marginVertical: 6 },
  centerLabel: { fontSize: 14, fontWeight: '500' },
  centerValue: { fontSize: 24, fontWeight: '800', marginTop: 2 },
  centerDot: { width: 14, height: 14, borderRadius: 7, marginBottom: 6 },
  centerName: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  centerHint: { fontSize: 12, fontWeight: '500', marginTop: 4 },
  legend: { gap: 10 },
  // Borda sempre presente (transparente quando inativa) pra selecionar não mexer no layout.
  legendRow: { borderRadius: 16, overflow: 'hidden', borderWidth: 2 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    marginTop: -6,
  },
  clearText: { fontSize: 13, fontWeight: '700' },
  legendHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  subList: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
    gap: 2,
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  subDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subName: { flex: 1, fontSize: 14, fontWeight: '500' },
  subPercent: { fontSize: 12, fontWeight: '600', width: 36, textAlign: 'right' },
  subValue: { fontSize: 14, fontWeight: '700', minWidth: 70, textAlign: 'right' },
  expenseList: { paddingLeft: 38, paddingBottom: 4, gap: 1 },
  expenseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  expenseDot: { width: 6, height: 6, borderRadius: 3 },
  expenseName: { flex: 1, fontSize: 13 },
  expenseDate: { fontSize: 12, fontWeight: '500' },
  expenseValue: { fontSize: 13, fontWeight: '700', minWidth: 70, textAlign: 'right' },
  legendTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  legendName: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  legendValue: { fontSize: 15, fontWeight: '700' },
  legendBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  barTrack: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  legendPercent: { fontSize: 13, fontWeight: '600', width: 38, textAlign: 'right' },
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
