import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter, useScrollToTop } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import React,
  { useRef, useState } from 'react';
import { ActivityIndicator,
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Text, TextInput } from '../../src/theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { hexWithAlpha } from '../../src/components/CategoryIcon';
import { PressableScale } from '../../src/components/PressableScale';
import { ReportExportModal } from '../../src/components/ReportExportModal';
import { useAuth } from '../../src/context/AuthContext';
import { useLedger } from '../../src/context/LedgerContext';
import { useI18n } from '../../src/i18n';
import { LANG_LABELS, LANGS } from '../../src/i18n/active';
import { CONTACT_EMAIL, FEEDBACK_FORM_URL } from '../../src/legal/content';
import { ThemePreference, useTheme } from '../../src/theme/ThemeContext';

export default function AjustesScreen() {
  const { colors, preference, setPreference } = useTheme();
  const { t, lang, setLang } = useI18n();
  const { session, signOut, deleteAccount } = useAuth();
  const { members, isShared, activeLedger } = useLedger();

  // Resumo da linha de Família: de quem é o caderno aberto ou quantas pessoas
  // acompanham o meu.
  const ativos = members.filter((m) => m.status === 'active').length;
  const resumoFamilia = isShared
    ? t.sharing.subtitleViewing(activeLedger?.ownerName || activeLedger?.ownerEmail || '')
    : ativos === 0
      ? t.sharing.subtitleNobody
      : t.sharing.subtitleCount(ativos);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [emailCopied, setEmailCopied] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const copyAnim = useRef(new Animated.Value(0)).current;

  // Tocar na aba já ativa volta ao topo em vez de não fazer nada.
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

  // Copia o e-mail de contato pro clipboard e dispara a animação de "copiado".
  async function copyContactEmail() {
    await Clipboard.setStringAsync(CONTACT_EMAIL);
    setEmailCopied(true);
    copyAnim.setValue(0);
    Animated.spring(copyAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    setTimeout(() => setEmailCopied(false), 1800);
  }

  // Só libera a exclusão quando a pessoa digita exatamente a palavra pedida.
  const canConfirmDelete =
    confirmText.trim().toLowerCase() === t.settings.deleteConfirmWord;

  // Avatar e nome vindos do Google (salvos no user_metadata pelo Supabase).
  const meta = (session?.user.user_metadata ?? {}) as Record<string, any>;
  const avatarUrl: string | undefined = meta.avatar_url ?? meta.picture;
  const displayName: string | undefined = meta.full_name ?? meta.name;

  function openDeleteModal() {
    setConfirmText('');
    setConfirmOpen(true);
  }

  function closeDeleteModal() {
    setConfirmOpen(false);
    setConfirmText('');
  }

  const themeOptions: { key: ThemePreference; label: string; icon: any }[] = [
    { key: 'light', label: t.settings.themeLight, icon: 'white-balance-sunny' },
    { key: 'dark', label: t.settings.themeDark, icon: 'weather-night' },
    { key: 'system', label: t.settings.themeSystem, icon: 'cellphone-cog' },
  ];

  async function runDelete() {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    if (error) {
      setConfirmOpen(false);
      Alert.alert(t.common.error, error);
    }
    // Em caso de sucesso, o signOut redireciona automaticamente para o login.
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.text }]}>{t.settings.title}</Text>

      {/* Tema */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        {t.settings.appearance}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.themeRow}>
          {themeOptions.map((opt) => {
            const active = preference === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => {
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

      {/* Idioma */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        {t.settings.language}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.themeRow}>
          {LANGS.map((code) => {
            const active = lang === code;
            return (
              <Pressable
                key={code}
                onPress={() => {
                  setLang(code);
                }}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor: active
                      ? hexWithAlpha(colors.primary, 0.14)
                      : colors.surface,
                    borderColor: active ? colors.primary : 'transparent',
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={code === 'en' ? 'alphabetical-variant' : 'translate'}
                  size={24}
                  color={active ? colors.primary : colors.textMuted}
                />
                <Text
                  style={[
                    styles.themeText,
                    { color: active ? colors.primary : colors.textMuted },
                  ]}
                >
                  {LANG_LABELS[code]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Conta */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        {t.settings.account}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card, gap: 4 }]}>
        <View style={styles.accountRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.linkIcon, { backgroundColor: colors.primarySoft }]}>
              <MaterialCommunityIcons name="account" size={22} color={colors.primary} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.linkTitle, { color: colors.text }]} numberOfLines={1}>
              {displayName ?? session?.user.email ?? t.settings.connected}
            </Text>
            <Text style={[styles.linkSub, { color: colors.textMuted }]} numberOfLines={1}>
              {displayName ? session?.user.email : t.settings.syncedInCloud}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={signOut}
          style={[styles.logoutBtn, { backgroundColor: colors.surface }]}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.text} />
          <Text style={[styles.logoutText, { color: colors.text }]}>{t.settings.signOut}</Text>
        </Pressable>
      </View>

      {/* Família: quem mais acompanha estes gastos, e de quem eu acompanho. */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        {t.sharing.section}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Pressable onPress={() => router.push('/familia')} style={styles.reportRow}>
          <View style={[styles.linkIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="account-multiple-outline" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.linkTitle, { color: colors.text }]}>{t.sharing.title}</Text>
            <Text style={[styles.linkSub, { color: colors.textMuted }]} numberOfLines={1}>
              {resumoFamilia}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Relatórios */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        {t.settings.reports}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Pressable onPress={() => setReportOpen(true)} style={styles.reportRow}>
          <View style={[styles.linkIcon, { backgroundColor: colors.primarySoft }]}>
            <MaterialCommunityIcons name="file-excel" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.linkTitle, { color: colors.text }]}>
              {t.settings.exportExcel}
            </Text>
            <Text style={[styles.linkSub, { color: colors.textMuted }]} numberOfLines={1}>
              {t.settings.exportExcelSub}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      {/* Sobre / Legal */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        {t.settings.about}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Pressable
          onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
          style={styles.aboutRow}
        >
          <MaterialCommunityIcons name="shield-lock-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.aboutText, { color: colors.text }]}>
            {t.settings.privacyPolicy}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable
          onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}
          style={styles.aboutRow}
        >
          <MaterialCommunityIcons name="file-document-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.aboutText, { color: colors.text }]}>
            {t.settings.termsOfUse}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable
          onPress={() => Linking.openURL(FEEDBACK_FORM_URL)}
          style={styles.aboutRow}
        >
          <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.aboutText, { color: colors.text }]}>
            {t.settings.feedback}
          </Text>
          <MaterialCommunityIcons name="open-in-new" size={18} color={colors.textMuted} />
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Pressable onPress={copyContactEmail} style={styles.aboutRow}>
          <MaterialCommunityIcons
            name={emailCopied ? 'check-circle' : 'email-outline'}
            size={20}
            color={emailCopied ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.aboutText, { color: emailCopied ? colors.primary : colors.text }]}>
            {emailCopied ? t.settings.emailCopied : t.settings.contactUs}
          </Text>
          <Animated.View
            style={{
              transform: [
                {
                  scale: emailCopied
                    ? copyAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] })
                    : 1,
                },
              ],
            }}
          >
            <MaterialCommunityIcons
              name={emailCopied ? 'check' : 'content-copy'}
              size={18}
              color={emailCopied ? colors.primary : colors.textMuted}
            />
          </Animated.View>
        </Pressable>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.aboutRow}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.textMuted} />
          <Text style={[styles.aboutText, { color: colors.text }]}>{t.settings.version}</Text>
          <Text style={[styles.aboutValue, { color: colors.textMuted }]}>{appVersion}</Text>
        </View>
      </View>

      {/* Zona de perigo */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
        {t.settings.dangerZone}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Pressable
          onPress={openDeleteModal}
          style={[styles.deleteBtn, { backgroundColor: colors.dangerSoft }]}
        >
          <MaterialCommunityIcons name="account-remove" size={20} color={colors.danger} />
          <Text style={[styles.deleteText, { color: colors.danger }]}>
            {t.settings.deleteAccount}
          </Text>
        </Pressable>
        <Text style={[styles.deleteHint, { color: colors.textMuted }]}>
          {t.settings.deleteHint}
        </Text>
      </View>

      <Text style={[styles.footerNote, { color: colors.textMuted }]}>
        {t.settings.footer}
      </Text>

      {/* Modal emocional de confirmação de exclusão */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !deleting && closeDeleteModal()}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalIcon, { backgroundColor: hexWithAlpha(colors.danger, 0.14) }]}>
              <Text style={styles.modalEmoji}>🥺</Text>
            </View>

            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t.settings.deleteModalTitle}
            </Text>
            <Text style={[styles.modalBody, { color: colors.textMuted }]}>
              {t.settings.deleteModalBody}
            </Text>
            <Text style={[styles.modalBody, { color: colors.textMuted }]}>
              {t.settings.deleteConfirmPrefix}{' '}
              <Text style={{ color: colors.danger, fontWeight: '800' }}>
                {t.settings.deleteConfirmWord}
              </Text>
              {t.settings.deleteConfirmSuffix}
            </Text>

            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              placeholder={t.settings.deleteConfirmWord}
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!deleting}
              style={[
                styles.confirmInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: canConfirmDelete ? colors.danger : colors.border,
                },
              ]}
            />

            <PressableScale
              onPress={closeDeleteModal}
              disabled={deleting}
              scaleTo={0.97}
              style={[styles.modalStay, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.modalStayText, { color: colors.onPrimary }]}>
                {t.settings.deleteStay}
              </Text>
            </PressableScale>

            <Pressable
              onPress={runDelete}
              disabled={deleting || !canConfirmDelete}
              style={styles.modalLeave}
            >
              {deleting ? (
                <ActivityIndicator color={colors.danger} />
              ) : (
                <Text
                  style={[
                    styles.modalLeaveText,
                    { color: canConfirmDelete ? colors.danger : colors.textMuted },
                  ]}
                >
                  {t.settings.deleteAnyway}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      <ReportExportModal
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        userEmail={session?.user.email}
      />
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
  avatar: { width: 42, height: 42, borderRadius: 21 },
  linkTitle: { fontSize: 16, fontWeight: '600' },
  linkSub: { fontSize: 13, marginTop: 2 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 46,
    borderRadius: 12,
  },
  logoutText: { fontSize: 16, fontWeight: '700' },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  aboutText: { flex: 1, fontSize: 15, fontWeight: '600' },
  aboutValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, opacity: 0.6 },
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
  confirmInput: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 6,
  },
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

