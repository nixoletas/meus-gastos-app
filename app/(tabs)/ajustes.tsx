import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hexWithAlpha } from '../../src/components/CategoryIcon';
import { PressableScale } from '../../src/components/PressableScale';
import { useAuth } from '../../src/context/AuthContext';
import { ThemePreference, useTheme } from '../../src/theme/ThemeContext';
import { notifyWarning, tapLight } from '../../src/utils/haptics';

export default function AjustesScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { session, signOut, deleteAccount } = useAuth();
  const insets = useSafeAreaInsets();
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const themeOptions: { key: ThemePreference; label: string; icon: any }[] = [
    { key: 'light', label: 'Claro', icon: 'white-balance-sunny' },
    { key: 'dark', label: 'Escuro', icon: 'weather-night' },
    { key: 'system', label: 'Sistema', icon: 'cellphone-cog' },
  ];

  async function runDelete() {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      notifyWarning();
      setConfirmOpen(false);
      if (Platform.OS === 'web') window.alert(error);
      else Alert.alert('Erro', error);
    }
    // Em caso de sucesso, o signOut redireciona automaticamente para o login.
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>Ajustes</Text>

      {/* Tema */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APARÊNCIA</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.themeRow}>
          {themeOptions.map((opt) => {
            const active = preference === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
                  tapLight();
                  setPreference(opt.key);
                }}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: active ? hexWithAlpha(colors.primary, 0.14) : colors.surface,
                    borderColor: active ? colors.primary : 'transparent',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={opt.icon}
                  size={24}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.themeText,
                    { color: active ? colors.primary : colors.textMuted },
                  ]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Conta */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>CONTA</Text>
      <View style={[styles.card, { backgroundColor: colors.card, gap: 4 }]}>
        <View style={styles.accountRow}>
          <View style={[styles.linkIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="account" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.linkTitle, { color: colors.text }]} numberOfLines={1}>
              {session?.user.email ?? 'Conectado'}
            </Text>
            <Text style={[styles.linkSub, { color: colors.textMuted }]}>
              Sincronizado na nuvem
            </Text>
          </View>
        </View>

        <Pressable
          onPress={signOut}
          style={[styles.logoutBtn, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.text} />
          <Text style={[styles.logoutText, { color: colors.text }]}>Sair</Text>
        </Pressable>
      </View>

      {/* Zona de perigo */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ZONA DE PERIGO</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Pressable
          onPress={() => {
            tapLight();
            setConfirmOpen(true);
          }}
          style={[styles.deleteBtn, { backgroundColor: colors.dangerSoft }]}
        >
          <MaterialCommunityIcons name="account-remove" size={20} color={colors.danger} />
          <Text style={[styles.deleteText, { color: colors.danger }]}>Excluir conta</Text>
        </Pressable>
        <Text style={[styles.deleteHint, { color: colors.textMuted }]}>
          Apaga permanentemente sua conta e todos os dados (gastos, categorias e
          limites).
        </Text>
      </View>

      <Text style={[styles.footerNote, { color: colors.textMuted }]}>
        Meus Gastos · feito no Brasil 🇧🇷
      </Text>

      {/* Modal emocional de confirmação de exclusão */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && setConfirmOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: hexWithAlpha(colors.danger, 0.14) }]}>
              <Text style={styles.modalEmoji}>🥺</Text>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Já vai mesmo? Vamos sentir sua falta...
            </Text>
            <Text style={[styles.modalBody, { color: colors.textMuted }]}>
              A gente acompanhou cada gasto seu com carinho. Se você excluir sua
              conta, todo esse histórico — seus gastos, categorias e limites — vai
              desaparecer para sempre, e não tem como voltar atrás. 💔
            </Text>
            <Text style={[styles.modalBody, { color: colors.textMuted }]}>
              Tem certeza que é isso mesmo que você quer?
            </Text>

            <PressableScale
              onPress={() => {
                tapLight();
                setConfirmOpen(false);
              }}
              disabled={deleting}
              scaleTo={0.97}
              style={[styles.modalStay, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalStayText, { color: colors.onPrimary }]}>
                Quero ficar 💚
              </Text>
            </PressableScale>

            <Pressable onPress={runDelete} disabled={deleting} style={styles.modalLeave}>
              {deleting ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <Text style={[styles.modalLeaveText, { color: colors.danger }]}>
                  Excluir minha conta mesmo assim
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 140,
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { borderRadius: 18, padding: 14 },
  themeRow: { flexDirection: 'row', gap: 10 },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  themeText: { fontSize: 14, fontWeight: '600' },
  linkIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { fontSize: 16, fontWeight: '600' },
  linkSub: { fontSize: 13, marginTop: 2 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
  },
  logoutText: { fontSize: 16, fontWeight: '700' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  deleteText: { fontSize: 16, fontWeight: '700' },
  deleteHint: { fontSize: 13, marginTop: 10, lineHeight: 19, textAlign: 'center' },
  footerNote: { textAlign: 'center', marginTop: 30, fontSize: 13 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 26,
    padding: 24,
    alignItems: 'center',
  },
  modalIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalEmoji: { fontSize: 40 },
  modalTitle: { fontSize: 21, fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  modalBody: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 10 },
  modalStay: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  modalStayText: { fontSize: 17, fontWeight: '800' },
  modalLeave: { height: 48, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  modalLeaveText: { fontSize: 15, fontWeight: '600' },
});

