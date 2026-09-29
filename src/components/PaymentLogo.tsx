import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BANK_LOGOS } from '../data/bankLogos';
import { getProvider, KIND_ICONS } from '../data/paymentProviders';
import { PaymentKind } from '../types';
import { hexWithAlpha } from './CategoryIcon';

type Props = {
  /** Chave do logo: banco ("nubank") ou genérico ("dinheiro"). */
  provider: string | null | undefined;
  /** Cor de fundo quando não há logo de banco. */
  color?: string;
  /** Usado no ícone quando não há instituição. */
  kind?: PaymentKind;
  size?: number;
};

/**
 * Logo do meio de pagamento.
 *
 * Banco vai num quadrado branco arredondado — os logos têm cor própria e
 * sumiriam no tema escuro. Genérico vira ícone sobre a cor suave, no mesmo
 * estilo do `CategoryIcon`.
 */
export function PaymentLogo({ provider, color, kind, size = 36 }: Props) {
  const logo = provider ? BANK_LOGOS[provider] : undefined;
  const radius = Math.round(size * 0.28);

  if (logo) {
    const pad = Math.round(size * 0.14);
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: '#FFFFFF',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(15, 23, 42, 0.08)',
        }}
      >
        <SvgXml xml={logo.xml} width={size - pad * 2} height={size - pad * 2} />
      </View>
    );
  }

  const generic = getProvider(provider);
  const tint = color ?? generic?.color ?? '#64748B';
  const icon = generic?.icon ?? (kind ? KIND_ICONS[kind] : 'wallet-outline');
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: hexWithAlpha(tint, 0.16),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name={icon as any} size={Math.round(size * 0.56)} color={tint} />
    </View>
  );
}
