import React from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

/** Mapa passado ao useFonts() para carregar a família Space Grotesk. */
export const APP_FONTS = {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
};

/**
 * Cada peso da Space Grotesk é um arquivo separado, então escolhemos o
 * arquivo certo conforme o fontWeight usado no estilo.
 */
function familyForWeight(weight?: string | number): string {
  const w = String(weight ?? '400');
  if (w === '600') return 'SpaceGrotesk_600SemiBold';
  if (w === '500') return 'SpaceGrotesk_500Medium';
  if (w === '700' || w === '800' || w === '900' || w === 'bold') {
    return 'SpaceGrotesk_700Bold';
  }
  return 'SpaceGrotesk_400Regular';
}

/** Text do app: igual ao do React Native, porém com a fonte Space Grotesk. */
export function Text({ style, ...rest }: TextProps) {
  const flat = (StyleSheet.flatten(style) ?? {}) as any;
  const fontFamily = flat.fontFamily ?? familyForWeight(flat.fontWeight);
  return <RNText {...rest} style={[{ fontFamily }, style]} />;
}

/** TextInput do app, também com a fonte Space Grotesk. */
export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ style, ...rest }, ref) => {
    const flat = (StyleSheet.flatten(style) ?? {}) as any;
    const fontFamily = flat.fontFamily ?? familyForWeight(flat.fontWeight);
    return <RNTextInput ref={ref} {...rest} style={[{ fontFamily }, style]} />;
  }
);
TextInput.displayName = 'AppTextInput';
