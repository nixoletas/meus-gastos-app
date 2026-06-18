import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../theme/typography';
import { useTheme } from '../theme/ThemeContext';
import { Period, periodLabel, shiftPeriod } from '../utils/date';

type Props = {
  period: Period;
  refDate: Date;
  onChangePeriod: (p: Period) => void;
  onChangeDate: (d: Date) => void;
};

/** Controle de navegação no tempo: alterna mês/ano e avança/retrocede. */
export function PeriodSwitcher({
  period,
  refDate,
  onChangePeriod,
  onChangeDate,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      {/* Alternância Mês / Ano */}
      <View style={[styles.segment, { backgroundColor: colors.surface }]}>
        {(['month', 'year'] as Period[]).map((p) => {
          const active = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => {
                onChangePeriod(p);
              }}
              style={[
                styles.segmentBtn,
                active && { backgroundColor: colors.card },
              ]}
            >
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? colors.primary : colors.textMuted },
                ]}
              >
                {p === 'month' ? 'Mês' : 'Ano'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Navegação anterior/próximo */}
      <View style={styles.nav}>
        <Pressable
          hitSlop={10}
          onPress={() => {
            onChangeDate(shiftPeriod(refDate, period, -1));
          }}
          style={[styles.arrow, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons name="chevron-left" size={22} color={colors.text} />
        </Pressable>
        <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
          {periodLabel(refDate, period)}
        </Text>
        <Pressable
          hitSlop={10}
          onPress={() => {
            onChangeDate(shiftPeriod(refDate, period, 1));
          }}
          style={[styles.arrow, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'center',
  },
  segmentBtn: {
    paddingHorizontal: 26,
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentText: { fontSize: 14, fontWeight: '700' },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  arrow: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
});
