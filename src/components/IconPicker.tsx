import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import React,
  { useMemo,
  useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '../theme/typography';
import { AppIconName, searchIcons } from '../data/icons';
import { useTheme } from '../theme/ThemeContext';
import { AppIcon } from './AppIcon';
import { hexWithAlpha } from './CategoryIcon';

type Props = {
  visible: boolean;
  selected: AppIconName;
  color: string;
  onSelect: (icon: AppIconName) => void;
  onClose: () => void;
};

/** Modal com busca para escolher o ícone de uma categoria. */
export function IconPicker({ visible, selected, color, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const results = useMemo(() => searchIcons(query), [query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Escolha um ícone
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar ícone (ex.: comida, carro...)"
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => item.name}
            numColumns={5}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textMuted }]}>
                Nenhum ícone encontrado.
              </Text>
            }
            renderItem={({ item }) => {
              const isSel = item.name === selected;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item.name);
                    onClose();
                  }}
                  style={[
                    styles.iconCell,
                    {
                      backgroundColor: isSel
                        ? hexWithAlpha(color, 0.18)
                        : colors.surface,
                      borderColor: isSel ? color : 'transparent',
                    },
                  ]}
                >
                  <AppIcon
                    icon={item.name}
                    size={26}
                    color={isSel ? color : colors.text}
                  />
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 16, height: '100%' },
  grid: { paddingBottom: 12 },
  gridRow: { gap: 10, marginBottom: 10 },
  iconCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  empty: { textAlign: 'center', marginTop: 24, fontSize: 15 },
});
