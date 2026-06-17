import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { monthName, toISODate } from '../utils/date';
import { tapLight } from '../utils/haptics';

type Props = {
  visible: boolean;
  selected: Date;
  /** Data máxima selecionável (padrão: hoje — bloqueia futuro). */
  maxDate?: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
};

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/** Calendário mensal próprio (funciona em mobile e web), com navegação fácil. */
export function CalendarModal({ visible, selected, maxDate, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const [view, setView] = useState(() => new Date(selected));

  // Sincroniza o mês exibido sempre que o modal reabre.
  React.useEffect(() => {
    if (visible) setView(new Date(selected));
  }, [visible]);

  const max = maxDate ?? new Date();
  const year = view.getFullYear();
  const month = view.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Monta a matriz de células (vazias antes do dia 1).
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selISO = toISODate(selected);
  const maxISO = toISODate(max);

  function shiftMonth(delta: number) {
    tapLight();
    setView(new Date(year, month + delta, 1));
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho com navegação de mês */}
          <View style={styles.header}>
            <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.text} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: colors.text }]}>
              {monthName(month)} {year}
            </Text>
            <Pressable onPress={() => shiftMonth(1)} hitSlop={10} style={[styles.navBtn, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Dias da semana */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={[styles.weekday, { color: colors.textMuted }]}>
                {w}
              </Text>
            ))}
          </View>

          {/* Grade de dias */}
          <View style={styles.grid}>
            {cells.map((day, i) => {
              if (day === null) return <View key={`e${i}`} style={styles.cell} />;
              const date = new Date(year, month, day);
              const iso = toISODate(date);
              const isSelected = iso === selISO;
              const isFuture = iso > maxISO;
              const isToday = iso === toISODate(new Date());
              return (
                <Pressable
                  key={day}
                  disabled={isFuture}
                  onPress={() => {
                    tapLight();
                    onSelect(date);
                    onClose();
                  }}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.dayInner,
                      isSelected && { backgroundColor: colors.primary },
                      !isSelected && isToday && { borderWidth: 1.5, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={{
                        color: isFuture
                          ? colors.border
                          : isSelected
                            ? colors.onPrimary
                            : colors.text,
                        fontWeight: isSelected || isToday ? '700' : '500',
                        fontSize: 15,
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={() => {
              tapLight();
              onSelect(new Date());
              onClose();
            }}
            style={[styles.todayBtn, { backgroundColor: colors.surface }]}
          >
            <MaterialCommunityIcons name="calendar-today" size={18} color={colors.primary} />
            <Text style={[styles.todayText, { color: colors.primary }]}>Hoje</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekday: { flex: 1, textAlign: 'center', fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    marginTop: 12,
  },
  todayText: { fontSize: 15, fontWeight: '700' },
});
