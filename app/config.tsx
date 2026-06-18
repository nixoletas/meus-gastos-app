import {
  MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '../src/theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme/ThemeContext';

/** Mostrada quando faltam as variáveis do Supabase no arquivo .env. */
export default function ConfigScreen() {
  const { colors } = useTheme();

  const steps = [
    'Crie uma conta gratuita em supabase.com e um novo projeto.',
    'No painel do Supabase, abra o "SQL Editor" e rode o conteúdo do arquivo supabase/schema.sql.',
    'Vá em Project Settings > API e copie a "Project URL" e a chave "anon public".',
    'Copie o arquivo .env.example para .env e cole esses dois valores.',
    'Pare o servidor e rode novamente: npx expo start --clear',
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="cog" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Falta configurar o Supabase
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          O Meus Gastos usa o Supabase para login e sincronização entre o celular
          e a web. Siga os passos abaixo uma única vez:
        </Text>

        {steps.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.stepNum, { backgroundColor: colors.primary }]}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepText, { color: colors.text }]}>{step}</Text>
          </View>
        ))}

        <View style={[styles.code, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.codeText, { color: colors.textMuted }]}>
            EXPO_PUBLIC_SUPABASE_URL=...{'\n'}EXPO_PUBLIC_SUPABASE_ANON_KEY=...
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, maxWidth: 540, width: '100%', alignSelf: 'center' },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, lineHeight: 23, marginBottom: 24 },
  step: { flexDirection: 'row', gap: 12, marginBottom: 16, alignItems: 'flex-start' },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  stepText: { flex: 1, fontSize: 16, lineHeight: 23 },
  code: {
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  codeText: { fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
});
