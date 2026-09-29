import { Budget, Category, Expense } from '../types';
import { isInPeriod, Period } from './date';
import { normalizeText } from './text';

export type CategoryTotal = {
  category: Category | undefined;
  categoryId: string | null;
  total: number;
  count: number;
  percent: number; // 0..1 sobre o total do período
};

/** Soma de todos os gastos dentro do período de referência. */
export function totalForPeriod(
  expenses: Expense[],
  ref: Date,
  period: Period
): number {
  return expenses.reduce(
    (sum, e) => (isInPeriod(e.occurred_at, ref, period) ? sum + e.amount : sum),
    0
  );
}

/** Filtra os gastos do período, já ordenados por data desc (assume entrada ordenada). */
export function expensesForPeriod(
  expenses: Expense[],
  ref: Date,
  period: Period
): Expense[] {
  return expenses.filter((e) => isInPeriod(e.occurred_at, ref, period));
}

/**
 * Resolve a categoria-mãe de um lançamento (subcategoria -> sua mãe).
 * null quando o gasto não tem categoria.
 */
function rootCategoryId(
  e: Expense,
  byId: Map<string, Category>
): string | null {
  let rootId: string | null = e.category_id;
  const cat = e.category_id ? byId.get(e.category_id) : undefined;
  if (cat?.parent_id) rootId = cat.parent_id;
  if (!cat && e.subcategory_id) {
    const sub = byId.get(e.subcategory_id);
    rootId = sub?.parent_id ?? e.subcategory_id;
  }
  return rootId;
}

/**
 * Agrupa os gastos do período pela categoria-mãe.
 * Subcategorias somam no total da categoria-mãe correspondente.
 */
export function totalsByCategory(
  expenses: Expense[],
  categories: Category[],
  ref: Date,
  period: Period
): CategoryTotal[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const buckets = new Map<string | null, { total: number; count: number }>();

  for (const e of expenses) {
    if (!isInPeriod(e.occurred_at, ref, period)) continue;

    const rootId = rootCategoryId(e, byId);

    const bucket = buckets.get(rootId) ?? { total: 0, count: 0 };
    bucket.total += e.amount;
    bucket.count += 1;
    buckets.set(rootId, bucket);
  }

  const grandTotal = [...buckets.values()].reduce((s, b) => s + b.total, 0);

  return [...buckets.entries()]
    .map(([categoryId, { total, count }]) => ({
      categoryId,
      category: categoryId ? byId.get(categoryId) : undefined,
      total,
      count,
      percent: grandTotal > 0 ? total / grandTotal : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export type SubcategoryTotal = {
  sub: Category | undefined; // undefined = lançado direto na categoria-mãe
  key: string;
  total: number;
  count: number;
  percent: number; // 0..1 sobre o total da categoria-mãe
};

/**
 * Detalha os gastos de uma categoria-mãe agrupados por subcategoria,
 * dentro do período. Lançamentos feitos direto na categoria ficam em
 * "Sem subcategoria" (sub = undefined).
 */
export function subcategoryBreakdown(
  expenses: Expense[],
  categories: Category[],
  parentId: string,
  ref: Date,
  period: Period
): SubcategoryTotal[] {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const buckets = new Map<string, { total: number; count: number }>();

  for (const e of expenses) {
    if (!isInPeriod(e.occurred_at, ref, period)) continue;

    // Descobre a subcategoria do lançamento dentro desta categoria-mãe.
    let subId: string | null = null;
    const sub = e.subcategory_id ? byId.get(e.subcategory_id) : undefined;
    const cat = e.category_id ? byId.get(e.category_id) : undefined;

    if (sub?.parent_id === parentId) subId = sub.id;
    else if (cat?.parent_id === parentId) subId = cat.id;
    else if (e.category_id === parentId) subId = null; // direto na mãe
    else continue; // não pertence a esta categoria

    const key = subId ?? '__none__';
    const bucket = buckets.get(key) ?? { total: 0, count: 0 };
    bucket.total += e.amount;
    bucket.count += 1;
    buckets.set(key, bucket);
  }

  const grandTotal = [...buckets.values()].reduce((s, b) => s + b.total, 0);

  return [...buckets.entries()]
    .map(([key, { total, count }]) => ({
      key,
      sub: key === '__none__' ? undefined : byId.get(key),
      total,
      count,
      percent: grandTotal > 0 ? total / grandTotal : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Lista os lançamentos individuais de uma subcategoria (key do
 * subcategoryBreakdown) dentro de uma categoria-mãe e período, ordenados por
 * data desc. key '__none__' = lançado direto na categoria-mãe.
 */
export function subcategoryExpenses(
  expenses: Expense[],
  categories: Category[],
  parentId: string,
  subKey: string,
  ref: Date,
  period: Period
): Expense[] {
  const byId = new Map(categories.map((c) => [c.id, c]));

  return expenses
    .filter((e) => {
      if (!isInPeriod(e.occurred_at, ref, period)) return false;

      let subId: string | null = null;
      const sub = e.subcategory_id ? byId.get(e.subcategory_id) : undefined;
      const cat = e.category_id ? byId.get(e.category_id) : undefined;

      if (sub?.parent_id === parentId) subId = sub.id;
      else if (cat?.parent_id === parentId) subId = cat.id;
      else if (e.category_id === parentId) subId = null;
      else return false;

      return (subId ?? '__none__') === subKey;
    })
    .sort((a, b) =>
      a.occurred_at === b.occurred_at
        ? b.created_at.localeCompare(a.created_at)
        : b.occurred_at.localeCompare(a.occurred_at)
    );
}

export type BudgetSegment = {
  categoryId: string | null; // null = gasto sem categoria
  category: Category | undefined;
  amount: number;
  share: number; // 0..1 sobre o gasto do orçamento
};

export type BudgetAlert = {
  budget: Budget;
  category: Category | undefined;
  spent: number;
  ratio: number; // gasto / limite
  level: 'ok' | 'warning' | 'exceeded';
  /**
   * Composição do gasto por categoria-mãe, do maior pro menor. Só o limite
   * geral tem segmentos; num limite de categoria a barra já é de uma só cor.
   */
  segments: BudgetSegment[];
};

/**
 * Avalia cada orçamento contra o gasto do período correspondente.
 * 'warning' a partir de 80% do limite; 'exceeded' quando passa de 100%.
 */
export function evaluateBudgets(
  budgets: Budget[],
  expenses: Expense[],
  categories: Category[],
  ref: Date
): BudgetAlert[] {
  const byId = new Map(categories.map((c) => [c.id, c]));

  return budgets.map((budget) => {
    const period: Period = budget.period === 'year' ? 'year' : 'month';
    const isGeneral = budget.category_id === null;

    let spent = 0;
    // Composição por categoria-mãe: alimenta a barra multicolorida do geral.
    const buckets = new Map<string | null, number>();

    for (const e of expenses) {
      if (!isInPeriod(e.occurred_at, ref, period)) continue;

      if (isGeneral) {
        spent += e.amount;
        const rootId = rootCategoryId(e, byId);
        buckets.set(rootId, (buckets.get(rootId) ?? 0) + e.amount);
        continue;
      }

      // Casa tanto a categoria-mãe quanto suas subcategorias.
      const cat = e.category_id ? byId.get(e.category_id) : undefined;
      const matchesRoot =
        e.category_id === budget.category_id ||
        cat?.parent_id === budget.category_id ||
        e.subcategory_id === budget.category_id;
      if (matchesRoot) spent += e.amount;
    }

    const ratio = budget.limit_amount > 0 ? spent / budget.limit_amount : 0;
    const level: BudgetAlert['level'] =
      ratio >= 1 ? 'exceeded' : ratio >= 0.8 ? 'warning' : 'ok';

    const segments: BudgetSegment[] = [...buckets.entries()]
      .map(([categoryId, amount]) => ({
        categoryId,
        category: categoryId ? byId.get(categoryId) : undefined,
        amount,
        share: spent > 0 ? amount / spent : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      budget,
      category: budget.category_id ? byId.get(budget.category_id) : undefined,
      spent,
      ratio,
      level,
      segments,
    };
  });
}

export type GroupTotal = {
  key: string;
  total: number;
  count: number;
  percent: number; // 0..1 sobre o total do período
  expenses: Expense[];
};

/** Agrupa os gastos do período por uma chave qualquer, do maior pro menor. */
function groupForPeriod(
  expenses: Expense[],
  ref: Date,
  period: Period,
  keyOf: (e: Expense) => string
): GroupTotal[] {
  const buckets = new Map<string, GroupTotal>();
  let grand = 0;
  for (const e of expenses) {
    if (!isInPeriod(e.occurred_at, ref, period)) continue;
    const key = keyOf(e);
    const bucket = buckets.get(key) ?? { key, total: 0, count: 0, percent: 0, expenses: [] };
    bucket.total += e.amount;
    bucket.count += 1;
    bucket.expenses.push(e);
    buckets.set(key, bucket);
    grand += e.amount;
  }
  return [...buckets.values()]
    .map((b) => ({ ...b, percent: grand > 0 ? b.total / grand : 0 }))
    .sort((a, b) => b.total - a.total);
}

export const NO_PAYMENT_KEY = '__none__';
export const NO_PLACE_KEY = '__none__';

/** Por meio de pagamento. Sem meio informado cai em `NO_PAYMENT_KEY`. */
export function totalsByPaymentMethod(
  expenses: Expense[],
  ref: Date,
  period: Period
): GroupTotal[] {
  return groupForPeriod(expenses, ref, period, (e) => e.payment_method_id ?? NO_PAYMENT_KEY);
}

/** Chave de agrupamento do local: sem caixa, acento nem espaço sobrando. */
export function placeKey(place: string | null | undefined): string {
  const clean = normalizeText(place ?? '');
  return clean || NO_PLACE_KEY;
}

export type PlaceTotal = GroupTotal & {
  /** Nome como o usuário escreveu da última vez. */
  name: string | null;
  /** Primeiro link do Maps encontrado entre os gastos do lugar. */
  url: string | null;
};

/** Por estabelecimento. "Padaria X" e "padaria x" são o mesmo lugar. */
export function totalsByPlace(expenses: Expense[], ref: Date, period: Period): PlaceTotal[] {
  return groupForPeriod(expenses, ref, period, (e) => placeKey(e.place)).map((g) => {
    // `expenses` vem ordenado do mais recente: o primeiro nome é o atual.
    const named = g.expenses.find((e) => e.place?.trim());
    const linked = g.expenses.find((e) => e.place_url);
    return {
      ...g,
      name: named?.place?.trim() ?? null,
      url: linked?.place_url ?? null,
    };
  });
}

/** Lugares já usados, do mais frequente pro menos — sugestão no lançamento. */
export function knownPlaces(expenses: Expense[]): { name: string; url: string | null }[] {
  const seen = new Map<string, { name: string; url: string | null; count: number }>();
  for (const e of expenses) {
    const name = e.place?.trim();
    if (!name) continue;
    const key = placeKey(name);
    const entry = seen.get(key);
    if (entry) {
      entry.count += 1;
      if (!entry.url && e.place_url) entry.url = e.place_url;
    } else {
      seen.set(key, { name, url: e.place_url ?? null, count: 1 });
    }
  }
  return [...seen.values()]
    .sort((a, b) => b.count - a.count)
    .map(({ name, url }) => ({ name, url }));
}

export type TimeBucket = {
  /** Dia do mês (1..31) ou mês do ano (0..11). */
  index: number;
  total: number;
  count: number;
  expenses: Expense[];
  /** Ainda não chegou (dia/mês no futuro) — a barra fica apagada. */
  future: boolean;
};

/** Linha do tempo: dias do mês, ou meses do ano. */
export function timelineBuckets(expenses: Expense[], ref: Date, period: Period): TimeBucket[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const size =
    period === 'year' ? 12 : new Date(ref.getFullYear(), ref.getMonth() + 1, 0).getDate();
  const buckets: TimeBucket[] = Array.from({ length: size }, (_, i) => {
    const start =
      period === 'year'
        ? new Date(ref.getFullYear(), i, 1)
        : new Date(ref.getFullYear(), ref.getMonth(), i + 1);
    return { index: period === 'year' ? i : i + 1, total: 0, count: 0, expenses: [], future: start > today };
  });
  for (const e of expenses) {
    if (!isInPeriod(e.occurred_at, ref, period)) continue;
    const [, m, d] = e.occurred_at.split('-').map(Number);
    const bucket = buckets[period === 'year' ? m - 1 : d - 1];
    if (!bucket) continue;
    bucket.total += e.amount;
    bucket.count += 1;
    bucket.expenses.push(e);
  }
  return buckets;
}

export type WeekdayTotal = {
  /** 0 = domingo. */
  weekday: number;
  total: number;
  count: number;
  /** Quantos desses dias da semana já passaram no período (para a média). */
  days: number;
  expenses: Expense[];
};

/** Por dia da semana, com a média por dia que já aconteceu no período. */
export function totalsByWeekday(expenses: Expense[], ref: Date, period: Period): WeekdayTotal[] {
  const out: WeekdayTotal[] = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    total: 0,
    count: 0,
    days: 0,
    expenses: [],
  }));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start =
    period === 'year'
      ? new Date(ref.getFullYear(), 0, 1)
      : new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end =
    period === 'year'
      ? new Date(ref.getFullYear(), 11, 31)
      : new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  const last = end < today ? end : today;
  for (const d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) {
    out[d.getDay()].days += 1;
  }

  for (const e of expenses) {
    if (!isInPeriod(e.occurred_at, ref, period)) continue;
    const [y, m, d] = e.occurred_at.split('-').map(Number);
    const slot = out[new Date(y, m - 1, d).getDay()];
    slot.total += e.amount;
    slot.count += 1;
    slot.expenses.push(e);
  }
  return out;
}

/** Dias do período que já começaram (para média diária). Mínimo 1. */
export function elapsedDays(ref: Date, period: Period): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start =
    period === 'year'
      ? new Date(ref.getFullYear(), 0, 1)
      : new Date(ref.getFullYear(), ref.getMonth(), 1);
  const end =
    period === 'year'
      ? new Date(ref.getFullYear(), 11, 31)
      : new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
  if (start > today) return 1;
  const last = end < today ? end : today;
  return Math.max(1, Math.round((last.getTime() - start.getTime()) / 86400000) + 1);
}
