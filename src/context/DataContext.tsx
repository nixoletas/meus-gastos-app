import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { IconName } from '../data/icons';
import { supabase } from '../lib/supabase';
import { Budget, Category, CategoryWithSubs, Expense } from '../types';
import { useAuth } from './AuthContext';

type NewExpense = {
  amount: number;
  note?: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  occurred_at: string;
};

type CategoryInput = {
  name: string;
  icon: IconName;
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
  addExpense: (input: NewExpense) => Promise<Expense | null>;
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

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

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
      const [catRes, expRes, budRes] = await Promise.all([
        supabase.from('categories').select('*').order('created_at'),
        supabase
          .from('expenses')
          .select('*')
          .order('occurred_at', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('budgets').select('*'),
      ]);

      let cats = (catRes.data ?? []) as Category[];
      if (!catRes.error && cats.length === 0) {
        cats = await seedDefaults(userId);
      }

      setCategories(cats);
      setExpenses((expRes.data ?? []) as Expense[]);
      setBudgets((budRes.data ?? []) as Budget[]);
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
      setLoading(false);
    }
  }, [userId, loadAll]);

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
      setExpenses((prev) => [expense, ...prev]);
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
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? (data as Expense) : e))
      );
    },
    []
  );

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
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
      setCategories((prev) => [...prev, cat]);
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
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? (data as Category) : c))
      );
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
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      deleteBudget,
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
      updateExpense,
      deleteExpense,
      addCategory,
      updateCategory,
      deleteCategory,
      setBudget,
      deleteBudget,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de um DataProvider');
  return ctx;
}
