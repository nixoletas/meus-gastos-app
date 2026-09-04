import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLedger } from '../context/LedgerContext';
import { useT } from '../i18n';
import { useTheme } from '../theme/ThemeContext';
import { Text } from '../theme/typography';
import { hexWithAlpha } from './CategoryIcon';

/**
 * Faixa de "você está no caderno de outra pessoa".
 *
 * Sem ela, um gasto lançado no caderno errado é indistinguível de um lançado no
 * próprio — o app inteiro tem exatamente a mesma cara nos dois casos.
 */
export function SharedLedgerBanner() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const { isShared, activeLedger, role, revokedNotice, clearRevokedNotice } = useLedger();

  if (revokedNotice !== null) {
    return (
      <Pressable
        onPress={clearRevokedNotice}
        style={[styles.wrap, { backgroundColor: hexWithAlpha(colors.warning, 0.16) }]}
      >
        <MaterialCommunityIcons name="account-cancel-outline" size={16} color={colors.warning} />
        <Text style={[styles.text, { color: colors.text }]} numberOfLines={2}>
          {t.sharing.revokedNotice(revokedNotice)}
        </Text>
        <MaterialCommunityIcons name="close" size={16} color={colors.textMuted} />
      </Pressable>
    );
  }

  if (!isShared || !activeLedger) return null;

  const nome = activeLedger.ownerName || activeLedger.ownerEmail;

  return (
    <Pressable
      onPress={() => router.push('/familia')}
      style={[styles.wrap, { backgroundColor: hexWithAlpha(colors.primary, 0.14) }]}
    >
      <MaterialCommunityIcons name="eye-outline" size={16} color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]} numberOfLines={1}>
        {t.sharing.viewingBanner(nome)}
        {role === 'viewer' ? ` · ${t.sharing.readOnlyBadge}` : ''}
      </Text>
      <MaterialCommunityIcons name="swap-horizontal" size={16} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  text: { flex: 1, fontSize: 13, fontWeight: '600' },
});
