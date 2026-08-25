import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { newDraftItem, ReceiptSource, sumItems } from '../lib/receipts';
import { ReceiptPhase } from '../lib/useReceipt';
import { useTheme } from '../theme/ThemeContext';
import { Text } from '../theme/typography';
import { DraftItem, Receipt } from '../types';
import { formatBRL } from '../utils/currency';
import { hexWithAlpha } from './CategoryIcon';
import { ItemEditorModal } from './ItemEditorModal';
import { PressableScale } from './PressableScale';

type Props = {
  receipt: Receipt | null;
  items: DraftItem[];
  phase: ReceiptPhase;
  error: string | null;
  /** A soma dos itens não bate com o total impresso na nota. */
  mismatch: boolean;
  /** Id do gasto que já usou esta mesma nota fiscal. */
  duplicate: string | null;
  photoUrl: string | null;
  /** Valor digitado no lançamento, para comparar com a soma dos itens. */
  expenseAmount: number;
  onAttach: (source: ReceiptSource) => void;
  onScanQr: () => void;
  onRetry: () => void;
  onRemove: () => void;
  onChangeItems: (items: DraftItem[]) => void;
  onUseItemsTotal: (total: number) => void;
  onOpenPhoto: () => void;
};

const PAYMENT_LABEL: Record<string, string> = {
  credito: 'Crédito',
  debito: 'Débito',
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  vale: 'Vale',
  outro: 'Outro',
};

/** Barra cinza que respira enquanto o OCR roda. */
function SkeletonLine({ width }: { width: number | `${number}%` }) {
  const { colors } = useTheme();
  const pulse = useSharedValue(0.35);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.8, { duration: 700, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <Animated.View
      style={[styles.skeleton, { width, backgroundColor: colors.border }, style]}
    />
  );
}

/** Data/hora da nota em "24/08 às 19:32". */
function issuedLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)} às ${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

/**
 * Notinha + subcompras dentro da tela de lançamento.
 *
 * As subcompras detalham o gasto; elas não somam no total do mês — quem manda
 * no total continua sendo o valor do lançamento.
 */
export function ReceiptSection({
  receipt,
  items,
  phase,
  error,
  mismatch,
  duplicate,
  photoUrl,
  expenseAmount,
  onAttach,
  onScanQr,
  onRetry,
  onRemove,
  onChangeItems,
  onUseItemsTotal,
  onOpenPhoto,
}: Props) {
  const { colors } = useTheme();
  const [editing, setEditing] = useState<{ item: DraftItem; isNew: boolean } | null>(null);

  const total = sumItems(items);
  const busy = phase === 'uploading' || phase === 'reading';
  const meta = [
    receipt?.merchant,
    issuedLabel(receipt?.issued_at ?? null),
    receipt?.payment_method ? PAYMENT_LABEL[receipt.payment_method] ?? null : null,
  ].filter(Boolean) as string[];

  // Diferença de centavos vem de arredondamento da nota, não vale alarde.
  const differsFromExpense = items.length > 0 && Math.abs(total - expenseAmount) > 0.05;

  function saveItem(next: DraftItem) {
    const exists = items.some((item) => item.key === next.key);
    onChangeItems(exists ? items.map((item) => (item.key === next.key ? next : item)) : [...items, next]);
    setEditing(null);
  }

  function removeItem(key: string) {
    onChangeItems(items.filter((item) => item.key !== key));
    setEditing(null);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.text }]}>Notinha e itens</Text>
        {items.length > 0 && (
          <Text style={[styles.labelCount, { color: colors.textMuted }]}>
            {items.length} {items.length === 1 ? 'item' : 'itens'} · {formatBRL(total)}
          </Text>
        )}
      </View>

      {/* Nada anexado ainda. O QR vem primeiro: os itens saem exatos do portal
          da SEFAZ, sem foto e sem custo. A foto cobre o resto — feira, padaria,
          recibo, cupom velho sem QR. */}
      {!receipt && !busy && (
        <>
          <PressableScale
            onPress={onScanQr}
            style={[styles.qrBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="qrcode-scan" size={22} color={colors.onPrimary} />
            <Text style={[styles.attachText, { color: colors.onPrimary }]}>
              Ler QR do cupom
            </Text>
          </PressableScale>
          <View style={styles.attachRow}>
            <PressableScale
              onPress={() => onAttach('camera')}
              style={[styles.attachBtn, { backgroundColor: colors.primarySoft }]}
            >
              <MaterialCommunityIcons name="camera-outline" size={20} color={colors.primary} />
              <Text style={[styles.attachText, { color: colors.primary }]}>Fotografar</Text>
            </PressableScale>
            <PressableScale
              onPress={() => onAttach('library')}
              style={[styles.attachBtn, { backgroundColor: colors.surface }]}
            >
              <MaterialCommunityIcons name="image-outline" size={20} color={colors.text} />
              <Text style={[styles.attachText, { color: colors.text }]}>Da galeria</Text>
            </PressableScale>
          </View>
        </>
      )}

      {/* Enviando / lendo. */}
      {busy && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.busyText, { color: colors.text }]}>
              {phase === 'uploading'
                ? 'Enviando a foto…'
                : receipt?.source === 'qrcode'
                  ? 'Consultando a nota na SEFAZ…'
                  : 'Lendo sua notinha…'}
            </Text>
          </View>
          <View style={styles.skeletonGroup}>
            <SkeletonLine width="82%" />
            <SkeletonLine width="64%" />
            <SkeletonLine width="73%" />
          </View>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Pode continuar preenchendo, eu aviso quando terminar.
          </Text>
        </View>
      )}

      {/* Falhou: foto ruim é o caso comum, então o caminho de volta é curto. */}
      {phase === 'failed' && !busy && (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.dangerSoft, borderColor: hexWithAlpha(colors.danger, 0.35) },
          ]}
        >
          <View style={styles.busyRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={[styles.busyText, { color: colors.text }]}>
              {error ?? 'Não consegui ler essa foto.'}
            </Text>
          </View>
          <View style={styles.failActions}>
            {!!receipt && (
              <Pressable onPress={onRetry} style={[styles.smallBtn, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="refresh" size={16} color={colors.text} />
                <Text style={[styles.smallBtnText, { color: colors.text }]}>Tentar de novo</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => onAttach('camera')}
              style={[styles.smallBtn, { backgroundColor: colors.card }]}
            >
              <MaterialCommunityIcons name="camera-outline" size={16} color={colors.text} />
              <Text style={[styles.smallBtnText, { color: colors.text }]}>
                {receipt?.source === 'qrcode' ? 'Fotografar a nota' : 'Outra foto'}
              </Text>
            </Pressable>
            {!!receipt && (
              <Pressable onPress={onRemove} style={[styles.smallBtn, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="close" size={16} color={colors.danger} />
                <Text style={[styles.smallBtnText, { color: colors.danger }]}>Remover</Text>
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Foto anexada e lida. */}
      {!!receipt && !busy && phase !== 'failed' && (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.receiptRow}>
            {photoUrl ? (
              <Pressable onPress={onOpenPhoto} style={styles.thumbWrap}>
                <Image source={{ uri: photoUrl }} style={styles.thumb} resizeMode="cover" />
              </Pressable>
            ) : (
              <View style={[styles.thumb, styles.thumbIcon, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons
                  name={receipt.source === 'qrcode' ? 'qrcode' : 'receipt-text-outline'}
                  size={22}
                  color={colors.textMuted}
                />
              </View>
            )}
            <View style={styles.receiptInfo}>
              <Text style={[styles.merchant, { color: colors.text }]} numberOfLines={1}>
                {receipt.merchant ?? (receipt.source === 'qrcode' ? 'Nota fiscal' : 'Notinha anexada')}
              </Text>
              {meta.length > 1 && (
                <Text style={[styles.hint, { color: colors.textMuted }]} numberOfLines={1}>
                  {meta.slice(1).join(' · ')}
                </Text>
              )}
              {receipt.total !== null && (
                <Text style={[styles.hint, { color: colors.textMuted }]}>
                  Total na nota: {formatBRL(Number(receipt.total))}
                </Text>
              )}
            </View>
            <Pressable onPress={onRemove} hitSlop={10} style={styles.removeBtn}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
            </Pressable>
          </View>

          {!!duplicate && (
            <View style={[styles.warning, { backgroundColor: hexWithAlpha(colors.warning, 0.14) }]}>
              <MaterialCommunityIcons name="content-duplicate" size={16} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.text }]}>
                Essa nota fiscal já foi lançada antes. Se não for engano, pode continuar.
              </Text>
            </View>
          )}

          {mismatch && (
            <View style={[styles.warning, { backgroundColor: hexWithAlpha(colors.warning, 0.14) }]}>
              <MaterialCommunityIcons name="alert-outline" size={16} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.text }]}>
                Os itens somam {formatBRL(total)}, mas a nota diz{' '}
                {formatBRL(Number(receipt.total ?? 0))}. Confira as linhas.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Lista editável das subcompras. */}
      {items.length > 0 && (
        <View style={[styles.itemsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {items.map((item, index) => (
            <Pressable
              key={item.key}
              onPress={() => setEditing({ item, isNew: false })}
              style={[
                styles.itemRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
              ]}
            >
              <View style={styles.itemMain}>
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                  {item.description}
                </Text>
                {(item.quantity !== 1 || item.unit) && (
                  <Text style={[styles.itemMeta, { color: colors.textMuted }]} numberOfLines={1}>
                    {String(item.quantity).replace('.', ',')} {item.unit ?? 'un'}
                    {item.unit_price ? ` × ${formatBRL(item.unit_price)}` : ''}
                  </Text>
                )}
              </View>
              <Text style={[styles.itemTotal, { color: colors.text }]}>
                {formatBRL(item.total)}
              </Text>
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.footerRow}>
        <Pressable
          onPress={() => setEditing({ item: newDraftItem(), isNew: true })}
          style={[styles.addItemBtn, { borderColor: colors.border }]}
        >
          <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
          <Text style={[styles.smallBtnText, { color: colors.primary }]}>Adicionar item</Text>
        </Pressable>

        {/* O OCR quase sempre acerta o total; quando o usuário digitou outro
            valor, trocar tem que ser um toque. */}
        {differsFromExpense && (
          <Pressable
            onPress={() => onUseItemsTotal(total)}
            style={[styles.addItemBtn, { borderColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="equal" size={16} color={colors.primary} />
            <Text style={[styles.smallBtnText, { color: colors.primary }]}>
              Usar {formatBRL(total)}
            </Text>
          </Pressable>
        )}
      </View>

      {!receipt && items.length === 0 && !busy && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          O QR do cupom traz os itens direto da SEFAZ, sem enviar imagem. Na foto,
          quem lê é o Google — e ela funciona em qualquer recibo.
        </Text>
      )}

      <ItemEditorModal
        visible={editing !== null}
        item={editing?.item ?? null}
        onSave={saveItem}
        onDelete={
          editing && !editing.isNew ? () => removeItem(editing.item.key) : undefined
        }
        onCancel={() => setEditing(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  label: { fontSize: 16, fontWeight: '700' },
  labelCount: { fontSize: 13, fontWeight: '600' },
  attachRow: { flexDirection: 'row', gap: 8 },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 46,
    borderRadius: 14,
  },
  attachText: { fontSize: 14, fontWeight: '700' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  busyText: { flex: 1, fontSize: 14, fontWeight: '600' },
  skeletonGroup: { gap: 8 },
  skeleton: { height: 12, borderRadius: 6 },
  hint: { fontSize: 12.5, lineHeight: 18 },
  failActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  smallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 10,
  },
  smallBtnText: { fontSize: 13, fontWeight: '700' },
  receiptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbWrap: { borderRadius: 10, overflow: 'hidden' },
  thumb: { width: 48, height: 62, borderRadius: 10 },
  thumbIcon: { alignItems: 'center', justifyContent: 'center' },
  receiptInfo: { flex: 1, gap: 2 },
  merchant: { fontSize: 15, fontWeight: '700' },
  removeBtn: { padding: 4 },
  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 12 },
  warningText: { flex: 1, fontSize: 12.5, lineHeight: 18 },
  itemsCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  itemMain: { flex: 1, gap: 2 },
  itemName: { fontSize: 14.5, fontWeight: '600' },
  itemMeta: { fontSize: 12 },
  itemTotal: { fontSize: 14.5, fontWeight: '700' },
  footerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
});
