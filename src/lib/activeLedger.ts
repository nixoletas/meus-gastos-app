import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Qual caderno de gastos ficou aberto da última vez.
 *
 * Vive fora do LedgerContext porque o logout (AuthContext) também precisa
 * limpar — e um importar o outro fecharia um ciclo entre os dois contextos.
 */
const ACTIVE_KEY = '@meus-gastos/caderno-ativo';

/** Dono do caderno guardado, ou null quando é o próprio. */
export async function loadActiveLedger(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export async function saveActiveLedger(ownerId: string) {
  try {
    await AsyncStorage.setItem(ACTIVE_KEY, ownerId);
  } catch {
    // Sem persistência a troca vale só para esta sessão — não é motivo de erro.
  }
}

export async function clearActiveLedger() {
  try {
    await AsyncStorage.removeItem(ACTIVE_KEY);
  } catch {
    // idem
  }
}
