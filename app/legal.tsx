import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/theme/typography';
import { LAST_UPDATED, PRIVACY, TERMS } from '../src/legal/content';

export default function LegalScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { doc } = useLocalSearchParams<{ doc?: string }>();

  const isTerms = doc === 'terms';
  const title = isTerms ? 'Termos de Uso' : 'Política de Privacidade';
  const sections = isTerms ? TERMS : PRIVACY;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.updated, { color: colors.textMuted }]}>
          Última atualização: {LAST_UPDATED}
        </Text>

        {sections.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{s.title}</Text>
            {s.body.map((p, j) => (
              <Text key={j} style={[styles.paragraph, { color: colors.textMuted }]}>
                {p}
              </Text>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  content: {
    padding: 20,
    paddingBottom: 48,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  updated: { fontSize: 13, marginBottom: 18 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 6 },
  paragraph: { fontSize: 15, lineHeight: 22, marginBottom: 6 },
});
