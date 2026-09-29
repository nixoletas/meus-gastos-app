import { PaymentKind } from '../types';
import { BANK_LOGOS } from './bankLogos';
import { IconName } from './icons';
import { normalizeText } from '../utils/text';

/**
 * Catálogo de instituições que aparecem no cadastro de meio de pagamento.
 *
 * Os bancos usam o logo embutido (`bankLogos.ts`); os genéricos — dinheiro,
 * vale, cartão sem banco — usam um ícone do MaterialCommunityIcons.
 */
export type PaymentProvider = {
  id: string;
  name: string;
  color: string;
  /** Presente nos genéricos, que não têm logo de marca. */
  icon?: IconName;
  /** Forma sugerida ao escolher a instituição (ex.: dinheiro → dinheiro). */
  defaultKind?: PaymentKind;
  /** Palavras extras para a busca. */
  keywords?: string[];
};

/** Ordem pensada por uso no Brasil: os grandões primeiro, depois as fintechs. */
const BANK_ORDER = [
  'nubank',
  'itau',
  'bb',
  'bradesco',
  'caixa',
  'santander',
  'inter',
  'c6',
  'picpay',
  'mercadopago',
  'pagbank',
  'btg',
  'xp',
  'neon',
  'sicoob',
  'sicredi',
  'original',
  'pan',
  'safra',
  'banrisul',
  'brb',
  'bnb',
  'stone',
  'recargapay',
  'paypal',
  'pix',
];

const KEYWORDS: Record<string, string[]> = {
  nubank: ['nu', 'roxinho'],
  bb: ['banco do brasil', 'ourocard'],
  itau: ['itau', 'personnalite', 'iti'],
  caixa: ['cef', 'caixa economica'],
  mercadopago: ['mercado livre'],
  pagbank: ['pagseguro'],
  btg: ['btg pactual'],
  bnb: ['nordeste'],
};

export const GENERIC_PROVIDERS: PaymentProvider[] = [
  { id: 'dinheiro', name: 'Dinheiro', color: '#16A34A', icon: 'cash-multiple', defaultKind: 'dinheiro', keywords: ['cash', 'especie'] },
  { id: 'vale', name: 'Vale', color: '#F97316', icon: 'food', defaultKind: 'vale', keywords: ['vr', 'va', 'alelo', 'ticket', 'sodexo', 'pluxee', 'flash', 'caju', 'refeicao', 'alimentacao'] },
  { id: 'cartao', name: 'Cartão', color: '#6366F1', icon: 'credit-card-outline', defaultKind: 'credito', keywords: ['card'] },
  { id: 'carteira', name: 'Outro', color: '#64748B', icon: 'wallet-outline', keywords: ['other', 'wallet'] },
];

export const BANK_PROVIDERS: PaymentProvider[] = BANK_ORDER.filter((id) => BANK_LOGOS[id]).map(
  (id) => ({
    id,
    name: BANK_LOGOS[id].name,
    color: BANK_LOGOS[id].color,
    defaultKind: id === 'pix' ? 'pix' : undefined,
    keywords: KEYWORDS[id],
  })
);

export const PAYMENT_PROVIDERS: PaymentProvider[] = [...BANK_PROVIDERS, ...GENERIC_PROVIDERS];

const BY_ID = new Map(PAYMENT_PROVIDERS.map((p) => [p.id, p]));

export function getProvider(id: string | null | undefined): PaymentProvider | undefined {
  return id ? BY_ID.get(id) : undefined;
}

/** Ícone de cada forma de pagamento, usado em chips e quando não há logo. */
export const KIND_ICONS: Record<PaymentKind, IconName> = {
  credito: 'credit-card',
  debito: 'credit-card-outline',
  pix: 'lightning-bolt',
  dinheiro: 'cash',
  vale: 'food',
  boleto: 'barcode',
  outro: 'dots-horizontal',
};

export const PAYMENT_KINDS: PaymentKind[] = [
  'credito',
  'debito',
  'pix',
  'dinheiro',
  'vale',
  'boleto',
  'outro',
];


export function matchesProvider(p: PaymentProvider, query: string): boolean {
  const q = normalizeText(query);
  if (!q) return true;
  return [p.name, p.id, ...(p.keywords ?? [])].some((w) => normalizeText(w).includes(q));
}
