/**
 * Utilitários para a máscara de dinheiro em Real brasileiro (R$).
 *
 * Estratégia da máscara: o usuário digita apenas números e os 2 últimos
 * dígitos são sempre os centavos. Ex.: digitar "12345" => R$ 123,45.
 */

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formata um valor em reais (número decimal) como "R$ 1.234,56". */
export function formatBRL(value: number): string {
  if (!Number.isFinite(value)) return brlFormatter.format(0);
  return brlFormatter.format(value);
}

/** Formata sem o símbolo "R$", apenas "1.234,56". */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return numberFormatter.format(0);
  return numberFormatter.format(value);
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
  return numberFormatter.format(value);
}

/** Converte um valor em reais de volta para a string de dígitos (centavos). */
export function reaisToRaw(value: number): string {
  return Math.round(value * 100).toString();
}

/** Abrevia valores grandes: 1.500 -> "R$ 1,5 mil", 2.000.000 -> "R$ 2 mi". */
export function formatBRLCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `R$ ${formatNumber(value / 1_000_000).replace(',00', '')} mi`;
  }
  if (abs >= 10_000) {
    return `R$ ${formatNumber(value / 1_000).replace(',00', '')} mil`;
  }
  return formatBRL(value);
}
