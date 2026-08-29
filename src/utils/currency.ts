/**
 * Utilitários da máscara de dinheiro.
 *
 * Os valores são sempre em Real (R$) — é a moeda em que o gasto foi lançado.
 * O que muda com o idioma é só a formatação: "R$ 1.234,56" em pt-BR e
 * "R$ 1,234.56" em inglês.
 *
 * Estratégia da máscara: o usuário digita apenas números e os 2 últimos
 * dígitos são sempre os centavos. Ex.: digitar "12345" => R$ 123,45.
 */
import { getActiveLang, getActiveLocale } from '../i18n/active';

const currencyCache = new Map<string, Intl.NumberFormat>();
const numberCache = new Map<string, Intl.NumberFormat>();

function currencyFormatter(): Intl.NumberFormat {
  const locale = getActiveLocale();
  let fmt = currencyCache.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyCache.set(locale, fmt);
  }
  return fmt;
}

function plainFormatter(): Intl.NumberFormat {
  const locale = getActiveLocale();
  let fmt = numberCache.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    numberCache.set(locale, fmt);
  }
  return fmt;
}

/** Formata um valor em reais (número decimal) como "R$ 1.234,56". */
export function formatBRL(value: number): string {
  const fmt = currencyFormatter();
  if (!Number.isFinite(value)) return fmt.format(0);
  return fmt.format(value);
}

/** Formata sem o símbolo "R$", apenas "1.234,56". */
export function formatNumber(value: number): string {
  const fmt = plainFormatter();
  if (!Number.isFinite(value)) return fmt.format(0);
  return fmt.format(value);
}

/**
 * Converte o texto bruto digitado (com qualquer caractere) em um valor
 * em reais, tratando os 2 últimos dígitos como centavos.
 * Ex.: "R$ 1.234,5" -> 12345 dígitos -> 123.45
 */
export function rawToReais(raw: string): number {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 0) return 0;
  const cents = parseInt(digits, 10);
  return cents / 100;
}

/**
 * Aplica a máscara de moeda ao texto digitado, retornando algo como
 * "1.234,56" (sem o símbolo R$, que mostramos separadamente na UI).
 */
export function maskCurrencyInput(raw: string): string {
  const value = rawToReais(raw);
  return formatNumber(value);
}

/** Converte um valor em reais de volta para a string de dígitos (centavos). */
export function reaisToRaw(value: number): string {
  return Math.round(value * 100).toString();
}

/** Abrevia valores grandes: 1.500 -> "R$ 1,5 mil", 2.000.000 -> "R$ 2 mi". */
export function formatBRLCompact(value: number): string {
  const abs = Math.abs(value);
  const en = getActiveLang() === 'en';
  // Em pt-BR o zero decimal cai ("1,50 mil" fica pior que "1,5 mil").
  const trim = (n: number) => formatNumber(n).replace(en ? '.00' : ',00', '');
  if (abs >= 1_000_000) {
    return en ? `R$${trim(value / 1_000_000)}M` : `R$ ${trim(value / 1_000_000)} mi`;
  }
  if (abs >= 10_000) {
    return en ? `R$${trim(value / 1_000)}K` : `R$ ${trim(value / 1_000)} mil`;
  }
  return formatBRL(value);
}
