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
import {
  EMOJI_PREFIX,
  EmojiEntry,
  isEmojiIcon,
  looksLikeEmoji,
  searchEmojis,
  toEmojiIcon,
} from '../data/emojis';
import { AppIconName, CatalogIcon, normalize, searchIcons } from '../data/icons';
import { useT } from '../i18n';
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

type Tab = 'icons' | 'emojis';

/** Modal com busca para escolher o ícone de uma categoria. */
export function IconPicker({ visible, selected, color, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [tab, setTab] = useState<Tab>(() => (isEmojiIcon(selected) ? 'emojis' : 'icons'));
  const [query, setQuery] = useState('');
  const [pasted, setPasted] = useState('');

  const icons = useMemo(() => (tab === 'icons' ? searchIcons(query) : []), [tab, query]);
  const emojis = useMemo(
    () => (tab === 'emojis' ? searchEmojis(query, normalize) : []),
    [tab, query]
  );
  const total = tab === 'icons' ? icons.length : emojis.length;

  function choose(icon: AppIconName) {
    onSelect(icon);
    onClose();
  }

  function usePasted() {
    const char = pasted.trim();
    if (!looksLikeEmoji(char)) return;
    setPasted('');
    choose(toEmojiIcon(char));
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'icons', label: t.iconPicker.tabIcons },
    { key: 'emojis', label: t.iconPicker.tabEmojis },
  ];

  const renderIcon = ({ item }: { item: CatalogIcon }) => {
    const isSel = item.name === selected;
    return (
      <Pressable
        onPress={() => choose(item.name)}
        style={[
          styles.iconCell,
          {
            backgroundColor: isSel ? hexWithAlpha(color, 0.18) : colors.surface,
            borderColor: isSel ? color : 'transparent',
          },
        ]}
      >
        <AppIcon icon={item.name} size={26} color={isSel ? color : colors.text} />
      </Pressable>
    );
  };

  const renderEmoji = ({ item }: { item: EmojiEntry }) => {
    const name = EMOJI_PREFIX + item.char;
    const isSel = name === selected;
    return (
      <Pressable
        onPress={() => choose(name)}
        style={[
          styles.iconCell,
          {
            backgroundColor: isSel ? hexWithAlpha(color, 0.18) : colors.surface,
            borderColor: isSel ? color : 'transparent',
          },
        ]}
      >
        <AppIcon icon={name} size={26} color={colors.text} />
      </Pressable>
    );
  };

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
              {t.iconPicker.title}
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <MaterialCommunityIcons name="close" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.tabRow}>
            <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
              {tabs.map((item) => {
                const active = tab === item.key;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => {
                      setTab(item.key);
                      setQuery('');
                    }}
                    style={[
                      styles.tab,
                      active && { backgroundColor: hexWithAlpha(colors.primary, 0.16) },
                    ]}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: active ? colors.primary : colors.textMuted },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={[styles.count, { color: colors.textMuted }]}>
              {t.iconPicker.count(total)}
            </Text>
          </View>

          <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                tab === 'icons'
                  ? t.iconPicker.searchPlaceholder
                  : t.iconPicker.emojiSearchPlaceholder
              }
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.text }]}
              autoCorrect={false}
            />
          </View>

          {tab === 'icons' ? (
            <FlatList
              data={icons}
              keyExtractor={(item) => item.name}
              numColumns={5}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                  {t.iconPicker.empty}
                </Text>
              }
              renderItem={renderIcon}
            />
          ) : (
            <FlatList
              data={emojis}
              keyExtractor={(item) => item.char}
              numColumns={5}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.grid}
              columnWrapperStyle={styles.gridRow}
              ListEmptyComponent={
                <Text style={[styles.empty, { color: colors.textMuted }]}>
                  {t.iconPicker.emojiEmpty}
                </Text>
              }
              renderItem={renderEmoji}
            />
          )}

          {/* A lista é um atalho; qualquer emoji do teclado serve. */}
          {tab === 'emojis' && (
            <View style={styles.pasteRow}>
              <TextInput
                value={pasted}
                onChangeText={setPasted}
                onSubmitEditing={usePasted}
                placeholder={t.iconPicker.pasteEmoji}
                placeholderTextColor={colors.textMuted}
                style={[
                  styles.pasteInput,
                  { backgroundColor: colors.surface, color: colors.text },
                ]}
              />
              <Pressable
                onPress={usePasted}
                disabled={!looksLikeEmoji(pasted)}
                style={[
                  styles.pasteBtn,
                  {
                    backgroundColor: colors.primary,
                    opacity: looksLikeEmoji(pasted) ? 1 : 0.4,
                  },
                ]}
              >
                <Text style={[styles.pasteBtnText, { color: colors.onPrimary }]}>
                  {t.iconPicker.use}
                </Text>
              </Pressable>
            </View>
          )}
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
  tabRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  tabs: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9 },
  tabText: { fontSize: 13, fontWeight: '700' },
  count: { marginLeft: 'auto', fontSize: 12 },
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
  pasteRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pasteInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  pasteBtn: {
    height: 46,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pasteBtnText: { fontSize: 15, fontWeight: '700' },
});
