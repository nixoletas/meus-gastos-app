/** Utilitários de data em português do Brasil. */

const MESES = [
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
];

const MESES_CURTOS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

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
  return MESES[monthIndex] ?? '';
}

export function shortMonthName(monthIndex: number): string {
  return MESES_CURTOS[monthIndex] ?? '';
}

/** Rótulo do período atual, ex.: "Junho de 2026" ou "2026". */
export function periodLabel(date: Date, period: Period): string {
  if (period === 'year') return String(date.getFullYear());
  return `${monthName(date.getMonth())} de ${date.getFullYear()}`;
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

/** Formata uma data ISO como "16 jun". */
export function formatDayMonth(iso: string): string {
  const d = fromISODate(iso);
  return `${d.getDate()} ${shortMonthName(d.getMonth())}`;
}

/** Rótulo relativo amigável: "Hoje", "Ontem" ou "16 jun". */
export function relativeDayLabel(iso: string): string {
  const d = fromISODate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  return formatDayMonth(iso);
}

/** Formata uma data ISO como "18/06". */
export function formatShortDate(iso: string): string {
  const d = fromISODate(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
}

/**
 * Cabeçalho de grupo de data, ex.: "18/06 (hoje)", "17/06 (ontem)",
 * "08/06 (semana passada)". Retorna a data curta + qualificador relativo.
 */
export function dateHeaderLabel(iso: string): string {
  const d = fromISODate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);

  let qualifier = '';
  if (diffDays === 0) qualifier = 'hoje';
  else if (diffDays === 1) qualifier = 'ontem';
  else if (diffDays >= 2 && diffDays <= 6) qualifier = 'essa semana';
  else if (diffDays >= 7 && diffDays <= 14) qualifier = 'semana passada';

  return qualifier ? `${formatShortDate(iso)} (${qualifier})` : formatShortDate(iso);
}
