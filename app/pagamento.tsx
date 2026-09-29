import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hexWithAlpha } from '../src/components/CategoryIcon';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { PaymentLogo } from '../src/components/PaymentLogo';
import { PressableScale } from '../src/components/PressableScale';
import { useData } from '../src/context/DataContext';
import { useLedger } from '../src/context/LedgerContext';
import {
  BANK_PROVIDERS,
  GENERIC_PROVIDERS,
  getProvider,
  KIND_ICONS,
  matchesProvider,
  PAYMENT_KINDS,
  PaymentProvider,
} from '../src/data/paymentProviders';
import { useT } from '../src/i18n';
import { Text, TextInput } from '../src/theme/typography';
import { useTheme } from '../src/theme/ThemeContext';
import { PaymentKind } from '../src/types';
import { paymentLabel } from '../src/utils/payment';

/**
 * Cadastro de meio de pagamento: escolhe a instituição (com logo) e a forma.
 * O nome nasce do banco escolhido e pode virar apelido.
 */
export default function PagamentoScreen() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { canWrite } = useLedger();
  const { paymentMethods, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } =
    useData();

  const editing = paymentMethods.find((p) => p.id === params.id);

  const [provider, setProvider] = useState<string | null>(null);
  const [kind, setKind] = useState<PaymentKind>('credito');
  const [name, setName] = useState('');
  /** Nome digitado à mão não é trocado ao escolher outro banco. */
  const [nameTouched, setNameTouched] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!editing) return;
    setProvider(editing.provider);
    setKind(editing.kind);
    setName(editing.name);
    setNameTouched(true);
  }, [editing?.id]);

  const providerName = (p: PaymentProvider) => t.payment.providers[p.id] ?? p.name;

  function pickProvider(p: PaymentProvider) {
    setProvider(p.id);
    if (p.defaultKind) setKind(p.defaultKind);
    if (!nameTouched) setName(providerName(p));
  }

  const banks = useMemo(
    () => BANK_PROVIDERS.filter((p) => matchesProvider(p, search)),
    [search]
  );
  const generics = useMemo(
    () =>
      GENERIC_PROVIDERS.filter(
        (p) => matchesProvider(p, search) || matchesProvider({ ...p, name: providerName(p) }, search)
      ),
    [search, t]
  );

  const chosen = getProvider(provider);
  const color = chosen?.color ?? colors.primary;
  const canSave = name.trim().length > 0 && !saving && canWrite;

  // Pré-visualização com o mesmo rótulo que aparece no lançamento.
  const previewLabel = paymentLabel(
    {
      id: '',
      user_id: '',
      name: name.trim() || t.payment.namePlaceholder,
      provider,
      kind,
      color,
      position: 0,
      created_at: '',
    },
    t
  );

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    const payload = { name: name.trim(), provider, kind, color };
    if (editing) await updatePaymentMethod(editing.id, payload);
    else await addPaymentMethod(payload);
    router.back();
  }

  async function doDelete() {
    if (!editing) return;
    setDeleting(true);
    await deletePaymentMethod(editing.id);
    router.back();
  }

  const renderProvider = (p: PaymentProvider) => {
    const active = provider === p.id;
    return (
      <Pressable
        key={p.id}
        onPress={() => pickProvider(p)}
        style={[
          styles.providerCell,
          {
            backgroundColor: active ? hexWithAlpha(p.color, 0.14) : colors.card,
            borderColor: active ? p.color : colors.border,
          },
        ]}
      >
        <PaymentLogo provider={p.id} size={40} />
        <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>
          {providerName(p)}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <View style={styles.headerBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.headerBtn}>
            <MaterialCommunityIcons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {editing ? t.payment.editTitle : t.payment.newTitle}
          </Text>
          {editing && canWrite ? (
            <Pressable onPress={() => setConfirmOpen(true)} hitSlop={12} style={styles.headerBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.danger} />
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Pré-visualização */}
          <View style={[styles.preview, { backgroundColor: colors.card }]}>
            <PaymentLogo provider={provider} kind={kind} color={color} size={52} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.previewName, { color: colors.text }]} numberOfLines={1}>
                {previewLabel}
              </Text>
              <View style={styles.previewKind}>
                <MaterialCommunityIcons
                  name={KIND_ICONS[kind] as any}
                  size={14}
                  color={colors.textMuted}
                />
                <Text style={{ color: colors.textMuted, fontSize: 13 }}>
                  {t.payment.kinds[kind]}
                </Text>
              </View>
            </View>
          </View>

          {/* Forma */}
          <Text style={[styles.label, { color: colors.text }]}>{t.payment.kind}</Text>
          <View style={styles.chipsWrap}>
            {PAYMENT_KINDS.map((k) => {
              const active = k === kind;
              return (
                <Pressable
                  key={k}
                  onPress={() => setKind(k)}
                  style={[
                    styles.kindChip,
                    {
                      backgroundColor: active ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={KIND_ICONS[k] as any}
                    size={16}
                    color={active ? colors.onPrimary : colors.textMuted}
                  />
                  <Text
                    style={{
                      color: active ? colors.onPrimary : colors.text,
                      fontWeight: '600',
                      fontSize: 14,
                    }}
                  >
                    {t.payment.kinds[k]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Instituição */}
          <Text style={[styles.label, { color: colors.text }]}>{t.payment.institution}</Text>
          <View style={[styles.search, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t.payment.searchPlaceholder}
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
            />
          </View>
          {banks.length > 0 && <View style={styles.grid}>{banks.map(renderProvider)}</View>}
          {generics.length > 0 && (
            <>
              <Text style={[styles.subLabel, { color: colors.textMuted }]}>{t.payment.others}</Text>
              <View style={styles.grid}>{generics.map(renderProvider)}</View>
            </>
          )}

          {/* Nome */}
          <Text style={[styles.label, { color: colors.text }]}>{t.payment.name}</Text>
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setNameTouched(text.trim().length > 0);
            }}
            maxLength={60}
            placeholder={t.payment.namePlaceholder}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
          />
          <Text style={[styles.hint, { color: colors.textMuted }]}>{t.payment.nameHint}</Text>
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <PressableScale
            onPress={handleSave}
            disabled={!canSave}
            scaleTo={0.97}
            style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.surface }]}
          >
            <Text style={[styles.saveText, { color: canSave ? colors.onPrimary : colors.textMuted }]}>
              {t.common.save}
            </Text>
          </PressableScale>
        </View>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={confirmOpen}
        title={t.payment.deleteTitle(editing ? paymentLabel(editing, t) : name)}
        message={t.payment.deleteMessage}
        preview={
          <PaymentLogo
            provider={editing?.provider}
            kind={editing?.kind}
            color={editing?.color}
            size={64}
          />
        }
        busy={deleting}
        onConfirm={doDelete}
        onCancel={() => setConfirmOpen(false)}
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
    gap: 8,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 18,
  },
  previewName: { fontSize: 18, fontWeight: '700' },
  previewKind: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  label: { fontSize: 16, fontWeight: '700', marginTop: 14, marginBottom: 4 },
  subLabel: { fontSize: 13, fontWeight: '700', marginTop: 8 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  providerCell: {
    width: '23%',
    flexGrow: 1,
    maxWidth: '24%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  providerName: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 16,
  },
  hint: { fontSize: 12, marginTop: 2 },
  footer: { padding: 16, borderTopWidth: 1 },
  saveBtn: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  saveText: { fontSize: 18, fontWeight: '700' },
});
