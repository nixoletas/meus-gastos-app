import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { AppIconName } from '../data/icons';
import { supabase } from '../lib/supabase';
import { Budget, Category, CategoryWithSubs, DraftItem, Expense } from '../types';
import { useAuth } from './AuthContext';

type NewExpense = {
  amount: number;
  note?: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  occurred_at: string;
};

/** Gasto + subcompras salvos numa transação só (RPC `save_expense_with_items`). */
type ExpenseWithItemsInput = {
  expense: NewExpense;
  items: DraftItem[];
  /** Notinha anexada, quando houver. */
  receiptId?: string | null;
  /** Preenchido quando está editando um gasto que já existe. */
  expenseId?: string | null;
};

type CategoryInput = {
  name: string;
  icon: AppIconName;
  color: string;
  parent_id: string | null;
};

type DataContextValue = {
  loading: boolean;
  seeding: boolean;
  categories: Category[];
  expenses: Expense[];
  budgets: Budget[];
  categoriesWithSubs: CategoryWithSubs[];
  getCategory: (id: string | null) => Category | undefined;
  refresh: () => Promise<void>;
  /** Preferência de ocultar o valor total, sincronizada entre web e app. */
  hideValue: boolean;
  setHideValue: (value: boolean) => Promise<void>;
  addExpense: (input: NewExpense) => Promise<Expense | null>;
  /**
   * Grava o gasto junto das subcompras da notinha. Uma transação só: sem isso,
   * uma queda de rede no meio deixa item órfão ou gasto sem os itens que o
   * usuário acabou de revisar.
   */
  saveExpenseWithItems: (input: ExpenseWithItemsInput) => Promise<Expense | null>;
  updateExpense: (id: string, input: Partial<NewExpense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addCategory: (input: CategoryInput) => Promise<Category | null>;
  updateCategory: (id: string, input: Partial<CategoryInput>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setBudget: (input: {
    category_id: string | null;
    period: 'month' | 'year';
    limit_amount: number;
  }) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
};

const DataContext = createContext<DataContextValue | undefined>(undefined);

const sortExpenses = (list: Expense[]) =>
  [...list].sort((a, b) =>
    a.occurred_at === b.occurred_at
      ? b.created_at.localeCompare(a.created_at)
      : b.occurred_at.localeCompare(a.occurred_at)
  );

/** Insere ou substitui a linha pelo id, evitando duplicar o que o realtime já trouxe. */
const upsertById = <T extends { id: string }>(list: T[], row: T) => {
  const index = list.findIndex((item) => item.id === row.id);
  if (index === -1) return [...list, row];
  const next = [...list];
  next[index] = row;
  return next;
};

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [hideValue, setHideValueState] = useState(false);

  const seedDefaults = useCallback(async (uid: string): Promise<Category[]> => {
    setSeeding(true);
    try {
      // 1) Insere as categorias-mãe.
      const parentsPayload = DEFAULT_CATEGORIES.map((c) => ({
        user_id: uid,
        name: c.name,
        icon: c.icon,
        color: c.color,
        parent_id: null,
      }));
      const { data: parents, error: parentErr } = await supabase
        .from('categories')
        .insert(parentsPayload)
        .select();
      if (parentErr || !parents) throw parentErr;

      // 2) Insere as subcategorias ligadas a cada mãe.
      const subsPayload: Omit<Category, 'id' | 'created_at'>[] = [];
      DEFAULT_CATEGORIES.forEach((def) => {
        const parent = parents.find((p) => p.name === def.name);
        if (!parent) return;
        def.subcategories.forEach((sub) => {
          subsPayload.push({
            user_id: uid,
            name: sub.name,
            icon: sub.icon,
            color: parent.color,
            parent_id: parent.id,
          });
        });
      });
      const { data: subs, error: subErr } = await supabase
        .from('categories')
        .insert(subsPayload)
        .select();
      if (subErr) throw subErr;

      return [...parents, ...(subs ?? [])] as Category[];
    } finally {
      setSeeding(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [catRes, expRes, budRes, settingsRes] = await Promise.all([
        supabase.from('categories').select('*').order('created_at'),
        supabase
          .from('expenses')
          .select('*')
          .order('occurred_at', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('budgets').select('*'),
        supabase.from('user_settings').select('hide_value').maybeSingle(),
      ]);

      let cats = (catRes.data ?? []) as Category[];
      if (!catRes.error && cats.length === 0) {
        cats = await seedDefaults(userId);
      }

      setCategories(cats);
      setExpenses((expRes.data ?? []) as Expense[]);
      setBudgets((budRes.data ?? []) as Budget[]);
      setHideValueState(settingsRes.data?.hide_value ?? false);
    } finally {
      setLoading(false);
    }
  }, [userId, seedDefaults]);

  useEffect(() => {
    if (userId) {
      loadAll();
    } else {
      setCategories([]);
      setExpenses([]);
      setBudgets([]);
      setHideValueState(false);
      setLoading(false);
    }
  }, [userId, loadAll]);

  // Sincronização em tempo real: reflete mudanças feitas em outros dispositivos.
  // A deduplicação por id evita conflito com as atualizações otimistas locais.
  useEffect(() => {
    if (!userId) return;
    const filter = `user_id=eq.${userId}`;

    const channel = supabase
      .channel('realtime-meus-gastos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses', filter },
        (payload) => {
          setExpenses((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((e) => e.id !== (payload.old as Expense).id);
            }
            const row = payload.new as Expense;
            return sortExpenses(upsertById(prev, row));
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categories', filter },
        (payload) => {
          setCategories((prev) => {
            if (payload.eventType === 'DELETE') {
              const id = (payload.old as Category).id;
              return prev.filter((c) => c.id !== id && c.parent_id !== id);
            }
            const row = payload.new as Category;
            return upsertById(prev, row);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter },
        (payload) => {
          setBudgets((prev) => {
            if (payload.eventType === 'DELETE') {
              return prev.filter((b) => b.id !== (payload.old as Budget).id);
            }
            const row = payload.new as Budget;
            return upsertById(prev, row);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_settings', filter },
        (payload) => {
          if (payload.eventType === 'DELETE') return;
          setHideValueState((payload.new as { hide_value: boolean }).hide_value);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const categoriesWithSubs = useMemo<CategoryWithSubs[]>(() => {
    const parents = categories.filter((c) => c.parent_id === null);
    return parents.map((parent) => ({
      ...parent,
      subcategories: categories.filter((c) => c.parent_id === parent.id),
    }));
  }, [categories]);

  const getCategory = useCallback(
    (id: string | null) => (id ? categories.find((c) => c.id === id) : undefined),
    [categories]
  );

  const addExpense = useCallback(
    async (input: NewExpense): Promise<Expense | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (error || !data) return null;
      const expense = data as Expense;
      setExpenses((prev) => sortExpenses(upsertById(prev, expense)));
      return expense;
    },
    [userId]
  );

  const saveExpenseWithItems = useCallback(
    async (input: ExpenseWithItemsInput): Promise<Expense | null> => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc('save_expense_with_items', {
        p_expense: input.expense,
        p_items: input.items.map((item, index) => ({
          description: item.description,
          raw_text: item.raw_text,
          quantity: item.quantity,
          unit: item.unit,
          unit_price: item.unit_price,
          total: item.total,
          category_id: item.category_id,
          position: index,
        })),
        p_receipt_id: input.receiptId ?? null,
        p_expense_id: input.expenseId ?? null,
      });
      if (error || !data) return null;
      const expense = data as Expense;
      setExpenses((prev) => sortExpenses(upsertById(prev, expense)));
      return expense;
    },
    [userId]
  );

  const updateExpense = useCallback(
    async (id: string, input: Partial<NewExpense>) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return;
      setExpenses((prev) => sortExpenses(upsertById(prev, data as Expense)));
    },
    []
  );

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));

    // O cascade do banco apaga a linha da notinha, mas não o arquivo no
    // Storage — esse só sai pela API, e antes de perder a referência a ele.
    const { data: receipts } = await supabase
      .from('receipts')
      .select('storage_path')
      .eq('expense_id', id);
    if (receipts?.length) {
      await supabase.storage
        .from('receipts')
        .remove(receipts.map((r) => (r as { storage_path: string }).storage_path));
    }

    await supabase.from('expenses').delete().eq('id', id);
  }, []);

  const addCategory = useCallback(
    async (input: CategoryInput): Promise<Category | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...input, user_id: userId })
        .select()
        .single();
      if (error || !data) return null;
      const cat = data as Category;
      setCategories((prev) => upsertById(prev, cat));
      return cat;
    },
    [userId]
  );

  const updateCategory = useCallback(
    async (id: string, input: Partial<CategoryInput>) => {
      const { data, error } = await supabase
        .from('categories')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return;
      setCategories((prev) => upsertById(prev, data as Category));
    },
    []
  );

  const deleteCategory = useCallback(async (id: string) => {
    // O cascade no banco remove subcategorias; refletimos isso localmente.
    setCategories((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
    await supabase.from('categories').delete().eq('id', id);
  }, []);

  const setBudget = useCallback<DataContextValue['setBudget']>(
    async (input) => {
      if (!userId) return;
      // Procura um orçamento já existente para a mesma categoria + período.
      const existing = budgets.find(
        (b) => b.category_id === input.category_id && b.period === input.period
      );

      const query = existing
        ? supabase
            .from('budgets')
            .update({ limit_amount: input.limit_amount })
            .eq('id', existing.id)
        : supabase.from('budgets').insert({ ...input, user_id: userId });

      const { data, error } = await query.select().single();
      if (error || !data) return;

      const budget = data as Budget;
      setBudgets((prev) => {
        const without = prev.filter(
          (b) =>
            !(b.category_id === budget.category_id && b.period === budget.period)
        );
        return [...without, budget];
      });
    },
    [userId, budgets]
  );

  const deleteBudget = useCallback(async (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    await supabase.from('budgets').delete().eq('id', id);
  }, []);

  const setHideValue = useCallback(
    async (value: boolean) => {
      if (!userId) return;
      setHideValueState(value);
      await supabase
        .from('user_settings')
        .upsert({ user_id: userId, hide_value: value, updated_at: new Date().toISOString() });
    },
    [userId]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      seeding,
      categories,
      expenses,
      budgets,
      categoriesWithSubs,
      getCategory,
      refresh: loadAll,
      addExpense,
      saveExpenseWithItems,
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      deleteBudget,
      hideValue,
      setHideValue,
    }),
    [
      loading,
      seeding,
      categories,
      expenses,
      budgets,
      categoriesWithSubs,
      getCategory,
      loadAll,
      addExpense,
      saveExpenseWithItems,
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      deleteBudget,
      hideValue,
      setHideValue,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de um DataProvider');
  return ctx;
}
