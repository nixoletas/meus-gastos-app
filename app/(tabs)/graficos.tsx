import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../src/components/AppIcon';
import { CategoryIcon, hexWithAlpha } from '../../src/components/CategoryIcon';
import { PeriodSwitcher } from '../../src/components/PeriodSwitcher';
import { PieChart, PieSlice } from '../../src/components/PieChart';
import { useData } from '../../src/context/DataContext';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  subcategoryBreakdown,
  totalsByCategory,
  totalForPeriod,
} from '../../src/utils/analytics';
import { formatBRL } from '../../src/utils/currency';
import { Period } from '../../src/utils/date';
import { tapLight } from '../../src/utils/sound';

export default function GraficosScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { expenses, categories } = useData();

  const [period, setPeriod] = useState<Period>('month');
  const [refDate, setRefDate] = useState(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  return (
    <ScrollView
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
            <PieChart data={slices} size={230} thickness={36}>
              <Text style={[styles.centerLabel, { color: colors.textMuted }]}>Total</Text>
              <Text style={[styles.centerValue, { color: colors.text }]}>
                {formatBRL(total)}
              </Text>
            </PieChart>
          </View>

          <View style={styles.legend}>
            {byCategory.map((item) => {
              const catColor = item.category?.color ?? colors.textMuted;
              const expanded = !!item.categoryId && expandedId === item.categoryId;
              const subs =
                expanded && item.categoryId
                  ? subcategoryBreakdown(expenses, categories, item.categoryId, refDate, period)
                  : [];
              return (
                <View key={item.categoryId ?? 'sem'} style={[styles.legendRow, { backgroundColor: colors.card }]}>
                  <Pressable
                    style={styles.legendHead}
                    disabled={!item.categoryId}
                    onPress={() => {
                      tapLight();
                      setExpandedId(expanded ? null : item.categoryId);
                    }}
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

                  {/* Detalhe por subcategoria */}
                  {expanded && (
                    <View style={[styles.subList, { borderTopColor: colors.border }]}>
                      {subs.map((s) => (
                        <View key={s.key} style={styles.subRow}>
                          <View
                            style={[
                              styles.subDot,
                              { backgroundColor: hexWithAlpha(catColor, 0.16) },
                            ]}
                          >
                            <AppIcon
                              icon={s.sub?.icon ?? 'tag'}
                              size={15}
                              color={catColor}
                            />
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
                        </View>
                      ))}
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
  legend: { gap: 10 },
  legendRow: { borderRadius: 16, overflow: 'hidden' },
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
