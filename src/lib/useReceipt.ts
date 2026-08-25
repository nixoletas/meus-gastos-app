/**
 * Estado da notinha dentro da tela de lançamento.
 *
 * Duas origens: foto da nota (lida por OCR) e QR Code da NFC-e (itens vindos
 * do portal da SEFAZ). As duas nascem com `expense_id` nulo — é rascunho até
 * o usuário confirmar o gasto. Quem amarra notinha, itens e gasto é a RPC
 * `save_expense_with_items`, numa transação só. Se a tela for fechada antes
 * disso, o rascunho é apagado (linha + arquivo no Storage).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { DraftItem, Receipt } from '../types';
import {
  createQrReceipt,
  discardReceipt,
  loadItemsOfExpense,
  loadReceiptOfExpense,
  parseNfce,
  parseReceipt,
  ParseResult,
  pickReceiptPhoto,
  receiptSignedUrl,
  ReceiptSource,
  toDraftItems,
  uploadReceipt,
} from './receipts';

export type ReceiptPhase = 'idle' | 'uploading' | 'reading' | 'ready' | 'failed';

type Options = {
  userId: string | null;
  /** Gasto sendo editado; nulo quando é lançamento novo. */
  expenseId: string | null;
  /** Chamado quando o OCR termina — a tela usa para preencher valor e data. */
  onParsed?: (result: ParseResult) => void;
};

export function useReceipt({ userId, expenseId, onParsed }: Options) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [phase, setPhase] = useState<ReceiptPhase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  /** Id do gasto que já usou esta mesma nota fiscal. */
  const [duplicate, setDuplicate] = useState<string | null>(null);

  /** Notinha criada nesta sessão e ainda não salva — some se a tela fechar. */
  const pendingRef = useRef<Receipt | null>(null);
  const onParsedRef = useRef(onParsed);
  onParsedRef.current = onParsed;

  // Editando um gasto: traz a notinha e os itens que já estão salvos.
  useEffect(() => {
    if (!expenseId) return;
    let alive = true;

    (async () => {
      const [saved, savedItems] = await Promise.all([
        loadReceiptOfExpense(expenseId),
        loadItemsOfExpense(expenseId),
      ]);
      if (!alive) return;

      if (saved) {
        setReceipt(saved);
        setPhase(saved.status === 'failed' ? 'failed' : 'ready');
        setError(saved.error);
        // Notinha vinda de QR Code não tem foto para exibir.
        if (saved.storage_path) {
          const url = await receiptSignedUrl(saved.storage_path);
          if (alive) setPhotoUrl(url);
        }
      }
      if (savedItems.length > 0) setItems(toDraftItems(savedItems));
    })();

    return () => {
      alive = false;
    };
  }, [expenseId]);

  // Rascunho abandonado (usuário anexou a foto e fechou a tela) não pode
  // ficar ocupando o bucket nem virando item solto no banco.
  useEffect(
    () => () => {
      const pending = pendingRef.current;
      if (pending) void discardReceipt(pending);
    },
    []
  );

  const runParse = useCallback(async (target: Receipt) => {
    setPhase('reading');
    setError(null);
    // Cada origem tem seu leitor: QR consulta a SEFAZ, foto vai para o modelo.
    const result =
      target.source === 'qrcode' ? await parseNfce(target.id) : await parseReceipt(target.id);
    setReceipt(result.receipt);
    pendingRef.current = result.receipt;
    setItems(toDraftItems(result.items));
    setMismatch(result.mismatch);
    setDuplicate(result.duplicate ?? null);
    setPhase('ready');
    onParsedRef.current?.(result);
  }, []);

  /**
   * QR Code do cupom: os itens vêm do portal da SEFAZ, exatos e de graça.
   * Falhou (UF fora do layout, portal fora do ar), a mensagem já manda
   * fotografar — o outro caminho continua ali.
   */
  const attachQr = useCallback(
    async (qrUrl: string) => {
      if (!userId) return;
      try {
        setError(null);
        const previous = receipt;
        setPhase('reading');
        setMismatch(false);
        setDuplicate(null);

        const created = await createQrReceipt(userId, qrUrl);
        pendingRef.current = created;
        setReceipt(created);
        setPhotoUrl(null);
        if (previous) void discardReceipt(previous);

        await runParse(created);
      } catch (err) {
        setPhase('failed');
        setError(err instanceof Error ? err.message : 'Não consegui ler esse QR Code.');
      }
    },
    [userId, receipt, runParse]
  );

  const attach = useCallback(
    async (source: ReceiptSource) => {
      if (!userId) return;
      try {
        setError(null);
        const photo = await pickReceiptPhoto(source);
        if (!photo) return;

        // Trocar de foto não pode deixar a anterior órfã no bucket.
        const previous = receipt;
        setPhase('uploading');
        setPhotoUrl(photo.uri); // prévia local, sem esperar URL assinada
        setMismatch(false);
        setDuplicate(null);

        const created = await uploadReceipt(userId, photo.base64, null);
        pendingRef.current = created;
        setReceipt(created);
        if (previous) void discardReceipt(previous);

        await runParse(created);
      } catch (err) {
        setPhase('failed');
        setError(err instanceof Error ? err.message : 'Não consegui ler a notinha.');
      }
    },
    [userId, receipt, runParse]
  );

  const retry = useCallback(async () => {
    if (!receipt) return;
    try {
      await runParse(receipt);
    } catch (err) {
      setPhase('failed');
      setError(err instanceof Error ? err.message : 'Não consegui ler a notinha.');
    }
  }, [receipt, runParse]);

  const remove = useCallback(async () => {
    const target = receipt;
    setReceipt(null);
    setItems([]);
    setPhotoUrl(null);
    setPhase('idle');
    setError(null);
    setMismatch(false);
    setDuplicate(null);
    pendingRef.current = null;
    if (target) await discardReceipt(target);
  }, [receipt]);

  /** Chamado depois de salvar: o rascunho virou gasto de verdade. */
  const markSaved = useCallback(() => {
    pendingRef.current = null;
  }, []);

  /** Volta ao estado inicial em "salvar e lançar outro". */
  const reset = useCallback(() => {
    pendingRef.current = null;
    setReceipt(null);
    setItems([]);
    setPhotoUrl(null);
    setPhase('idle');
    setError(null);
    setMismatch(false);
    setDuplicate(null);
  }, []);

  return {
    receipt,
    items,
    setItems,
    phase,
    error,
    mismatch,
    duplicate,
    photoUrl,
    attach,
    attachQr,
    retry,
    remove,
    markSaved,
    reset,
    busy: phase === 'uploading' || phase === 'reading',
  };
}
