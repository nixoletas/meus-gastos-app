import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';
import { hexWithAlpha } from '../CategoryIcon';

export type Bar = {
  key: string;
  value: number;
  /** Rótulo embaixo da barra; vazio esconde (útil com 31 dias). */
  label?: string;
  /** Período que ainda não chegou: barra apagada e sem toque. */
  disabled?: boolean;
};

type Props = {
  bars: Bar[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  color: string;
  height?: number;
  /** Linha tracejada de referência (ex.: média). */
  reference?: number;
};

/**
 * Barras verticais feitas de View — sem SVG, o toque funciona igual no
 * celular e na web, e cada barra é o próprio alvo.
 */
export function BarChart({ bars, selectedKey, onSelect, color, height = 170, reference }: Props) {
  const { colors } = useTheme();
  const max = Math.max(...bars.map((b) => b.value), reference ?? 0, 0);
  const gap = bars.length > 20 ? 2 : bars.length > 10 ? 4 : 8;

  return (
    <View>
      <View style={[styles.plot, { height, gap }]}>
        {reference != null && reference > 0 && max > 0 && (
          <View
            pointerEvents="none"
            style={[
              styles.reference,
              { bottom: (reference / max) * height, borderColor: colors.textMuted },
            ]}
          />
        )}
        {bars.map((b) => {
          const active = selectedKey === b.key;
          const dimmed = selectedKey !== null && !active;
          const h = max > 0 ? Math.max((b.value / max) * height, b.value > 0 ? 3 : 0) : 0;
          return (
            <Pressable
              key={b.key}
              disabled={b.disabled}
              onPress={() => onSelect(active ? null : b.key)}
              style={styles.column}
              hitSlop={{ top: 8, bottom: 8 }}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: h,
                    backgroundColor: b.disabled
                      ? colors.surface
                      : dimmed
                        ? hexWithAlpha(color, 0.3)
                        : color,
                    borderRadius: bars.length > 20 ? 3 : 6,
                  },
                ]}
              />
              {h === 0 && !b.disabled && (
                <View style={[styles.zero, { backgroundColor: colors.border }]} />
              )}
            </Pressable>
          );
        })}
      </View>
      <View style={[styles.labels, { gap }]}>
        {bars.map((b) => (
          <View key={b.key} style={styles.labelCell}>
            {!!b.label && (
              <Text
                numberOfLines={1}
                style={[
                  styles.label,
                  {
                    color: selectedKey === b.key ? colors.text : colors.textMuted,
                    fontWeight: selectedKey === b.key ? '800' : '600',
                  },
                ]}
              >
                {b.label}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', alignItems: 'flex-end' },
  column: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%' },
  zero: { height: 2, borderRadius: 1, width: '100%' },
  reference: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  labels: { flexDirection: 'row', marginTop: 6 },
  labelCell: { flex: 1, alignItems: 'center', overflow: 'visible' },
  label: { fontSize: 10, textAlign: 'center', width: 36 },
});
