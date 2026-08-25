// Formato comum das notinhas lidas, venha a leitura da foto (parse-receipt)
// ou do QR Code da NFC-e (parse-nfce). As duas gravam pela mesma RPC, entao
// as duas passam por esta normalizacao antes de encostar no banco.

/** Uma linha da nota, antes de virar registro em `expense_items`. */
export type ParsedItem = {
  description: string;
  raw_text: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total: number;
};

/** Notinha inteira, no formato que a RPC `save_receipt_parse` espera. */
export type ParsedReceipt = {
  merchant: string | null;
  merchant_doc: string | null;
  issued_at: string | null;
  payment_method: string | null;
  subtotal: number | null;
  discount: number | null;
  total: number | null;
  access_key: string | null;
  items: ParsedItem[];
};

/** Limite defensivo: nota gigante não pode virar 5 mil linhas no banco. */
const MAX_ITEMS = 300;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    // Rede de segurança: "12,90", "R$ 12.90" e "1.234,56" ainda são aproveitados.
    const cleaned = value.replace(/[^\d,.-]/g, '').replace(',', '.');
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function toText(value: unknown, max = 200): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Normaliza o que veio do modelo: números arredondados, textos aparados,
 * linhas sem valor descartadas. O banco confia nesta saída.
 */
export function normalizeParsed(input: unknown): ParsedReceipt {
  const raw = (input ?? {}) as Record<string, unknown>;
  const rawItems = Array.isArray(raw.items) ? raw.items : [];

  const items: ParsedItem[] = [];
  for (const entry of rawItems.slice(0, MAX_ITEMS)) {
    const it = (entry ?? {}) as Record<string, unknown>;
    const total = toNumber(it.total);
    const description = toText(it.description);
    // Linha sem descrição ou sem valor não vira subcompra.
    if (description === null || total === null || total < 0) continue;

    const quantity = toNumber(it.quantity);
    const unitPrice = toNumber(it.unit_price);

    items.push({
      description,
      raw_text: toText(it.raw_text),
      quantity: quantity !== null && quantity > 0 ? Math.round(quantity * 1000) / 1000 : 1,
      unit: toText(it.unit, 12)?.toLowerCase() ?? null,
      unit_price: unitPrice !== null && unitPrice >= 0 ? Math.round(unitPrice * 10000) / 10000 : null,
      total: round2(total),
    });
  }

  const positive = (n: number | null) => (n !== null && n >= 0 ? round2(n) : null);
  const doc = toText(raw.merchant_doc, 30)?.replace(/\D/g, '') ?? null;
  const key = toText(raw.access_key, 60)?.replace(/\D/g, '') ?? null;

  return {
    merchant: toText(raw.merchant, 120),
    merchant_doc: doc && doc.length === 14 ? doc : null,
    issued_at: toText(raw.issued_at, 40),
    payment_method: toText(raw.payment_method, 20),
    subtotal: positive(toNumber(raw.subtotal)),
    discount: positive(toNumber(raw.discount)),
    total: positive(toNumber(raw.total)),
    access_key: key && key.length === 44 ? key : null,
    items,
  };
}

/**
 * Confere se os itens fecham com o total impresso.
 * Não trava o salvamento: nota amassada é o caso comum, não a exceção — a tela
 * mostra o aviso e deixa o usuário corrigir.
 */
export function checkSum(parsed: ParsedReceipt): { itemsTotal: number; mismatch: boolean } {
  const itemsTotal = round2(parsed.items.reduce((sum, it) => sum + it.total, 0));
  const expected = parsed.total ?? parsed.subtotal;
  if (expected === null || parsed.items.length === 0) {
    return { itemsTotal, mismatch: false };
  }
  const target = round2(expected - (parsed.discount ?? 0));
  const mismatch = Math.abs(itemsTotal - target) > 0.05 && Math.abs(itemsTotal - expected) > 0.05;
  return { itemsTotal, mismatch };
}
