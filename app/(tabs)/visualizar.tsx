import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useScrollToTop } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PeriodSwitcher } from '../../src/components/PeriodSwitcher';
import { CategoryView } from '../../src/components/views/CategoryView';
import { ListView } from '../../src/components/views/ListView';
import { PaymentView } from '../../src/components/views/PaymentView';
import { PlacesView } from '../../src/components/views/PlacesView';
import { TimelineView } from '../../src/components/views/TimelineView';
import { WeekdayView } from '../../src/components/views/WeekdayView';
import { useData } from '../../src/context/DataContext';
import { useT } from '../../src/i18n';
import { Text } from '../../src/theme/typography';
import { useTheme } from '../../src/theme/ThemeContext';
import { elapsedDays, expensesForPeriod } from '../../src/utils/analytics';
import { formatBRL } from '../../src/utils/currency';
import { Period } from '../../src/utils/date';

type Mode = 'categories' | 'timeline' | 'payment' | 'places' | 'weekday' | 'list';

const MODES: { key: Mode; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'categories', icon: 'chart-donut' },
  { key: 'timeline', icon: 'chart-bar' },
  { key: 'payment', icon: 'credit-card-outline' },
  { key: 'places', icon: 'map-marker-outline' },
  { key: 'weekday', icon: 'calendar-week' },
  { key: 'list', icon: 'format-list-bulleted' },
];

/**
 * Visualizar gastos: o mesmo período visto por vários ângulos — categoria,
 * tempo, meio de pagamento, lugar, dia da semana ou a lista crua.
 */
export default function VisualizarScreen() {
  const { colors } = useTheme();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { expenses, categories } = useData();

  const [period, setPeriod] = useState<Period>('month');
  const [refDate, setRefDate] = useState(new Date());
  const [mode, setMode] = useState<Mode>('categories');

  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  /** Topo da área da visão dentro do scroll, pra visão pedir rolagem relativa. */
  const viewTop = useRef(0);

  const inPeriod = useMemo(
    () => expensesForPeriod(expenses, refDate, period),
    [expenses, refDate, period]
  );
  const total = inPeriod.reduce((s, e) => s + e.amount, 0);
  const days = elapsedDays(refDate, period);
  // Média mensal do ano: só os meses que já começaram contam.
  const now = new Date();
  const months = refDate.getFullYear() === now.getFullYear() ? now.getMonth() + 1 : 12;

  const props = { expenses, refDate, period };

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t.views.title}</Text>

      <PeriodSwitcher
        period={period}
        refDate={refDate}
        onChangePeriod={setPeriod}
        onChangeDate={setRefDate}
      />

      {/* Modos de visualização */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.modes}
        style={styles.modesScroll}
      >
        {MODES.map((m) => {
          const active = m.key === mode;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMode(m.key)}
              style={[
                styles.modeChip,
                { backgroundColor: active ? colors.primary : colors.card },
              ]}
            >
              <MaterialCommunityIcons
                name={m.icon}
                size={17}
                color={active ? colors.onPrimary : colors.textMuted}
              />
              <Text
                style={[styles.modeText, { color: active ? colors.onPrimary : colors.text }]}
              >
                {t.views.modes[m.key]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {inPeriod.length === 0 ? (
        <View style={styles.empty}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="chart-box-outline" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>{t.charts.emptyTitle}</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.charts.emptyText}</Text>
        </View>
      ) : (
        <>
          {/* Resumo do período, igual em todos os modos */}
          <View style={styles.summary}>
            <Summary label={t.views.total} value={formatBRL(total)} />
            <Summary label={t.views.entries} value={String(inPeriod.length)} />
            <Summary
              label={period === 'year' ? t.views.monthlyAvg : t.views.dailyAvg}
              value={formatBRL(period === 'year' ? total / months : total / days)}
            />
            <Summary label={t.views.ticket} value={formatBRL(total / inPeriod.length)} />
          </View>

          <View
            onLayout={(e) => {
              viewTop.current = e.nativeEvent.layout.y;
            }}
          >
            {mode === 'categories' && (
              <CategoryView
                {...props}
                categories={categories}
                onScrollTo={(y) =>
                  scrollRef.current?.scrollTo({ y: Math.max(viewTop.current + y, 0), animated: true })
                }
              />
            )}
            {mode === 'timeline' && <TimelineView {...props} />}
            {mode === 'payment' && <PaymentView {...props} />}
            {mode === 'places' && <PlacesView {...props} />}
            {mode === 'weekday' && <WeekdayView {...props} />}
            {mode === 'list' && <ListView {...props} />}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.summaryCell, { backgroundColor: colors.card }]}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    gap: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '800' },
  // O carrossel de modos encosta nas bordas da tela, como um trilho.
  modesScroll: { marginHorizontal: -16 },
  modes: { gap: 8, paddingHorizontal: 16 },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
  },
  modeText: { fontSize: 14, fontWeight: '700' },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCell: {
    flexGrow: 1,
    flexBasis: '46%',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 2,
  },
  summaryLabel: { fontSize: 12, fontWeight: '600' },
  summaryValue: { fontSize: 17, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 40, gap: 12 },
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
