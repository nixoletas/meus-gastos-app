import React from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';
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
 * Como cada peso é um arquivo de fonte separado, mapeamos o fontWeight usado
 * nos estilos para o arquivo correspondente da Space Grotesk.
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

let patched = false;

/**
 * Aplica a fonte do app a TODO componente Text/TextInput automaticamente,
 * escolhendo o arquivo certo conforme o fontWeight do estilo — sem precisar
 * tocar em cada tela. Respeita um fontFamily já definido explicitamente.
 */
export function applyAppFont() {
  if (patched) return;
  patched = true;

  for (const Comp of [Text, TextInput] as any[]) {
    const orig = Comp.render;
    if (typeof orig !== 'function') continue;
    Comp.render = function patchedRender(...args: any[]) {
      const element = orig.apply(this, args);
      if (!element) return element;
      const flat = StyleSheet.flatten(element.props?.style) || {};
      const fontFamily = flat.fontFamily ?? familyForWeight(flat.fontWeight);
      return React.cloneElement(element, {
        style: [{ fontFamily }, element.props.style, { fontWeight: undefined }],
      });
    };
  }
}

// Aplica o patch já na importação do módulo.
applyAppFont();
