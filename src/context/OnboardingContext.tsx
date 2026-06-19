import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = '@meus-gastos/onboarded';

type OnboardingContextValue = {
  /** null = ainda carregando; true/false = já sabemos. */
  onboarded: boolean | null;
  complete: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => setOnboarded(v === '1'))
      .catch(() => setOnboarded(false));
  }, []);

  const complete = () => {
    setOnboarded(true);
    AsyncStorage.setItem(STORAGE_KEY, '1').catch(() => {});
  };

  return (
    <OnboardingContext.Provider value={{ onboarded, complete }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding deve ser usado dentro de OnboardingProvider');
  return ctx;
}
