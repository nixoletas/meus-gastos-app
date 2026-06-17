import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '../../src/components/AppIcon';
import { CategoryIcon, hexWithAlpha } from '../../src/components/CategoryIcon';
import { PressableScale } from '../../src/components/PressableScale';
import { useData } from '../../src/context/DataContext';
import { normalize } from '../../src/data/icons';
import { useTheme } from '../../src/theme/ThemeContext';
import { CategoryWithSubs } from '../../src/types';
import { tapLight } from '../../src/utils/haptics';

export default function CategoriasScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { categoriesWithSubs } = useData();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return categoriesWithSubs;
    return categoriesWithSubs
      .map((cat) => {
        const catMatches = normalize(cat.name).includes(q);
        const subs = cat.subcategories.filter((s) =>
          normalize(s.name).includes(q)
        );
        if (catMatches) return cat; // mostra todas as subs da categoria que casa
        if (subs.length > 0) return { ...cat, subcategories: subs };
        return null;
      })
      .filter((c): c is CategoryWithSubs => c !== null);
  }, [categoriesWithSubs, query]);

  const renderItem = ({ item }: { item: CategoryWithSubs }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Pressable
        style={styles.cardHeader}
        onPress={() => router.push({ pathname: '/categoria', params: { id: item.id } })}
      >
        <CategoryIcon icon={item.icon} color={item.color} size={46} />
        <Text style={[styles.cardName, { color: colors.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        <MaterialCommunityIcons name="pencil" size={18} color={colors.textMuted} />
      </Pressable>

      <View style={styles.subsWrap}>
        {item.subcategories.map((sub) => (
          <Pressable
            key={sub.id}
            onPress={() => router.push({ pathname: '/categoria', params: { id: sub.id } })}
            style={[styles.subChip, { backgroundColor: hexWithAlpha(item.color, 0.12) }]}
          >
            <AppIcon icon={sub.icon} size={15} color={item.color} />
            <Text style={[styles.subChipText, { color: colors.text }]}>{sub.name}</Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() =>
            router.push({ pathname: '/categoria', params: { parentId: item.id } })
          }
          style={[styles.subChip, { borderColor: colors.border, borderWidth: 1.5 }]}
        >
          <MaterialCommunityIcons name="plus" size={15} color={colors.textMuted} />
          <Text style={[styles.subChipText, { color: colors.textMuted }]}>Adicionar</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Cabeçalho fixo (fora do FlatList) para o teclado não fechar ao digitar. */}
      <View style={styles.fixedHeader}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>Categorias</Text>
          <PressableScale
            onPress={() => {
              tapLight();
              router.push('/categoria');
            }}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.onPrimary} />
            <Text style={[styles.addBtnText, { color: colors.onPrimary }]}>Nova</Text>
          </PressableScale>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar categoria ou subcategoria"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.text }]}
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        ListEmptyComponent={
          query.trim().length > 0 ? (
            <PressableScale
              onPress={() => {
                tapLight();
                router.push({ pathname: '/categoria', params: { name: query.trim() } });
              }}
              style={[styles.suggestCard, { backgroundColor: colors.card, borderColor: colors.primary }]}
            >
              <View style={[styles.suggestIcon, { backgroundColor: hexWithAlpha(colors.primary, 0.16) }]}>
                <MaterialCommunityIcons name="plus" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.suggestTitle, { color: colors.text }]}>
                  Criar “{query.trim()}”
                </Text>
                <Text style={[styles.suggestText, { color: colors.textMuted }]}>
                  Nenhuma categoria encontrada. Toque para criar uma nova com esse nome.
                </Text>
              </View>
            </PressableScale>
          ) : (
            <Text style={[styles.empty, { color: colors.textMuted }]}>
              Nenhuma categoria ainda.
            </Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 140,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  fixedHeader: {
    gap: 14,
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  addBtnText: { fontSize: 15, fontWeight: '700' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: { flex: 1, fontSize: 16, height: '100%' },
  card: { borderRadius: 18, padding: 14, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardName: { flex: 1, fontSize: 17, fontWeight: '700' },
  subsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
  },
  subChipText: { fontSize: 13, fontWeight: '500' },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 15 },
  suggestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 8,
  },
  suggestIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestTitle: { fontSize: 16, fontWeight: '700' },
  suggestText: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
