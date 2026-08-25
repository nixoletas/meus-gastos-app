import { AppIconName } from './data/icons';

export type Category = {
  id: string;
  user_id: string;
  name: string;
  icon: AppIconName;
  color: string;
  parent_id: string | null;
  created_at: string;
};

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  note: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  occurred_at: string; // YYYY-MM-DD
  created_at: string;
  /** Quantas subcompras o gasto tem. Mantido por trigger no banco. */
  items_count: number;
  /** Se existe foto de notinha anexada. Mantido por trigger no banco. */
  has_receipt: boolean;
};

export type ReceiptStatus = 'pending' | 'parsing' | 'done' | 'failed';

/** Foto da nota fiscal + o que o OCR entendeu dela. */
export type Receipt = {
  id: string;
  user_id: string;
  /** Nulo enquanto o lançamento ainda não foi salvo. */
  expense_id: string | null;
  /** De onde vieram os itens: foto lida por OCR ou QR Code da NFC-e. */
  source: 'photo' | 'qrcode';
  /** Nulo quando a notinha veio só do QR Code, sem foto. */
  storage_path: string | null;
  /** URL lida do QR Code do cupom (aponta para o portal da SEFAZ da UF). */
  qr_url: string | null;
  status: ReceiptStatus;
  error: string | null;
  merchant: string | null;
  merchant_doc: string | null;
  issued_at: string | null;
  payment_method: string | null;
  subtotal: number | null;
  discount: number | null;
  total: number | null;
  access_key: string | null;
  created_at: string;
};

/**
 * Subcompra: uma linha da notinha.
 *
 * Não é um gasto. O total do mês continua vindo só de `expenses.amount` —
 * o item apenas detalha o que tem dentro dele.
 */
export type ExpenseItem = {
  id: string;
  user_id: string;
  expense_id: string | null;
  receipt_id: string | null;
  description: string;
  raw_text: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
  total: number;
  category_id: string | null;
  position: number;
  created_at: string;
};

/** Item ainda em edição na tela, antes de virar linha no banco. */
export type DraftItem = {
  /** Local, só para a lista da UI. Não é o id do banco. */
  key: string;
  description: string;
  raw_text: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number | null;
  total: number;
  category_id: string | null;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string | null; // null = limite geral
  period: 'month' | 'year';
  limit_amount: number;
  created_at: string;
};

/** Categoria já combinada com suas subcategorias para uso na UI. */
export type CategoryWithSubs = Category & {
  subcategories: Category[];
};
