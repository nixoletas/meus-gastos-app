import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useT } from '../i18n';
import { Text, TextInput } from '../theme/typography';
import { useTheme } from '../theme/ThemeContext';
import {
  extractUrl,
  isMapsUrl,
  mapsLinkFor,
  placeNameFromMapsUrl,
  resolvePlaceName,
} from '../utils/place';
import { normalizeText } from '../utils/text';

type Props = {
  place: string;
  placeUrl: string | null;
  onChangePlace: (value: string) => void;
  onChangePlaceUrl: (value: string | null) => void;
  /** Lugares já usados, do mais frequente pro menos. */
  suggestions: { name: string; url: string | null }[];
  readOnly?: boolean;
  onFocus?: () => void;
};

/**
 * "Onde foi o gasto": nome do estabelecimento ou link do Google Maps.
 *
 * Colar um link no próprio campo funciona — ele vai para o lugar certo e,
 * quando o link é o longo, o nome do lugar sai dele.
 */
export function PlaceField({
  place,
  placeUrl,
  onChangePlace,
  onChangePlaceUrl,
  suggestions,
  readOnly,
  onFocus,
}: Props) {
  const { colors } = useTheme();
  const t = useT();
  const [focused, setFocused] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function applyUrl(url: string, fallbackName?: string) {
    onChangePlaceUrl(url);
    const quick = placeNameFromMapsUrl(url);
    if (quick) {
      onChangePlace(quick);
      return;
    }
    if (fallbackName !== undefined) onChangePlace(fallbackName);
    // Link curto: o nome só aparece depois de seguir o redirecionamento.
    const resolved = await resolvePlaceName(url);
    if (resolved) onChangePlace(resolved);
  }

  function handleChange(text: string) {
    const url = extractUrl(text);
    if (url && isMapsUrl(url)) {
      // O "Compartilhar" do Maps manda "Nome do lugar\nhttps://maps.app.goo.gl/...".
      const rest = text.replace(url, '').replace(/\s+/g, ' ').trim();
      void applyUrl(url, rest);
      return;
    }
    onChangePlace(text);
  }

  async function pasteFromClipboard() {
    setNotice(null);
    const text = (await Clipboard.getStringAsync().catch(() => '')) ?? '';
    const url = extractUrl(text);
    if (url && isMapsUrl(url)) {
      const rest = text.replace(url, '').replace(/\s+/g, ' ').trim();
      await applyUrl(url, rest || place);
    } else {
      setNotice(t.place.clipboardEmpty);
    }
  }

  const openLink = mapsLinkFor(place, placeUrl);

  // Sugestões só enquanto digita, e sem repetir o que já está escrito.
  const visibleSuggestions = useMemo(() => {
    if (!focused || readOnly) return [];
    const q = normalizeText(place);
    return suggestions
      .filter((s) => {
        const n = normalizeText(s.name);
        return n !== q && (!q || n.includes(q));
      })
      .slice(0, 6);
  }, [focused, place, suggestions, readOnly]);

  return (
    <View style={{ gap: 8 }}>
      <View
        style={[
          styles.inputWrap,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <MaterialCommunityIcons name="map-marker-outline" size={20} color={colors.textMuted} />
        <TextInput
          value={place}
          editable={!readOnly}
          onChangeText={handleChange}
          onFocus={() => {
            setFocused(true);
            onFocus?.();
          }}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={t.place.placeholder}
          placeholderTextColor={colors.textMuted}
          maxLength={120}
          style={[styles.input, { color: colors.text }]}
        />
        {!!place && !readOnly && (
          <Pressable hitSlop={10} onPress={() => onChangePlace('')}>
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {visibleSuggestions.length > 0 && (
        <View style={styles.chips}>
          {visibleSuggestions.map((s) => (
            <Pressable
              key={s.name}
              onPress={() => {
                onChangePlace(s.name);
                if (s.url && !placeUrl) onChangePlaceUrl(s.url);
              }}
              style={[styles.chip, { backgroundColor: colors.surface }]}
            >
              <MaterialCommunityIcons name="history" size={14} color={colors.textMuted} />
              <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>
                {s.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.chips}>
        {placeUrl ? (
          <View style={[styles.chip, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="google-maps" size={15} color={colors.primary} />
            <Text style={[styles.chipText, { color: colors.primary }]}>{t.place.linkSaved}</Text>
            {!readOnly && (
              <Pressable hitSlop={10} onPress={() => onChangePlaceUrl(null)}>
                <MaterialCommunityIcons name="close" size={15} color={colors.primary} />
              </Pressable>
            )}
          </View>
        ) : (
          !readOnly &&
          Platform.OS !== 'web' && (
            <Pressable
              onPress={pasteFromClipboard}
              style={[styles.chip, { backgroundColor: colors.surface }]}
            >
              <MaterialCommunityIcons name="content-paste" size={15} color={colors.textMuted} />
              <Text style={[styles.chipText, { color: colors.text }]}>{t.place.pasteLink}</Text>
            </Pressable>
          )
        )}
        {openLink && (
          <Pressable
            onPress={() => Linking.openURL(openLink).catch(() => {})}
            style={[styles.chip, { backgroundColor: colors.surface }]}
          >
            <MaterialCommunityIcons name="open-in-new" size={15} color={colors.textMuted} />
            <Text style={[styles.chipText, { color: colors.text }]}>
              {placeUrl ? t.place.openMaps : t.place.findOnMaps}
            </Text>
          </Pressable>
        )}
      </View>

      {!!notice && <Text style={[styles.notice, { color: colors.textMuted }]}>{notice}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
    maxWidth: '100%',
  },
  chipText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  notice: { fontSize: 12 },
});
