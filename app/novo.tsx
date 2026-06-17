import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hexWithAlpha } from '../src/components/CategoryIcon';
import { PressableScale } from '../src/components/PressableScale';
import { SuccessOverlay } from '../src/components/SuccessOverlay';
import { useData } from '../src/context/DataContext';
import { useTheme } from '../src/theme/ThemeContext';
import { formatBRL, maskCurrencyInput, rawToReais, reaisToRaw } from '../src/utils/currency';
import { fromISODate, relativeDayLabel, toISODate } from '../src/utils/date';
import { notifySuccess, notifyWarning, tapLight } from '../src/utils/haptics';

export default function NovoGastoScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const {
    categoriesWithSubs,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useData();

  const editing = expenses.find((e) => e.id === params.id);

  const [raw, setRaw] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const amountRef = useRef<TextInput>(null);

  // Pré-carrega os dados quando estamos editando um gasto.
  useEffect(() => {
    if (editing) {
      setRaw(reaisToRaw(editing.amount));
      setCategoryId(editing.category_id);
      setSubcategoryId(editing.subcategory_id);
      setNote(editing.note ?? '');
      setDate(fromISODate(editing.occurred_at));
    } else {
      const t = setTimeout(() => amountRef.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [editing?.id]);

  const amount = rawToReais(raw);
  const selectedCategory = categoriesWithSubs.find((c) => c.id === categoryId);

  const canSave = amount > 0 && categoryId !== null && !saving;

  async function handleSave() {
    if (!canSave) {
      notifyWarning();
      return;
    }
    setSaving(true);
    const payload = {
      amount,
      note: note.trim() || null,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      occurred_at: toISODate(date),
    };

    if (editing) {
      await updateExpense(editing.id, payload);
      notifySuccess();
      router.back();
    } else {
      const created = await addExpense(payload);
      if (created) {
        notifySuccess();
        setShowSuccess(true); // dispara a comemoração
      } else {
        notifyWarning();
        setSaving(false);
      }
    }
  }

  async function handleDelete() {
    if (!editing) return;
    await deleteExpense(editing.id);
    notifySuccess();
    router.back();
  }

  const quickDates = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    return [
      { label: 'Hoje', value: today },
      { label: 'Ontem', value: yesterday },
    ];
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        {/* Cabeçalho */}
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
            <MaterialCommunityIcons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {editing ? 'Editar gasto' : 'Novo gasto'}
          </Text>
          {editing ? (
            <Pressable onPress={handleDelete} hitSlop={12} style={styles.headerBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.danger} />
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Valor com máscara de R$ */}
          <Pressable
            style={styles.amountWrap}
            onPress={() => amountRef.current?.focus()}
          >
            <Text style={[styles.currencySymbol, { color: colors.textMuted }]}>R$</Text>
            <TextInput
              ref={amountRef}
              value={maskCurrencyInput(raw)}
              onChangeText={(t) => setRaw(t.replace(/\D/g, '').slice(0, 11))}
              keyboardType="number-pad"
              style={[styles.amountInput, { color: amount > 0 ? colors.text : colors.textMuted }]}
              placeholder="0,00"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
            />
          </Pressable>

          {/* Categorias */}
          <Text style={[styles.label, { color: colors.text }]}>Categoria</Text>
          <View style={styles.chipsWrap}>
            {categoriesWithSubs.map((cat) => {
              const active = cat.id === categoryId;
              return (
                <PressableScale
                  key={cat.id}
                  onPress={() => {
                    tapLight();
                    setCategoryId(cat.id);
                    setSubcategoryId(null);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? hexWithAlpha(cat.color, 0.16) : colors.card,
                      borderColor: active ? cat.color : colors.border,
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? colors.text : colors.textMuted },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          {/* Subcategorias da categoria escolhida */}
          {selectedCategory && selectedCategory.subcategories.length > 0 && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                Subcategoria <Text style={{ color: colors.textMuted }}>(opcional)</Text>
              </Text>
              <View style={styles.chipsWrap}>
                {selectedCategory.subcategories.map((sub) => {
                  const active = sub.id === subcategoryId;
                  return (
                    <Pressable
                      key={sub.id}
                      onPress={() => {
                        tapLight();
                        setSubcategoryId(active ? null : sub.id);
                      }}
                      style={[
                        styles.subChip,
                        {
                          backgroundColor: active
                            ? hexWithAlpha(selectedCategory.color, 0.16)
                            : colors.surface,
                          borderColor: active ? selectedCategory.color : 'transparent',
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={sub.icon}
                        size={16}
                        color={selectedCategory.color}
                      />
                      <Text style={[styles.subChipText, { color: colors.text }]}>
                        {sub.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          )}

          {/* Data */}
          <Text style={[styles.label, { color: colors.text }]}>Quando</Text>
          <View style={styles.chipsWrap}>
            {quickDates.map((q) => {
              const active = toISODate(q.value) === toISODate(date);
              return (
                <Pressable
                  key={q.label}
                  onPress={() => {
                    tapLight();
                    setDate(q.value);
                  }}
                  style={[
                    styles.dateChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: active ? colors.onPrimary : colors.textMuted,
                      fontWeight: '600',
                    }}
                  >
                    {q.label}
                  </Text>
                </Pressable>
              );
            })}
            <View style={[styles.dateChip, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="calendar" size={16} color={colors.textMuted} />
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {relativeDayLabel(toISODate(date))}
              </Text>
            </View>
          </View>

          {/* Observação */}
          <Text style={[styles.label, { color: colors.text }]}>
            Observação <Text style={{ color: colors.textMuted }}>(opcional)</Text>
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Ex.: almoço com a equipe"
            placeholderTextColor={colors.textMuted}
            style={[
              styles.noteInput,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
          />
        </ScrollView>

        {/* Botão salvar */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <PressableScale
            onPress={handleSave}
            disabled={!canSave}
            scaleTo={0.97}
            style={[
              styles.saveBtn,
              { backgroundColor: canSave ? colors.primary : colors.surface },
            ]}
          >
            <MaterialCommunityIcons
              name="check"
              size={22}
              color={canSave ? colors.onPrimary : colors.textMuted}
            />
            <Text
              style={[
                styles.saveText,
                { color: canSave ? colors.onPrimary : colors.textMuted },
              ]}
            >
              {editing ? 'Salvar alterações' : 'Lançar gasto'}
            </Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>

      <SuccessOverlay
        visible={showSuccess}
        amountLabel={formatBRL(amount)}
        onDone={() => {
          setShowSuccess(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 10,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  currencySymbol: { fontSize: 28, fontWeight: '700' },
  amountInput: {
    fontSize: 52,
    fontWeight: '800',
    minWidth: 120,
    textAlign: 'center',
    padding: 0,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  label: { fontSize: 16, fontWeight: '700', marginTop: 10, marginBottom: 2 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  subChipText: { fontSize: 13, fontWeight: '500' },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  noteInput: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  saveText: { fontSize: 18, fontWeight: '700' },
});
