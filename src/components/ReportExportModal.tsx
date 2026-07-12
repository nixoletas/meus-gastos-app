import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { hexWithAlpha } from './CategoryIcon';
import { PressableScale } from './PressableScale';
import { useTheme } from '../theme/ThemeContext';
import { Text } from '../theme/typography';
import { supabase } from '../lib/supabase';
import { monthName } from '../utils/date';

type Kind = 'month' | 'year';

type Props = {
  visible: boolean;
  onClose: () => void;
  userEmail?: string | null;
};

type ReportResult = {
  ok: boolean;
  filename: string;
  total: number;
  count: number;
  xlsxBase64: string;
  error?: string;
};

export function ReportExportModal({ visible, onClose, userEmail }: Props) {
  const { colors } = useTheme();
  const now = new Date();
  const [kind, setKind] = useState<Kind>('month');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [busy, setBusy] = useState<null | 'email' | 'download'>(null);

  function shiftPeriod(delta: number) {
    if (kind === 'year') {
      setYear((y) => y + delta);
      return;
    }
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m);
    setYear(y);
  }

  const label = kind === 'year' ? String(year) : `${monthName(month)} de ${year}`;

  async function generate(send: boolean): Promise<ReportResult | null> {
    const { data, error } = await supabase.functions.invoke<ReportResult>('export-report', {
      body: { period: kind, year, month: month + 1, send },
    });
    if (error) {
      // Erros da função vêm no corpo da resposta; tentamos extrair a mensagem.
      let msg = error.message;
      try {
        const ctx = (error as any).context;
        if (ctx?.json) { const b = await ctx.json(); msg = b?.error ?? msg; }
      } catch { /* ignore */ }
      Alert.alert('Ops', msg ?? 'Não consegui gerar o relatório.');
      return null;
    }
    if (!data?.ok) {
      Alert.alert('Ops', data?.error ?? 'Não consegui gerar o relatório.');
      return null;
    }
    if (data.count === 0) {
      Alert.alert('Sem gastos', `Não há lançamentos em ${label} para exportar.`);
      return null;
    }
    return data;
  }

  async function handleEmail() {
    setBusy('email');
    const res = await generate(true);
    setBusy(null);
    if (res) {
      Alert.alert('Enviado! 📬', `Seu relatório de ${label} foi para ${userEmail ?? 'seu e-mail'}.`);
      onClose();
    }
  }

  async function handleDownload() {
    setBusy('download');
    const res = await generate(false);
    if (res) {
      try {
        const uri = FileSystem.cacheDirectory + res.filename;
        await FileSystem.writeAsStringAsync(uri, res.xlsxBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: `Relatório ${label}`,
            UTI: 'org.openxmlformats.spreadsheetml.sheet',
          });
        } else {
          Alert.alert('Pronto', 'Arquivo gerado, mas o compartilhamento não está disponível neste aparelho.');
        }
      } catch {
        Alert.alert('Ops', 'Não consegui salvar o arquivo.');
      }
    }
    setBusy(null);
  }

  const kindOptions: { key: Kind; label: string; icon: any }[] = [
    { key: 'month', label: 'Mensal', icon: 'calendar-month' },
    { key: 'year', label: 'Anual', icon: 'calendar-blank-multiple' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !busy && onClose()}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.iconWrap, { backgroundColor: hexWithAlpha(colors.primary, 0.14) }]}>
            <MaterialCommunityIcons name="file-excel" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Exportar relatório</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Uma planilha Excel bonita com todos os seus gastos do período.
          </Text>

          {/* Tipo: mensal / anual */}
          <View style={styles.kindRow}>
            {kindOptions.map((opt) => {
              const active = kind === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setKind(opt.key)}
                  style={[
                    styles.kindOption,
                    {
                      backgroundColor: active ? hexWithAlpha(colors.primary, 0.14) : colors.surface,
                      borderColor: active ? colors.primary : 'transparent',
                    },
                  ]}
                >
                  <MaterialCommunityIcons name={opt.icon} size={22} color={active ? colors.primary : colors.textMuted} />
                  <Text style={[styles.kindText, { color: active ? colors.primary : colors.textMuted }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Seletor de período */}
          <View style={[styles.periodRow, { backgroundColor: colors.surface }]}>
            <Pressable onPress={() => shiftPeriod(-1)} hitSlop={10} style={styles.arrow}>
              <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
            </Pressable>
            <Text style={[styles.periodLabel, { color: colors.text }]}>{label}</Text>
            <Pressable onPress={() => shiftPeriod(1)} hitSlop={10} style={styles.arrow}>
              <MaterialCommunityIcons name="chevron-right" size={26} color={colors.text} />
            </Pressable>
          </View>

          {/* Ações */}
          <PressableScale
            onPress={handleEmail}
            disabled={!!busy}
            scaleTo={0.97}
            style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: busy && busy !== 'email' ? 0.5 : 1 }]}
          >
            {busy === 'email' ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <MaterialCommunityIcons name="email-fast" size={20} color={colors.onPrimary} />
                <Text style={[styles.primaryText, { color: colors.onPrimary }]}>Enviar no meu e-mail</Text>
              </>
            )}
          </PressableScale>

          <Pressable
            onPress={handleDownload}
            disabled={!!busy}
            style={[styles.secondaryBtn, { backgroundColor: colors.surface, opacity: busy && busy !== 'download' ? 0.5 : 1 }]}
          >
            {busy === 'download' ? (
              <ActivityIndicator color={colors.text} />
            ) : (
              <>
                <MaterialCommunityIcons name="download" size={20} color={colors.text} />
                <Text style={[styles.secondaryText, { color: colors.text }]}>Baixar / compartilhar</Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={() => !busy && onClose()} style={styles.cancel}>
            <Text style={[styles.cancelText, { color: colors.textMuted }]}>Fechar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 400, borderRadius: 26, padding: 24, alignItems: 'center' },
  iconWrap: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  title: { fontSize: 21, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  kindRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  kindOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5,
  },
  kindText: { fontSize: 15, fontWeight: '700' },
  periodRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    alignSelf: 'stretch', borderRadius: 14, marginTop: 12, paddingHorizontal: 8, height: 52,
  },
  arrow: { padding: 6 },
  periodLabel: { fontSize: 16, fontWeight: '700' },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    alignSelf: 'stretch', height: 54, borderRadius: 16, marginTop: 18,
  },
  primaryText: { fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    alignSelf: 'stretch', height: 50, borderRadius: 14, marginTop: 10,
  },
  secondaryText: { fontSize: 15, fontWeight: '700' },
  cancel: { height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
