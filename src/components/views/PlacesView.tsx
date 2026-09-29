import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useT } from '../../i18n';
import { Text } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';
import { Expense } from '../../types';
import { NO_PLACE_KEY, totalsByPlace } from '../../utils/analytics';
import { Period } from '../../utils/date';
import { mapsLinkFor } from '../../utils/place';
import { hexWithAlpha } from '../CategoryIcon';
import { ExpenseList } from './ExpenseList';
import { RankRow } from './RankRow';

type Props = {
  expenses: Expense[];
  refDate: Date;
  period: Period;
};

/** Onde o dinheiro fica: ranking dos estabelecimentos, com atalho pro Maps. */
export function PlacesView({ expenses, refDate, period }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => setSelected(null), [refDate, period]);

  const groups = useMemo(
    () => totalsByPlace(expenses, refDate, period),
    [expenses, refDate, period]
  );
  const known = groups.filter((g) => g.key !== NO_PLACE_KEY);
  const unknown = groups.find((g) => g.key === NO_PLACE_KEY);

  if (known.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="map-marker-radius" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t.views.placesEmpty}</Text>
      </View>
    );
  }

  // Participação medida só entre os gastos com local — senão o "sem local"
  // achata todas as barras.
  const knownTotal = known.reduce((s, g) => s + g.total, 0);

  return (
    <View style={{ gap: 10 }}>
      {unknown && (
        <View style={[styles.note, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="information-outline" size={16} color={colors.textMuted} />
          <Text style={[styles.noteText, { color: colors.textMuted }]}>
            {t.views.unknownShare(Math.round(unknown.percent * 100))}
          </Text>
        </View>
      )}

      {known.map((g, index) => {
        const open = selected === g.key;
        const link = mapsLinkFor(g.name, g.url);
        return (
          <RankRow
            key={g.key}
            icon={
              <View style={[styles.rank, { backgroundColor: hexWithAlpha(colors.primary, 0.14) }]}>
                {g.url ? (
                  <MaterialCommunityIcons name="google-maps" size={20} color={colors.primary} />
                ) : (
                  <Text style={[styles.rankText, { color: colors.primary }]}>{index + 1}</Text>
                )}
              </View>
            }
            title={g.name ?? t.place.noPlace}
            subtitle={t.views.visits(g.count)}
            total={g.total}
            percent={knownTotal > 0 ? g.total / knownTotal : 0}
            color={colors.primary}
            expanded={open}
            dimmed={selected !== null && !open}
            onPress={() => setSelected(open ? null : g.key)}
          >
            {link && (
              <Pressable
                onPress={() => Linking.openURL(link).catch(() => {})}
                style={[styles.mapsBtn, { backgroundColor: colors.surface }]}
              >
                <MaterialCommunityIcons name="open-in-new" size={15} color={colors.primary} />
                <Text style={[styles.mapsText, { color: colors.primary }]}>
                  {g.url ? t.place.openMaps : t.place.findOnMaps}
                </Text>
              </Pressable>
            )}
            <ExpenseList expenses={g.expenses} />
          </RankRow>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 16, fontWeight: '800' },
  mapsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  mapsText: { fontSize: 13, fontWeight: '700' },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
  },
  noteText: { fontSize: 13, flex: 1 },
  empty: { alignItems: 'center', paddingTop: 30, gap: 12 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 15, textAlign: 'center', maxWidth: 300, lineHeight: 21 },
});
