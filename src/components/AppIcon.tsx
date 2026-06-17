import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { BRAND_ICONS } from '../data/brandIcons';

type Props = {
  /** Nome do ícone: glyph do MaterialCommunityIcons ou "brand:<marca>". */
  icon: string;
  size: number;
  color: string;
};

/**
 * Renderiza um ícone do app, suportando dois tipos:
 *  - "brand:netflix" => logo de marca (path SVG do simple-icons)
 *  - "silverware-fork-knife" => ícone do MaterialCommunityIcons
 */
export function AppIcon({ icon, size, color }: Props) {
  if (icon.startsWith('brand:')) {
    const brand = BRAND_ICONS[icon.slice(6)];
    if (brand) {
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d={brand.path} fill={color} />
        </Svg>
      );
    }
  }
  return (
    <MaterialCommunityIcons name={icon as any} size={size} color={color} />
  );
}
