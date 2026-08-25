// Formato de saída e prompt do leitor de notinhas.
//
// A extração usa "structured outputs": o modelo é obrigado a devolver um JSON
// que casa com o schema abaixo, então não precisamos tratar texto solto nem
// pedir "responda só JSON" e torcer.

/** Como o item volta do modelo, antes de virar linha em `expense_items`. */
export type ParsedItem = {
  description: string;
  raw_text: string | null;
  quantity: number | null;
  unit: string | null;
  unit_price: number | null;
  total: number;
};

/** Notinha inteira, como o modelo devolve. */
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

export const RECEIPT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'merchant',
    'merchant_doc',
    'issued_at',
    'payment_method',
    'subtotal',
    'discount',
    'total',
    'access_key',
    'items',
  ],
  properties: {
    merchant: {
      type: ['string', 'null'],
      description: 'Nome fantasia do estabelecimento, como aparece no topo da nota.',
    },
    merchant_doc: {
      type: ['string', 'null'],
      description: 'CNPJ do estabelecimento, apenas dígitos.',
    },
    issued_at: {
      type: ['string', 'null'],
      description:
        'Data e hora de emissão em ISO 8601 (ex.: 2026-08-24T19:32:00). Sem fuso, é horário de Brasília.',
    },
    payment_method: {
      type: ['string', 'null'],
      enum: ['credito', 'debito', 'pix', 'dinheiro', 'vale', 'outro', null],
      description: 'Forma de pagamento impressa na nota.',
    },
    subtotal: { type: ['number', 'null'], description: 'Soma dos itens antes de desconto.' },
    discount: { type: ['number', 'null'], description: 'Desconto total, positivo.' },
    total: { type: ['number', 'null'], description: 'Valor total pago, o que está em "TOTAL".' },
    access_key: {
      type: ['string', 'null'],
      description: 'Chave de acesso da NFC-e/NF-e, 44 dígitos, se estiver impressa.',
    },
    items: {
      type: 'array',
      description: 'Uma entrada por linha de produto da nota, na ordem impressa.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['description', 'raw_text', 'quantity', 'unit', 'unit_price', 'total'],
        properties: {
          description: {
            type: 'string',
            description:
              'Nome legível do produto, com abreviações expandidas. Ex.: "LEITE INT ITBA 1L" vira "Leite integral Itambé 1L".',
          },
          raw_text: {
            type: ['string', 'null'],
            description: 'A descrição exatamente como está impressa, sem correções.',
          },
          quantity: { type: ['number', 'null'], description: 'Quantidade. 1 quando não houver.' },
          unit: {
            type: ['string', 'null'],
            description: 'Unidade: un, kg, g, l, ml, cx, pct.',
          },
          unit_price: { type: ['number', 'null'], description: 'Preço unitário.' },
          total: { type: 'number', description: 'Valor total da linha, já com quantidade.' },
        },
      },
    },
  },
};

export const SYSTEM_PROMPT = [
  'Você lê cupons fiscais e recibos brasileiros (NFC-e, NF-e, cupom não fiscal, recibo de feira).',
  '',
  'Regras:',
  '- Extraia EXATAMENTE o que está impresso. Nunca invente um item que não aparece na imagem.',
  '- Valores em reais, com ponto decimal (12.90, não 12,90).',
  '- Em `description`, expanda as abreviações do mercado para um nome que uma pessoa entenda,',
  '  e guarde o texto original, sem correção, em `raw_text`.',
  '- Ignore linhas que não são produto: subtotal, total, troco, desconto, tributos, CPF na nota,',
  '  endereço, número do cupom, mensagens de propaganda.',
  '- Desconto de item já embutido na linha fica no `total` da linha. Desconto geral vai em `discount`.',
  '- Item pesado (kg) costuma ter quantidade fracionada: use `quantity` 0.784 e `unit` "kg".',
  '- Se um campo não estiver visível ou legível na imagem, devolva null. Não chute.',
  '- Se a imagem não for uma nota/recibo, devolva `items` vazio e todos os campos null.',
].join('\n');

export const USER_PROMPT =
  'Extraia todos os itens e os dados desta nota. Se a foto estiver cortada, extraia só o que dá para ler.';

/** Limite defensivo: nota gigante não pode virar 5 mil linhas no banco. */
const MAX_ITEMS = 300;

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    // Rede de segurança: se vier "12,90" ou "R$ 12.90", ainda aproveitamos.
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
