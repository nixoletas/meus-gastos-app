import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { hexWithAlpha } from '../src/components/CategoryIcon';
import { Ledger, useLedger } from '../src/context/LedgerContext';
import { useT } from '../src/i18n';
import { useTheme } from '../src/theme/ThemeContext';
import { Text, TextInput } from '../src/theme/typography';
import { HouseholdMember } from '../src/types';

/** Como a pessoa aparece na lista: nome do Google quando já entrou, senão o e-mail. */
function memberLabel(m: HouseholdMember): string {
  return m.member_name || m.invited_email;
}

function ledgerLabel(l: Ledger, meuCaderno: string): string {
  if (l.role === 'owner') return meuCaderno;
  return l.ownerName || l.ownerEmail;
}

export default function FamiliaScreen() {
  const { colors } = useTheme();
  const t = useT();
  const router = useRouter();
  const {
    ledgers,
    members,
    ownerId,
    loading,
    invite,
    changeRole,
    revoke,
    leave,
    setActiveLedger,
  } = useLedger();

  const [email, setEmail] = useState('');
  const [novoPapel, setNovoPapel] = useState<'viewer' | 'editor'>('viewer');
  const [convidando, setConvidando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aRemover, setARemover] = useState<HouseholdMember | null>(null);
  const [aSair, setASair] = useState<Ledger | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const donos = ledgers.filter((l) => l.role !== 'owner');

  /** A mensagem vem do SQLSTATE traduzido pelo LedgerContext. */
  const mensagemDeErro = (chave: string) =>
    (t.sharing.errors as Record<string, string>)[chave] ?? t.sharing.errors.generic;

  async function handleInvite() {
    const valor = email.trim();
    if (!valor || convidando) return;
    setConvidando(true);
    setErro(null);
    const { error } = await invite(valor, novoPapel);
    setConvidando(false);
    if (error) {
      setErro(mensagemDeErro(error));
      return;
    }
    setEmail('');
    setNovoPapel('viewer');
  }

  async function handleRevoke() {
    if (!aRemover) return;
    setOcupado(true);
    await revoke(aRemover.id);
    setOcupado(false);
    setARemover(null);
  }

  async function handleLeave() {
    if (!aSair) return;
    setOcupado(true);
    await leave(aSair.ownerId);
    setOcupado(false);
    setASair(null);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {t.sharing.title}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Cadernos que posso abrir. Só aparece quando há mais de um: com um
              caderno só, uma lista de um item é ruído. */}
          {donos.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
                {t.sharing.myLedgers}
              </Text>
              <View style={[styles.card, { backgroundColor: colors.card }]}>
                {ledgers.map((l, index) => {
                  const aberto = l.ownerId === ownerId;
                  return (
                    <View
                      key={l.ownerId}
                      style={[
                        styles.row,
                        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                      ]}
                    >
                      <Pressable
                        style={styles.rowMain}
                        onPress={() => {
                          void setActiveLedger(l.ownerId);
                        }}
                      >
                        <MaterialCommunityIcons
                          name={aberto ? 'radiobox-marked' : 'radiobox-blank'}
                          size={22}
                          color={aberto ? colors.primary : colors.textMuted}
                        />
                        <View style={styles.rowText}>
                          <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                            {ledgerLabel(l, t.sharing.myLedger)}
                          </Text>
                          <Text style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
                            {l.role === 'owner'
                              ? t.sharing.roleOwner
                              : l.role === 'editor'
                                ? t.sharing.roleEditor
                                : t.sharing.roleViewer}
                            {aberto ? ` · ${t.sharing.active}` : ''}
                          </Text>
                        </View>
                      </Pressable>
                      {l.role !== 'owner' && (
                        <Pressable onPress={() => setASair(l)} hitSlop={10} style={styles.iconBtn}>
                          <MaterialCommunityIcons name="exit-to-app" size={20} color={colors.danger} />
                        </Pressable>
                      )}
                    </View>
                  );
                })}
              </View>
            </>
          )}

          {/* Quem eu convidei para o meu caderno. */}
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            {t.sharing.whoSees}
          </Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {loading && members.length === 0 ? (
              <View style={styles.empty}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : members.length === 0 ? (
              <View style={styles.empty}>
                <Text style={[styles.rowSub, { color: colors.textMuted }]}>
                  {t.sharing.emptyMembers}
                </Text>
              </View>
            ) : (
              members.map((m, index) => (
                <View
                  key={m.id}
                  style={[
                    styles.row,
                    index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
                  ]}
                >
                  <View style={styles.rowMain}>
                    <MaterialCommunityIcons
                      name={m.status === 'pending' ? 'email-outline' : 'account-circle-outline'}
                      size={22}
                      color={colors.textMuted}
                    />
                    <View style={styles.rowText}>
                      <Text style={[styles.rowTitle, { color: colors.text }]} numberOfLines={1}>
                        {memberLabel(m)}
                      </Text>
                      <Text style={[styles.rowSub, { color: colors.textMuted }]} numberOfLines={1}>
                        {m.status === 'pending' ? `${t.sharing.pending} · ` : ''}
                        {m.invited_email}
                      </Text>
                    </View>
                  </View>

                  {/* Um toque alterna entre só leitura e edição. */}
                  <Pressable
                    onPress={() => {
                      void changeRole(m.id, m.role === 'editor' ? 'viewer' : 'editor');
                    }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          m.role === 'editor' ? hexWithAlpha(colors.primary, 0.16) : colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: m.role === 'editor' ? colors.primary : colors.textMuted },
                      ]}
                    >
                      {m.role === 'editor' ? t.sharing.roleEditor : t.sharing.roleViewer}
                    </Text>
                  </Pressable>

                  <Pressable onPress={() => setARemover(m)} hitSlop={10} style={styles.iconBtn}>
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={20}
                      color={colors.danger}
                    />
                  </Pressable>
                </View>
              ))
            )}
          </View>

          {/* Convite novo. */}
          <View style={[styles.card, styles.inviteCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.label, { color: colors.text }]}>
              {t.sharing.inviteEmailLabel}
            </Text>
            <TextInput
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                setErro(null);
              }}
              placeholder={t.sharing.inviteEmailPlaceholder}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              inputMode="email"
              style={[
                styles.input,
                { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border },
              ]}
            />

            <Text style={[styles.label, { color: colors.text }]}>
              {t.sharing.invitePermission}
            </Text>
            <View style={styles.papelRow}>
              {(['viewer', 'editor'] as const).map((papel) => {
                const ativo = novoPapel === papel;
                return (
                  <Pressable
                    key={papel}
                    onPress={() => setNovoPapel(papel)}
                    style={[
                      styles.papelBtn,
                      {
                        backgroundColor: ativo ? colors.primary : colors.surface,
                        borderColor: ativo ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.papelText,
                        { color: ativo ? colors.onPrimary : colors.textMuted },
                      ]}
                    >
                      {papel === 'editor' ? t.sharing.roleEditor : t.sharing.roleViewer}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {!!erro && <Text style={[styles.erro, { color: colors.danger }]}>{erro}</Text>}

            <Pressable
              onPress={handleInvite}
              disabled={!email.trim() || convidando}
              style={[
                styles.inviteBtn,
                {
                  backgroundColor: email.trim() ? colors.primary : colors.surface,
                  opacity: convidando ? 0.7 : 1,
                },
              ]}
            >
              {convidando ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="account-plus-outline"
                    size={18}
                    color={email.trim() ? colors.onPrimary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.inviteBtnText,
                      { color: email.trim() ? colors.onPrimary : colors.textMuted },
                    ]}
                  >
                    {t.sharing.inviteButton}
                  </Text>
                </>
              )}
            </Pressable>

            <Text style={[styles.hint, { color: colors.textMuted }]}>{t.sharing.inviteHint}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={aRemover !== null}
        title={t.sharing.revokeConfirmTitle}
        message={aRemover ? t.sharing.revokeConfirmBody(memberLabel(aRemover)) : ''}
        confirmLabel={t.sharing.revoke}
        busy={ocupado}
        icon="account-remove-outline"
        onConfirm={handleRevoke}
        onCancel={() => setARemover(null)}
      />

      <ConfirmDialog
        visible={aSair !== null}
        title={t.sharing.leaveConfirmTitle}
        message={aSair ? t.sharing.leaveConfirmBody(ledgerLabel(aSair, t.sharing.myLedger)) : ''}
        confirmLabel={t.sharing.leave}
        busy={ocupado}
        icon="exit-to-app"
        onConfirm={handleLeave}
        onCancel={() => setASair(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  content: { padding: 16, paddingBottom: 48, gap: 8 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginTop: 14,
    marginBottom: 2,
  },
  card: { borderRadius: 18, overflow: 'hidden' },
  inviteCard: { padding: 14, gap: 8, marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600' },
  rowSub: { fontSize: 13, marginTop: 1 },
  iconBtn: { padding: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '700' },
  empty: { padding: 16, alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  papelRow: { flexDirection: 'row', gap: 8 },
  papelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  papelText: { fontSize: 14, fontWeight: '600' },
  inviteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  inviteBtnText: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 17 },
  erro: { fontSize: 13, fontWeight: '600' },
});
