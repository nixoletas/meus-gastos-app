/** Utilitários de data, formatados no idioma ativo. */
import { getActiveLang, Lang } from '../i18n/active';

const MONTHS: Record<Lang, string[]> = {
  'pt-BR': [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
};

const SHORT_MONTHS: Record<Lang, string[]> = {
  'pt-BR': ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const WEEKDAYS: Record<Lang, string[]> = {
  'pt-BR': [
    'domingo',
    'segunda-feira',
    'terça-feira',
    'quarta-feira',
    'quinta-feira',
    'sexta-feira',
    'sábado',
  ],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};

/** Iniciais dos dias da semana no cabeçalho do calendário (domingo primeiro). */
export const WEEKDAY_INITIALS: Record<Lang, string[]> = {
  'pt-BR': ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

const DAY_QUALIFIERS: Record<Lang, {
  today: string;
  yesterday: string;
  thisWeek: string;
  lastWeek: string;
  todayCap: string;
  yesterdayCap: string;
}> = {
  'pt-BR': {
    today: 'hoje',
    yesterday: 'ontem',
    thisWeek: 'essa semana',
    lastWeek: 'semana passada',
    todayCap: 'Hoje',
    yesterdayCap: 'Ontem',
  },
  en: {
    today: 'today',
    yesterday: 'yesterday',
    thisWeek: 'this week',
    lastWeek: 'last week',
    todayCap: 'Today',
    yesterdayCap: 'Yesterday',
  },
};

export type Period = 'month' | 'year';

/** Retorna a chave ISO de uma data (YYYY-MM-DD) no fuso local. */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Converte 'YYYY-MM-DD' (sem fuso) em Date local, evitando bug de UTC. */
export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function monthName(monthIndex: number): string {
  return MONTHS[getActiveLang()][monthIndex] ?? '';
}

export function shortMonthName(monthIndex: number): string {
  return SHORT_MONTHS[getActiveLang()][monthIndex] ?? '';
}

export function weekdayInitials(): string[] {
  return WEEKDAY_INITIALS[getActiveLang()];
}

/** Rótulo do período atual, ex.: "Junho de 2026"/"June 2026" ou "2026". */
export function periodLabel(date: Date, period: Period): string {
  if (period === 'year') return String(date.getFullYear());
  const month = monthName(date.getMonth());
  return getActiveLang() === 'en'
    ? `${month} ${date.getFullYear()}`
    : `${month} de ${date.getFullYear()}`;
}

/** Avança/retrocede o período (mês ou ano) por `delta` unidades. */
export function shiftPeriod(date: Date, period: Period, delta: number): Date {
  const next = new Date(date);
  if (period === 'year') {
    next.setFullYear(next.getFullYear() + delta);
  } else {
    next.setMonth(next.getMonth() + delta);
  }
  return next;
}

/** Verifica se a data ISO cai dentro do período selecionado. */
export function isInPeriod(iso: string, ref: Date, period: Period): boolean {
  const d = fromISODate(iso);
  if (period === 'year') {
    return d.getFullYear() === ref.getFullYear();
  }
  return (
    d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
  );
}

/** Formata uma data ISO como "16 jun" (pt-BR) ou "Jun 16" (en). */
export function formatDayMonth(iso: string): string {
  const d = fromISODate(iso);
  const month = shortMonthName(d.getMonth());
  return getActiveLang() === 'en' ? `${month} ${d.getDate()}` : `${d.getDate()} ${month}`;
}

/** Rótulo relativo amigável: "Hoje", "Ontem" ou "16 jun". */
export function relativeDayLabel(iso: string): string {
  const d = fromISODate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  const words = DAY_QUALIFIERS[getActiveLang()];
  if (diffDays === 0) return words.todayCap;
  if (diffDays === 1) return words.yesterdayCap;
  return formatDayMonth(iso);
}

/** Formata uma data ISO como "18/06" (pt-BR) ou "06/18" (en, mês antes). */
export function formatShortDate(iso: string): string {
  const d = fromISODate(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return getActiveLang() === 'en' ? `${month}/${day}` : `${day}/${month}`;
}

/**
 * Cabeçalho de grupo de data, ex.: "18/06 (hoje)", "17/06 (ontem)",
 * "08/06 (semana passada)" ou "01/06 (segunda-feira)" para datas mais distantes.
 */
export function dateHeaderLabel(iso: string): string {
  const d = fromISODate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  const lang = getActiveLang();
  const words = DAY_QUALIFIERS[lang];

  let qualifier = '';
  if (diffDays === 0) qualifier = words.today;
  else if (diffDays === 1) qualifier = words.yesterday;
  else if (diffDays >= 2 && diffDays <= 6) qualifier = words.thisWeek;
  else if (diffDays >= 7 && diffDays <= 14) qualifier = words.lastWeek;
  else qualifier = WEEKDAYS[lang][d.getDay()];

  return qualifier ? `${formatShortDate(iso)} (${qualifier})` : formatShortDate(iso);
}
