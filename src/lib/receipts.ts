/**
 * Notinhas: tirar/escolher a foto, preparar, enviar e mandar ler.
 *
 * A foto vai para o bucket privado `receipts` em `{user_id}/{arquivo}.jpg`.
 * A leitura (OCR) roda na Edge Function `parse-receipt`, que grava as
 * subcompras — aqui só orquestramos e devolvemos o que a tela precisa.
 */
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { DraftItem, ExpenseItem, Receipt } from '../types';
import { supabase } from './supabase';

/**
 * Cupom é alto e estreito: escalar pelo maior lado deixaria o texto ilegível.
 * Fixamos a largura (o que decide se dá pra ler a linha) e só cortamos a
 * altura quando a nota é absurdamente longa.
 */
const TARGET_WIDTH = 1400;
const MAX_HEIGHT = 2800;
const JPEG_QUALITY = 0.72;

export type ReceiptSource = 'camera' | 'library';

export type ParseResult = {
  receipt: Receipt;
  items: ExpenseItem[];
  itemsTotal: number;
  /** A soma dos itens não fecha com o total impresso na nota. */
  mismatch: boolean;
  /** Id do gasto que já usou esta mesma nota fiscal (chave de acesso repetida). */
  duplicate?: string | null;
};

const B64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Base64 -> bytes na mão. O Supabase Storage no React Native precisa de
 * ArrayBuffer: mandar Blob grava arquivo de 0 byte no Android.
 */
function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array((clean.length * 3) >> 2);
  let byte = 0;
  let bits = 0;
  let out = 0;

  for (let i = 0; i < clean.length; i += 1) {
    const value = B64_ALPHABET.indexOf(clean[i]);
    if (value === -1) continue;
    byte = (byte << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[out] = (byte >> bits) & 0xff;
      out += 1;
    }
  }
  return bytes.subarray(0, out);
}

function randomName(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}.jpg`;
}

/**
 * Abre a câmera ou a galeria e devolve a foto já reduzida.
 * Devolve `null` quando o usuário desiste; joga erro com texto pronto de tela
 * quando falta permissão.
 */
export async function pickReceiptPhoto(
  source: ReceiptSource
): Promise<{ base64: string; uri: string } | null> {
  if (source === 'camera') {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Preciso da câmera para fotografar a notinha. Libere nos ajustes do aparelho.');
    }
  } else {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Preciso do acesso às fotos para anexar a notinha.');
    }
  }

  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1, // a compressão de verdade acontece no resize abaixo
    exif: false,
  };

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);

  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];

  // Foto de celular tem 12MP. Sem reduzir, o upload demora no 4G e a imagem
  // vira ~16 mil tokens de entrada — 5x mais cara e nem mais legível.
  const resize =
    asset.height > 0 && (asset.height * TARGET_WIDTH) / asset.width > MAX_HEIGHT
      ? { height: MAX_HEIGHT }
      : { width: Math.min(TARGET_WIDTH, asset.width || TARGET_WIDTH) };

  const processed = await manipulateAsync(asset.uri, [{ resize }], {
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!processed.base64) {
    throw new Error('Não consegui preparar a foto. Tente outra.');
  }
  return { base64: processed.base64, uri: processed.uri };
}

/**
 * QR lido na tela da câmera, esperando a tela de lançamento buscar.
 *
 * A tela do scanner não conhece o lançamento — ela só lê e volta. Um valor
 * de módulo resolve isso sem inventar contexto novo para um dado que vive
 * por dois segundos.
 */
let pendingScan: string | null = null;

export function setPendingScan(url: string) {
  pendingScan = url;
}

/** Devolve o QR lido (e esquece), ou null se não houve leitura. */
export function takePendingScan(): string | null {
  const value = pendingScan;
  pendingScan = null;
  return value;
}

/** Sobe a foto e cria a linha da notinha (ainda sem itens). */
export async function uploadReceipt(
  userId: string,
  base64: string,
  expenseId: string | null
): Promise<Receipt> {
  const path = `${userId}/${randomName()}`;
  const { error: uploadErr } = await supabase.storage
    .from('receipts')
    .upload(path, base64ToBytes(base64), {
      contentType: 'image/jpeg',
      upsert: false,
    });
  if (uploadErr) throw new Error(`Não consegui enviar a foto: ${uploadErr.message}`);

  const { data, error } = await supabase
    .from('receipts')
    .insert({
      user_id: userId,
      expense_id: expenseId,
      storage_path: path,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) {
    // Não deixa lixo no bucket se o insert falhou.
    await supabase.storage.from('receipts').remove([path]);
    throw new Error(error?.message ?? 'Não consegui registrar a notinha.');
  }
  return data as Receipt;
}

/** Cria a notinha a partir do QR Code, sem foto nenhuma. */
export async function createQrReceipt(userId: string, qrUrl: string): Promise<Receipt> {
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      user_id: userId,
      expense_id: null,
      source: 'qrcode',
      qr_url: qrUrl,
      storage_path: null,
      status: 'pending',
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Não consegui registrar a notinha.');
  return data as Receipt;
}

/** Consulta a NFC-e no portal da SEFAZ a partir do QR já salvo. */
export function parseNfce(receiptId: string): Promise<ParseResult> {
  return invokeParser('parse-nfce', receiptId);
}

/** Chama o OCR. Pode demorar alguns segundos — a tela mostra o esqueleto. */
export function parseReceipt(receiptId: string): Promise<ParseResult> {
  return invokeParser('parse-receipt', receiptId);
}

async function invokeParser(fn: 'parse-receipt' | 'parse-nfce', receiptId: string): Promise<ParseResult> {
  const { data, error } = await supabase.functions.invoke<ParseResult>(fn, {
    body: { receipt_id: receiptId },
  });

  if (error) {
    // O erro da função vem no corpo da resposta; a mensagem de lá é escrita
    // para o usuário ler ("tire outra foto"), então vale mais que a genérica.
    let message = error.message;
    try {
      const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
      if (ctx?.json) {
        const parsed = await ctx.json();
        message = parsed?.error ?? message;
      }
    } catch {
      /* fica com a mensagem genérica */
    }
    throw new Error(message ?? 'Não consegui ler a notinha.');
  }
  if (!data) throw new Error('Não consegui ler a notinha.');
  return data;
}

/** Apaga a notinha, os itens de rascunho dela e o arquivo no Storage. */
export async function discardReceipt(receipt: Receipt): Promise<void> {
  await supabase.rpc('discard_receipt', { p_receipt_id: receipt.id });
  // Notinha de QR Code não tem arquivo para apagar.
  if (receipt.storage_path) {
    await supabase.storage.from('receipts').remove([receipt.storage_path]);
  }
}

/** URL temporária para exibir a foto (o bucket é privado). */
export async function receiptSignedUrl(path: string, seconds = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('receipts')
    .createSignedUrl(path, seconds);
  if (error) return null;
  return data?.signedUrl ?? null;
}

export async function loadReceiptOfExpense(expenseId: string): Promise<Receipt | null> {
  const { data } = await supabase
    .from('receipts')
    .select('*')
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Receipt) ?? null;
}

export async function loadItemsOfExpense(expenseId: string): Promise<ExpenseItem[]> {
  const { data } = await supabase
    .from('expense_items')
    .select('*')
    .eq('expense_id', expenseId)
    .order('position');
  return (data ?? []) as ExpenseItem[];
}

export async function loadItemsOfReceipt(receiptId: string): Promise<ExpenseItem[]> {
  const { data } = await supabase
    .from('expense_items')
    .select('*')
    .eq('receipt_id', receiptId)
    .order('position');
  return (data ?? []) as ExpenseItem[];
}

let draftSeq = 0;

export function newDraftItem(partial: Partial<DraftItem> = {}): DraftItem {
  draftSeq += 1;
  return {
    key: `draft-${draftSeq}`,
    description: '',
    raw_text: null,
    quantity: 1,
    unit: null,
    unit_price: null,
    total: 0,
    category_id: null,
    ...partial,
  };
}

/** Converte as linhas do banco no formato que a lista editável usa. */
export function toDraftItems(rows: ExpenseItem[]): DraftItem[] {
  return rows.map((row) => ({
    key: row.id,
    description: row.description,
    raw_text: row.raw_text,
    quantity: Number(row.quantity) || 1,
    unit: row.unit,
    unit_price: row.unit_price === null ? null : Number(row.unit_price),
    total: Number(row.total) || 0,
    category_id: row.category_id,
  }));
}

export const sumItems = (items: DraftItem[]): number =>
  Math.round(items.reduce((total, item) => total + (Number(item.total) || 0), 0) * 100) / 100;
