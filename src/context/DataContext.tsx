import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DEFAULT_CATEGORIES, defaultName } from '../data/defaultCategories';
import { getActiveLang } from '../i18n/active';
import { AppIconName } from '../data/icons';
import { supabase } from '../lib/supabase';
import { Budget, Category, CategoryWithSubs, DraftItem, Expense } from '../types';
import { useAuth } from './AuthContext';
import { useLedger } from './LedgerContext';

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
  // Dono do caderno aberto: o próprio, ou o de quem compartilhou comigo. É ele
  // que carimba `user_id` em tudo que se grava e que filtra tudo que se lê.
  const { ownerId, canWrite } = useLedger();

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [hideValue, setHideValueState] = useState(false);

  const seedDefaults = useCallback(async (uid: string): Promise<Category[]> => {
    setSeeding(true);
    try {
      // Nome no idioma em que a conta está sendo criada. Depois disso vira
      // dado do usuário: trocar de idioma não renomeia categoria existente.
      const lang = getActiveLang();

      // 1) Insere as categorias-mãe.
      const parentsPayload = DEFAULT_CATEGORIES.map((c) => ({
        user_id: uid,
        name: defaultName(c, lang),
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
        const parent = parents.find((p) => p.name === defaultName(def, lang));
        if (!parent) return;
        def.subcategories.forEach((sub) => {
          subsPayload.push({
            user_id: uid,
            name: defaultName(sub, lang),
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
    if (!userId || !ownerId) return;
    setLoading(true);
    try {
      // O filtro por dono é obrigatório: a RLS agora libera também os cadernos
      // compartilhados, então sem ele a tela viria com a união de todos.
      const [catRes, expRes, budRes, settingsRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', ownerId)
          .order('created_at'),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', ownerId)
          .order('occurred_at', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('budgets').select('*').eq('user_id', ownerId),
        // Preferência de quem está olhando, não do dono do caderno.
        supabase
          .from('user_settings')
          .select('hide_value')
          .eq('user_id', userId)
          .maybeSingle(),
      ]);

      let cats = (catRes.data ?? []) as Category[];
      // Caderno de outra pessoa vazio não se semeia: as categorias sairiam
      // com o `user_id` de quem está visitando.
      if (!catRes.error && cats.length === 0 && ownerId === userId) {
        cats = await seedDefaults(userId);
      }

      setCategories(cats);
      setExpenses((expRes.data ?? []) as Expense[]);
      setBudgets((budRes.data ?? []) as Budget[]);
      setHideValueState(settingsRes.data?.hide_value ?? false);
    } finally {
      setLoading(false);
    }
  }, [userId, ownerId, seedDefaults]);

  useEffect(() => {
    if (userId && ownerId) {
      loadAll();
    } else {
      setCategories([]);
      setExpenses([]);
      setBudgets([]);
      setHideValueState(false);
      setLoading(false);
    }
  }, [userId, ownerId, loadAll]);

  // Sincronização em tempo real: reflete mudanças feitas em outros dispositivos.
  // A deduplicação por id evita conflito com as atualizações otimistas locais.
  useEffect(() => {
    if (!userId || !ownerId) return;
    const filter = `user_id=eq.${ownerId}`;

    const channel = supabase
      .channel(`realtime-meus-gastos-${ownerId}`)
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
        // Preferência é pessoal: escuta a própria linha, não a do dono.
        {
          event: '*',
          schema: 'public',
          table: 'user_settings',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') return;
          setHideValueState((payload.new as { hide_value: boolean }).hide_value);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, ownerId]);

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
      if (!ownerId || !canWrite) return null;
      const { data, error } = await supabase
        .from('expenses')
        .insert({ ...input, user_id: ownerId })
        .select()
        .single();
      if (error || !data) return null;
      const expense = data as Expense;
      setExpenses((prev) => sortExpenses(upsertById(prev, expense)));
      return expense;
    },
    [ownerId, canWrite]
  );

  const saveExpenseWithItems = useCallback(
    async (input: ExpenseWithItemsInput): Promise<Expense | null> => {
      if (!ownerId || !canWrite) return null;
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
        p_owner_id: ownerId,
      });
      if (error || !data) return null;
      const expense = data as Expense;
      setExpenses((prev) => sortExpenses(upsertById(prev, expense)));
      return expense;
    },
    [ownerId, canWrite]
  );

  const updateExpense = useCallback(
    async (id: string, input: Partial<NewExpense>) => {
      if (!ownerId || !canWrite) return;
      const { data, error } = await supabase
        .from('expenses')
        .update(input)
        .eq('id', id)
        .eq('user_id', ownerId)
        .select()
        .single();
      if (error || !data) return;
      setExpenses((prev) => sortExpenses(upsertById(prev, data as Expense)));
    },
    [ownerId, canWrite]
  );

  const deleteExpense = useCallback(
    async (id: string) => {
      if (!ownerId || !canWrite) return;
      setExpenses((prev) => prev.filter((e) => e.id !== id));

      // O cascade do banco apaga a linha da notinha, mas não o arquivo no
      // Storage — esse só sai pela API, e antes de perder a referência a ele.
      const { data: receipts } = await supabase
        .from('receipts')
        .select('storage_path')
        .eq('user_id', ownerId)
        .eq('expense_id', id);
      if (receipts?.length) {
        await supabase.storage
          .from('receipts')
          .remove(
            receipts
              .map((r) => (r as { storage_path: string | null }).storage_path)
              .filter((path): path is string => !!path)
          );
      }

      await supabase.from('expenses').delete().eq('id', id).eq('user_id', ownerId);
    },
    [ownerId, canWrite]
  );

  const addCategory = useCallback(
    async (input: CategoryInput): Promise<Category | null> => {
      if (!ownerId || !canWrite) return null;
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...input, user_id: ownerId })
        .select()
        .single();
      if (error || !data) return null;
      const cat = data as Category;
      setCategories((prev) => upsertById(prev, cat));
      return cat;
    },
    [ownerId, canWrite]
  );

  const updateCategory = useCallback(
    async (id: string, input: Partial<CategoryInput>) => {
      if (!ownerId || !canWrite) return;
      const { data, error } = await supabase
        .from('categories')
        .update(input)
        .eq('id', id)
        .eq('user_id', ownerId)
        .select()
        .single();
      if (error || !data) return;
      setCategories((prev) => upsertById(prev, data as Category));
    },
    [ownerId, canWrite]
  );

  const deleteCategory = useCallback(
    async (id: string) => {
      if (!ownerId || !canWrite) return;
      // O cascade no banco remove subcategorias; refletimos isso localmente.
      setCategories((prev) => prev.filter((c) => c.id !== id && c.parent_id !== id));
      await supabase.from('categories').delete().eq('id', id).eq('user_id', ownerId);
    },
    [ownerId, canWrite]
  );

  const setBudget = useCallback<DataContextValue['setBudget']>(
    async (input) => {
      if (!ownerId || !canWrite) return;
      // Procura um orçamento já existente para a mesma categoria + período.
      const existing = budgets.find(
        (b) => b.category_id === input.category_id && b.period === input.period
      );

      const query = existing
        ? supabase
            .from('budgets')
            .update({ limit_amount: input.limit_amount })
            .eq('id', existing.id)
            .eq('user_id', ownerId)
        : supabase.from('budgets').insert({ ...input, user_id: ownerId });

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
    [ownerId, canWrite, budgets]
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      if (!ownerId || !canWrite) return;
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      await supabase.from('budgets').delete().eq('id', id).eq('user_id', ownerId);
    },
    [ownerId, canWrite]
  );

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
