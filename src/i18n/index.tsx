import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getActiveLang,
  getActiveLocale,
  Lang,
  normalizeLang,
  setActiveLang,
} from './active';
import { en } from './en';
import { pt } from './pt';

export type { Lang } from './active';
export type Dict = typeof pt;

const DICTS: Record<Lang, Dict> = { 'pt-BR': pt, en };

const STORAGE_KEY = '@meus-gastos/lang';

/** Idioma do aparelho, quando o app entende; senão, português. */
function deviceLang(): Lang {
  try {
    const tag = new Intl.DateTimeFormat().resolvedOptions().locale;
    return normalizeLang(tag) ?? 'pt-BR';
  } catch {
    return 'pt-BR';
  }
}

type I18nContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Dicionário do idioma ativo. */
  t: Dict;
  /** Locale do Intl ("pt-BR" ou "en-US"). */
  locale: string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const initial = deviceLang();
    setActiveLang(initial);
    return initial;
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      const saved = normalizeLang(value);
      if (saved) {
        setActiveLang(saved);
        setLangState(saved);
      }
    });
  }, []);

  const setLang = (next: Lang) => {
    // Grava antes do setState: os utilitários de data/moeda leem o módulo
    // solto durante a renderização que este setState dispara.
    setActiveLang(next);
    setLangState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t: DICTS[lang], locale: getActiveLocale() }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n deve ser usado dentro de um I18nProvider');
  return ctx;
}

/** Atalho para quem só precisa do dicionário. */
export function useT(): Dict {
  return useI18n().t;
}

/**
 * Dicionário do idioma ativo fora do React — para funções soltas (mensagens de
 * erro em `lib/`, por exemplo) que não podem chamar hook.
 */
export function tNow(): Dict {
  return DICTS[getActiveLang()];
}
