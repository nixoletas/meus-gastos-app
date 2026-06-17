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
