import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';
import { formatBRL } from '../../utils/currency';

type Props = {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  total: number;
  percent: number;
  color: string;
  expanded: boolean;
  dimmed?: boolean;
  onPress: () => void;
  children?: React.ReactNode;
};

/** Linha de ranking: ícone, nome, valor e barra de participação; abre o detalhe. */
export function RankRow({
  icon,
  title,
  subtitle,
  total,
  percent,
  color,
  expanded,
  dimmed,
  onPress,
  children,
}: Props) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.card,
          borderColor: expanded ? color : 'transparent',
          opacity: dimmed ? 0.5 : 1,
        },
      ]}
    >
      <Pressable style={styles.head} onPress={onPress}>
        {icon}
        <View style={{ flex: 1 }}>
          <View style={styles.top}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
              {title}
            </Text>
            <Text style={[styles.value, { color: colors.text }]}>{formatBRL(total)}</Text>
          </View>
          {!!subtitle && (
            <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
          <View style={styles.bottom}>
            <View style={[styles.track, { backgroundColor: colors.surface }]}>
              <View
                style={[
                  styles.fill,
                  { width: `${Math.max(percent * 100, 3)}%`, backgroundColor: color },
                ]}
              />
            </View>
            <Text style={[styles.percent, { color: colors.textMuted }]}>
              {Math.round(percent * 100)}%
            </Text>
          </View>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={colors.textMuted}
        />
      </Pressable>
      {expanded && children && (
        <View style={[styles.body, { borderTopColor: colors.border }]}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Borda sempre presente (transparente quando inativa) pra abrir não mexer no layout.
  row: { borderRadius: 16, overflow: 'hidden', borderWidth: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  value: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  track: { flex: 1, height: 7, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  percent: { fontSize: 13, fontWeight: '600', width: 38, textAlign: 'right' },
  body: { borderTopWidth: 1, padding: 10, gap: 8 },
});
