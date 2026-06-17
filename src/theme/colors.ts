export type ThemeColors = {
  /** Fundo principal da tela */
  background: string;
  /** Fundo de cartões / superfícies elevadas */
  card: string;
  /** Superfície sutil (inputs, chips) */
  surface: string;
  /** Texto principal */
  text: string;
  /** Texto secundário / legendas */
  textMuted: string;
  /** Cor de destaque / marca */
  primary: string;
  /** Texto sobre a cor primária */
  onPrimary: string;
  /** Variação suave do primário (fundos) */
  primarySoft: string;
  /** Bordas e divisores */
  border: string;
  /** Vermelho de alerta / excesso de gasto */
  danger: string;
  /** Fundo suave de alerta */
  dangerSoft: string;
  /** Amarelo de atenção */
  warning: string;
  /** Verde de sucesso (dopamina) */
  success: string;
  /** Sombra */
  shadow: string;
  /** Barra de status: 'light' ou 'dark' */
  statusBar: 'light' | 'dark';
};

export const lightColors: ThemeColors = {
  background: '#F4F6F8',
  card: '#FFFFFF',
  surface: '#EEF1F4',
  text: '#0F172A',
  textMuted: '#64748B',
  primary: '#0EA5A4',
  onPrimary: '#FFFFFF',
  primarySoft: '#D6F5F0',
  border: '#E2E8F0',
  danger: '#E11D48',
  dangerSoft: '#FEE2E8',
  warning: '#F59E0B',
  success: '#16A34A',
  shadow: 'rgba(15, 23, 42, 0.12)',
  statusBar: 'dark',
};

export const darkColors: ThemeColors = {
  background: '#0B1120',
  card: '#151C2C',
  surface: '#1E2638',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  primary: '#2DD4BF',
  onPrimary: '#06231F',
  primarySoft: '#13322F',
  border: '#27314A',
  danger: '#FB7185',
  dangerSoft: '#3A1B26',
  warning: '#FBBF24',
  success: '#4ADE80',
  shadow: 'rgba(0, 0, 0, 0.5)',
  statusBar: 'light',
};

/** Paleta de cores disponíveis para o usuário escolher ao criar categorias. */
export const categoryPalette = [
  '#0EA5A4',
  '#6366F1',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#EF4444',
  '#8B5CF6',
  '#3B82F6',
  '#14B8A6',
  '#F97316',
  '#84CC16',
  '#06B6D4',
  '#D946EF',
  '#64748B',
];
