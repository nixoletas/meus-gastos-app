import { Budget, Category, Expense } from '../types';
import { isInPeriod, Period } from './date';

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

    // Resolve a categoria-mãe (subcategoria -> sua mãe).
    let rootId: string | null = e.category_id;
    const cat = e.category_id ? byId.get(e.category_id) : undefined;
    if (cat?.parent_id) rootId = cat.parent_id;
    if (!cat && e.subcategory_id) {
      const sub = byId.get(e.subcategory_id);
      rootId = sub?.parent_id ?? e.subcategory_id;
    }

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

export type BudgetAlert = {
  budget: Budget;
  category: Category | undefined;
  spent: number;
  ratio: number; // gasto / limite
  level: 'ok' | 'warning' | 'exceeded';
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

    let spent = 0;
    for (const e of expenses) {
      if (!isInPeriod(e.occurred_at, ref, period)) continue;

      if (budget.category_id === null) {
        spent += e.amount;
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

    return {
      budget,
      category: budget.category_id ? byId.get(budget.category_id) : undefined,
      spent,
      ratio,
      level,
    };
  });
}
