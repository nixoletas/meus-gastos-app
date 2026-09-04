import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect,
  useLocalSearchParams,
  useRouter } from 'expo-router';
import React,
  { useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '../src/theme/typography';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '../src/components/AppIcon';
import { CalendarModal } from '../src/components/CalendarModal';
import { hexWithAlpha } from '../src/components/CategoryIcon';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { PressableScale } from '../src/components/PressableScale';
import { ReceiptSection } from '../src/components/ReceiptSection';
import { SuccessFlash } from '../src/components/SuccessFlash';
import { SuccessOverlay } from '../src/components/SuccessOverlay';
import { useData } from '../src/context/DataContext';
import { useLedger } from '../src/context/LedgerContext';
import { useT } from '../src/i18n';
import { ParseResult, takePendingScan } from '../src/lib/receipts';
import { useReceipt } from '../src/lib/useReceipt';
import { useTheme } from '../src/theme/ThemeContext';
import { formatBRL, maskCurrencyInput, rawToReais, reaisToRaw } from '../src/utils/currency';
import { fromISODate, relativeDayLabel, toISODate } from '../src/utils/date';

/**
 * Última data usada num novo gasto, junto do dia em que foi escolhida.
 *
 * Quem está lançando um mês atrasado de uma vez não reabre o calendário a cada
 * item. Só vale dentro do mesmo dia: no celular o app fica aberto por dias em
 * segundo plano, e sem isso o lançamento de amanhã cairia calado numa data
 * velha. (Na web o mesmo papel é feito pelo `sessionStorage`, que morre com a aba.)
 */
let lastUsed: { date: string; on: string } | null = null;

function readRememberedDate(): string | null {
  if (!lastUsed) return null;
  return lastUsed.on === toISODate(new Date()) ? lastUsed.date : null;
}

export default function NovoGastoScreen() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { ownerId, canWrite } = useLedger();
  const {
    categoriesWithSubs,
    expenses,
    addExpense,
    saveExpenseWithItems,
    updateExpense,
    deleteExpense,
  } = useData();

  const { categories } = useData();
  const editing = expenses.find((e) => e.id === params.id);

  const [raw, setRaw] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => {
    if (editing) return fromISODate(editing.occurred_at);
    const remembered = readRememberedDate();
    return remembered ? fromISODate(remembered) : new Date();
  });
  /** Data escolhida à mão não pode ser trocada pela data lida da notinha. */
  const [dateTouched, setDateTouched] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  /** `id` novo a cada lançamento força a animação a rodar de novo. */
  const [flash, setFlash] = useState<{ id: number; label: string } | null>(null);
  const amountRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Notinha: foto, leitura por OCR e as subcompras que saem dela.
  const receiptState = useReceipt({
    ownerId,
    expenseId: editing?.id ?? null,
    onParsed: (result: ParseResult) => {
      // Só preenche o que está vazio: o que a pessoa digitou vale mais que o OCR.
      const total = Number(result.receipt.total ?? result.itemsTotal) || 0;
      if (total > 0) setRaw((current) => (current ? current : reaisToRaw(total)));

      const issued = result.receipt.issued_at ? new Date(result.receipt.issued_at) : null;
      if (!dateTouched && issued && !Number.isNaN(issued.getTime()) && issued <= new Date()) {
        setDate(issued);
      }
    },
  });

  // Pequena animação de "pulo" no valor a cada dígito digitado.
  const amountScale = useSharedValue(1);
  const amountAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }));

  // Detecta categorias recém-criadas (via "+ Criar") para selecioná-las na hora.
  const knownIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    const currentIds = new Set(categories.map((c) => c.id));
    if (knownIds.current === null) {
      knownIds.current = currentIds;
      return;
    }
    const novos = categories.filter((c) => !knownIds.current!.has(c.id));
    knownIds.current = currentIds;
    if (novos.length === 1) {
      const nova = novos[0];
      if (nova.parent_id) {
        setCategoryId(nova.parent_id);
        setSubcategoryId(nova.id);
      } else {
        setCategoryId(nova.id);
        setSubcategoryId(null);
      }
    }
  }, [categories]);

  // Pré-carrega os dados quando estamos editando um gasto.
  useEffect(() => {
    if (editing) {
      setRaw(reaisToRaw(editing.amount));
      setCategoryId(editing.category_id);
      setSubcategoryId(editing.subcategory_id);
      setNote(editing.note ?? '');
      setDate(fromISODate(editing.occurred_at));
    } else {
      const timer = setTimeout(() => amountRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [editing?.id]);

  // Voltando do leitor de QR: a tela do scanner só deixa o valor lido para trás.
  useFocusEffect(
    React.useCallback(() => {
      const scanned = takePendingScan();
      if (scanned) void receiptState.attachQr(scanned);
    }, [receiptState.attachQr])
  );

  function handleAmountChange(text: string) {
    setRaw(text.replace(/\D/g, '').slice(0, 11));
    // Pulso sutil (e curto, sem salto) para suavizar a digitação do valor.
    amountScale.value = withSequence(
      withTiming(1.03, { duration: 50, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 70, easing: Easing.out(Easing.quad) })
    );
  }

  const amount = rawToReais(raw);
  const selectedCategory = categoriesWithSubs.find((c) => c.id === categoryId);

  // Quem só visualiza o caderno abre esta tela como detalhe, sem salvar nada.
  const canSave = amount > 0 && categoryId !== null && !saving && canWrite;

  /**
   * `keepOpen` mantém a tela aberta com a data e a categoria, para lançar
   * vários gastos seguidos sem refazer a escolha a cada um.
   */
  async function handleSave({ keepOpen = false } = {}) {
    if (!canSave) {
      return;
    }
    setSaving(true);
    const iso = toISODate(date);
    const payload = {
      amount,
      note: note.trim() || null,
      category_id: categoryId,
      subcategory_id: subcategoryId,
      occurred_at: iso,
    };

    // Com notinha ou subcompras o gasto vai por RPC: gasto, itens e foto
    // entram numa transação só. `items_count` cobre o caso de o usuário ter
    // apagado todos os itens de um gasto que já tinha.
    const usesItems =
      receiptState.items.length > 0 ||
      receiptState.receipt !== null ||
      (editing?.items_count ?? 0) > 0;

    if (editing) {
      if (usesItems) {
        await saveExpenseWithItems({
          expense: payload,
          items: receiptState.items,
          receiptId: receiptState.receipt?.id ?? null,
          expenseId: editing.id,
        });
        receiptState.markSaved();
      } else {
        await updateExpense(editing.id, payload);
      }
      router.back();
      return;
    }

    const created = usesItems
      ? await saveExpenseWithItems({
          expense: payload,
          items: receiptState.items,
          receiptId: receiptState.receipt?.id ?? null,
        })
      : await addExpense(payload);

    if (!created) {
      setSaving(false);
      return;
    }
    receiptState.markSaved();
    lastUsed = { date: iso, on: toISODate(new Date()) };

    if (keepOpen) {
      // Comemoração leve: o overlay cheio encerra o fluxo, e aqui ele continua.
      setFlash({ id: Date.now(), label: t.expense.flashSaved(formatBRL(amount)) });
      setRaw('');
      setNote('');
      receiptState.reset();
      setSaving(false);
      amountRef.current?.focus();
      return;
    }

    setShowSuccess(true); // dispara a comemoração
  }

  async function handleDelete() {
    if (!editing) return;
    setDeleting(true);
    await deleteExpense(editing.id);
    setDeleting(false);
    setConfirmDelete(false);
    router.back();
  }

  const quickDates = useMemo(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    return [
      { label: t.expense.today, value: today },
      { label: t.expense.yesterday, value: yesterday },
    ];
  }, [t]);

  // Verdadeiro quando a data escolhida é Hoje ou Ontem (atalhos rápidos).
  const isQuickDate = quickDates.some(
    (q) => toISODate(q.value) === toISODate(date)
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        style={styles.flex}
      >
        {/* Cabeçalho */}
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
            <MaterialCommunityIcons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {editing ? t.expense.editTitle : t.expense.newTitle}
          </Text>
          {editing && canWrite ? (
            <Pressable onPress={() => setConfirmDelete(true)} hitSlop={12} style={styles.headerBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.danger} />
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Valor com máscara de R$ */}
          <Animated.View style={amountAnimStyle}>
            <Pressable
              style={styles.amountWrap}
              onPress={() => amountRef.current?.focus()}
            >
              <Text style={[styles.currencySymbol, { color: colors.textMuted }]}>R$</Text>
              <TextInput
                ref={amountRef}
                value={maskCurrencyInput(raw)}
                onChangeText={handleAmountChange}
                keyboardType="number-pad"
                style={[styles.amountInput, { color: amount > 0 ? colors.text : colors.textMuted }]}
                placeholder={t.expense.amountPlaceholder}
                placeholderTextColor={colors.textMuted}
                selectionColor={colors.primary}
              />
            </Pressable>
          </Animated.View>

          {/* Categorias */}
          <Text style={[styles.label, { color: colors.text }]}>{t.expense.category}</Text>
          <View style={styles.chipsWrap}>
            {categoriesWithSubs.map((cat) => {
              const active = cat.id === categoryId;
              return (
                <PressableScale
                  key={cat.id}
                  onPress={() => {
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
                  <AppIcon icon={cat.icon} size={20} color={cat.color} />
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
            {/* Criar nova categoria na hora */}
            <Pressable
              onPress={() => {
                router.push('/categoria');
              }}
              style={[styles.createChip, { borderColor: colors.primary }]}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.primary }]}>{t.expense.create}</Text>
            </Pressable>
          </View>

          {/* Subcategorias da categoria escolhida */}
          {selectedCategory && (
            <>
              <Text style={[styles.label, { color: colors.text }]}>
                {t.expense.subcategory}{' '}
                <Text style={{ color: colors.textMuted }}>{t.expense.optional}</Text>
              </Text>
              <View style={styles.chipsWrap}>
                {selectedCategory.subcategories.map((sub) => {
                  const active = sub.id === subcategoryId;
                  return (
                    <Pressable
                      key={sub.id}
                      onPress={() => {
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
                      <AppIcon
                        icon={sub.icon}
                        size={16}
                        color={selectedCategory.color}
                      />
                      <Text style={[styles.subChipText, { color: colors.text }]}>
                        {sub.name}
                      </Text>
                    </Pressable>
                  );
                })}
                {/* Criar nova subcategoria na hora */}
                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: '/categoria',
                      params: { parentId: selectedCategory.id },
                    });
                  }}
                  style={[styles.subCreateChip, { borderColor: selectedCategory.color }]}
                >
                  <MaterialCommunityIcons name="plus" size={15} color={selectedCategory.color} />
                  <Text style={[styles.subChipText, { color: selectedCategory.color }]}>
                    {t.expense.create}
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Data */}
          <Text style={[styles.label, { color: colors.text }]}>{t.expense.when}</Text>
          <View style={styles.chipsWrap}>
            {quickDates.map((q) => {
              const active = toISODate(q.value) === toISODate(date);
              return (
                <Pressable
                  key={q.label}
                  onPress={() => {
                    setDate(q.value);
                    setDateTouched(true);
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
            <Pressable
              onPress={() => {
                setCalendarOpen(true);
              }}
              style={[styles.dateChip, { backgroundColor: colors.surface }]}
            >
              <MaterialCommunityIcons name="calendar-month" size={16} color={colors.primary} />
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {isQuickDate ? t.expense.otherDate : relativeDayLabel(toISODate(date))}
              </Text>
            </Pressable>
          </View>

          {/* Notas */}
          <Text style={[styles.label, { color: colors.text }]}>{t.expense.notes}</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            onFocus={() => setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)}
            placeholder={t.expense.notePlaceholder}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.noteInput,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
          />

          {/* Notinha + subcompras. Os itens detalham o gasto; o total do mês
              continua sendo só o valor do lançamento. */}
          <ReceiptSection
            receipt={receiptState.receipt}
            items={receiptState.items}
            phase={receiptState.phase}
            error={receiptState.error}
            mismatch={receiptState.mismatch}
            photoUrl={receiptState.photoUrl}
            expenseAmount={amount}
            duplicate={receiptState.duplicate}
            onAttach={receiptState.attach}
            onScanQr={() => router.push('/qrcode')}
            onRetry={receiptState.retry}
            onRemove={receiptState.remove}
            onChangeItems={receiptState.setItems}
            onUseItemsTotal={(value) => setRaw(reaisToRaw(value))}
            readOnly={!canWrite}
            onOpenPhoto={() => {
              if (receiptState.receipt) {
                router.push({
                  pathname: '/notinha',
                  params: { id: receiptState.receipt.id },
                });
              }
            }}
          />
        </ScrollView>

        {/* Botão salvar */}
        <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
          {/* Atalho pra quem está pondo o mês em dia: grava e já reabre em branco. */}
          {!editing && (
            <PressableScale
              onPress={() => handleSave({ keepOpen: true })}
              disabled={!canSave}
              scaleTo={0.97}
              style={[
                styles.againBtn,
                { backgroundColor: colors.surface, opacity: canSave ? 1 : 0.5 },
              ]}
            >
              <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
              <Text style={[styles.againText, { color: colors.text }]}>
                {t.expense.saveAndNew}
              </Text>
            </PressableScale>
          )}

          <PressableScale
            onPress={() => handleSave()}
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
              {editing ? t.expense.saveChanges : t.expense.save}
            </Text>
          </PressableScale>
        </View>

        {/* Dentro do KeyboardAvoidingView: com o teclado aberto o aviso sobe junto. */}
        {flash && (
          <SuccessFlash key={flash.id} message={flash.label} onDone={() => setFlash(null)} />
        )}
      </KeyboardAvoidingView>

      <SuccessOverlay
        visible={showSuccess}
        amountLabel={formatBRL(amount)}
        onDone={() => {
          // Não desmontamos o overlay aqui: ele continua cobrindo a tela
          // enquanto o modal desce, evitando o "flash" do formulário.
          router.back();
        }}
      />

      <CalendarModal
        visible={calendarOpen}
        selected={date}
        onSelect={(picked) => {
          setDate(picked);
          setDateTouched(true);
        }}
        onClose={() => setCalendarOpen(false)}
      />

      <ConfirmDialog
        visible={confirmDelete}
        title={t.expense.deleteTitle}
        message={t.expense.deleteMessage}
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
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
  createChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  subCreateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
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
    gap: 10,
  },
  againBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 14,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  againText: { fontSize: 15, fontWeight: '700' },
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
