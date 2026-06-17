import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { categoryPalette } from '../theme/colors';

type Props = {
  selected: string;
  onSelect: (color: string) => void;
};

/** Linha de cores para escolher a cor da categoria. */
export function ColorPicker({ selected, onSelect }: Props) {
  return (
    <View style={styles.row}>
      {categoryPalette.map((color) => {
        const isSel = color.toLowerCase() === selected.toLowerCase();
        return (
          <Pressable
            key={color}
            onPress={() => onSelect(color)}
            style={[styles.swatch, { backgroundColor: color }]}
          >
            {isSel && (
              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
