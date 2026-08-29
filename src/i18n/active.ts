/**
 * Idioma "ativo" num módulo solto.
 *
 * Os utilitários de data e moeda são funções puras chamadas de dezenas de
 * lugares; passar o idioma em cada chamada espalharia o parâmetro por todo o
 * app. O provider grava o idioma aqui antes de renderizar, e a troca de idioma
 * re-renderiza tudo pelo contexto — então o valor lido aqui está sempre
 * sincronizado com o que a tela mostra.
 */

export type Lang = 'pt-BR' | 'en';

export const LANGS: Lang[] = ['pt-BR', 'en'];

/** Locale do Intl correspondente a cada idioma. */
export const LOCALES: Record<Lang, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
};

/** Nome de cada idioma no próprio idioma — quem não lê o atual reconhece o seu. */
export const LANG_LABELS: Record<Lang, string> = {
  'pt-BR': 'Português',
  en: 'English',
};

let activeLang: Lang = 'pt-BR';

export function setActiveLang(lang: Lang) {
  activeLang = lang;
}

export function getActiveLang(): Lang {
  return activeLang;
}

export function getActiveLocale(): string {
  return LOCALES[activeLang];
}

/** Normaliza qualquer tag de idioma ("pt", "en-GB", "pt_BR") para um Lang. */
export function normalizeLang(tag: string | null | undefined): Lang | null {
  if (!tag) return null;
  const lower = tag.toLowerCase().replace('_', '-');
  if (lower.startsWith('pt')) return 'pt-BR';
  if (lower.startsWith('en')) return 'en';
  return null;
}
