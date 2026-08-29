import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { Text, TextInput } from '../theme/typography';
import { getActiveLang } from '../i18n/active';
import { DraftItem } from '../types';
import { maskCurrencyInput, rawToReais, reaisToRaw } from '../utils/currency';

type Props = {
  visible: boolean;
  /** Item sendo editado; nulo quando é um item novo. */
  item: DraftItem | null;
  onSave: (item: DraftItem) => void;
  onDelete?: () => void;
  onCancel: () => void;
};

/** Mostra a quantidade com o separador decimal do idioma ativo. */
function formatQuantity(value: number): string {
  const texto = String(value);
  return getActiveLang() === 'en' ? texto : texto.replace('.', ',');
}

/** Aceita "1,25" e "1.25" — o teclado decimal do Android manda vírgula. */
function parseQuantity(text: string): number {
  const parsed = Number.parseFloat(text.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

/** Edição de uma subcompra: o OCR erra, e corrigir tem que ser rápido. */
export function ItemEditorModal({ visible, item, onSave, onDelete, onCancel }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('');
  const [raw, setRaw] = useState('');

  useEffect(() => {
    if (!visible) return;
    setDescription(item?.description ?? '');
    setQuantity(item ? formatQuantity(item.quantity) : '1');
    setUnit(item?.unit ?? '');
    setRaw(item && item.total > 0 ? reaisToRaw(item.total) : '');
  }, [visible, item]);

  const total = rawToReais(raw);
  const canSave = description.trim().length > 0 && total > 0;

  function handleSave() {
    if (!canSave || !item) return;
    const qty = parseQuantity(quantity);
    onSave({
      ...item,
      description: description.trim(),
      quantity: qty,
      unit: unit.trim() ? unit.trim().toLowerCase() : null,
      total,
      // Preço unitário só faz sentido recalculado: o valor da linha mudou.
      unit_price: qty > 0 ? Math.round((total / qty) * 10000) / 10000 : null,
    });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable onPress={() => {}} style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {item?.description ? t.itemEditor.editTitle : t.itemEditor.newTitle}
            </Text>
            {!!onDelete && (
              <Pressable onPress={onDelete} hitSlop={10}>
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={22}
                  color={colors.danger}
                />
              </Pressable>
            )}
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>
            {t.itemEditor.description}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t.itemEditor.descriptionPlaceholder}
            placeholderTextColor={colors.textMuted}
            autoFocus={!item?.description}
            style={[
              styles.input,
              { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
            ]}
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {t.itemEditor.quantity}
              </Text>
              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
            <View style={styles.unitCol}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {t.itemEditor.unit}
              </Text>
              <TextInput
                value={unit}
                onChangeText={setUnit}
                placeholder={t.expenseRow.defaultUnit}
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textMuted }]}>{t.itemEditor.amount}</Text>
          <View
            style={[
              styles.input,
              styles.amountWrap,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.currency, { color: colors.textMuted }]}>R$</Text>
            <TextInput
              value={maskCurrencyInput(raw)}
              onChangeText={(text) => setRaw(text.replace(/\D/g, '').slice(0, 9))}
              keyboardType="number-pad"
              style={[styles.amountInput, { color: total > 0 ? colors.text : colors.textMuted }]}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              style={[styles.button, { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{t.common.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={[
                styles.button,
                { backgroundColor: colors.primary, opacity: canSave ? 1 : 0.5 },
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{t.common.save}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 420, borderRadius: 24, padding: 22 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 19, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 10 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
    fontSize: 16,
  },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  unitCol: { width: 96 },
  amountWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  currency: { fontSize: 15, fontWeight: '700' },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    padding: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 22 },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
