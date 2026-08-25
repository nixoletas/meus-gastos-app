import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PressableScale } from '../src/components/PressableScale';
import { setPendingScan } from '../src/lib/receipts';
import { useTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/theme/typography';

/** O QR da NFC-e sempre aponta para o portal da SEFAZ do estado. */
function pareceNfce(valor: string): boolean {
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && url.hostname.toLowerCase().endsWith('.gov.br');
  } catch {
    return false;
  }
}

/**
 * Leitor do QR Code do cupom fiscal.
 *
 * A tela só lê e volta: quem monta a notinha é a tela de lançamento, que
 * pega o valor lido em `takePendingScan()` ao voltar ao foco.
 */
export default function QrCodeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [erro, setErro] = useState<string | null>(null);
  /** A câmera dispara o mesmo código várias vezes por segundo. */
  const jaLeu = useRef(false);

  function handleScan(valor: string) {
    if (jaLeu.current) return;

    if (!pareceNfce(valor)) {
      setErro('Esse QR Code não é de uma nota fiscal. Aponte para o QR do cupom.');
      return;
    }

    jaLeu.current = true;
    setPendingScan(valor);
    router.back();
  }

  if (!permission) {
    return <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Header onClose={() => router.back()} tint={colors.text} title="Ler QR do cupom" />
        <View style={styles.center}>
          <MaterialCommunityIcons name="camera-off-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.aviso, { color: colors.text }]}>
            Preciso da câmera para ler o QR Code do cupom.
          </Text>
          <PressableScale
            onPress={requestPermission}
            style={[styles.botao, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.botaoTexto, { color: colors.onPrimary }]}>Liberar câmera</Text>
          </PressableScale>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0B1120' }]}>
      <Header onClose={() => router.back()} tint="#FFFFFF" title="Ler QR do cupom" />

      <View style={styles.cameraWrap}>
        {/* Na web o CameraView não existe; lá o caminho é colar o link. */}
        {Platform.OS === 'web' ? (
          <View style={styles.center}>
            <Text style={styles.dica}>
              No navegador, use o campo "colar link do QR" na tela de lançamento.
            </Text>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => handleScan(data)}
          />
        )}

        {/* Moldura: mira o usuário sem cobrir o cupom. */}
        <View pointerEvents="none" style={styles.alvoWrap}>
          <View style={styles.alvo} />
        </View>
      </View>

      <View style={styles.rodape}>
        <Text style={styles.dica}>
          {erro ?? 'Aponte para o QR Code impresso no rodapé do cupom fiscal.'}
        </Text>
        <Text style={styles.dicaFraca}>
          Os itens vêm direto da SEFAZ — sem foto, sem erro de leitura.
        </Text>
      </View>
    </SafeAreaView>
  );
}

function Header({
  onClose,
  tint,
  title,
}: {
  onClose: () => void;
  tint: string;
  title: string;
}) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onClose} hitSlop={12} style={styles.headerBtn}>
        <MaterialCommunityIcons name="close" size={26} color={tint} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: tint }]}>{title}</Text>
      <View style={styles.headerBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  cameraWrap: { flex: 1, overflow: 'hidden' },
  // Espalhar StyleSheet.absoluteFill não funciona (é um id registrado, não objeto).
  alvoWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alvo: {
    width: 240,
    height: 240,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  aviso: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  botao: { height: 48, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  botaoTexto: { fontSize: 16, fontWeight: '700' },
  rodape: { padding: 20, gap: 6 },
  dica: { color: '#F1F5F9', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  dicaFraca: { color: '#94A3B8', fontSize: 13, textAlign: 'center' },
});
