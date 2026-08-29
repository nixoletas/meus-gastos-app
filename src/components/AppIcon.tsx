import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BRAND_ICONS } from '../data/brandIcons';
import { emojiChar, isEmojiIcon } from '../data/emojis';

type Props = {
  /** Nome do ícone: glyph do MaterialCommunityIcons ou "brand:<marca>". */
  icon: string;
  size: number;
  color: string;
};

/**
 * Renderiza um ícone do app, suportando três tipos:
 *  - "emoji:🍕" => emoji escolhido (ou colado) pelo usuário
 *  - "brand:netflix" => logo de marca (path SVG do simple-icons)
 *  - "silverware-fork-knife" => ícone do MaterialCommunityIcons
 */
export function AppIcon({ icon, size, color }: Props) {
  // Emoji tem cor própria; `color` não se aplica.
  if (isEmojiIcon(icon)) {
    return (
      <Text
        allowFontScaling={false}
        style={{ fontSize: size * 0.86, lineHeight: size * 1.1, textAlign: 'center' }}
      >
        {emojiChar(icon)}
      </Text>
    );
  }
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
