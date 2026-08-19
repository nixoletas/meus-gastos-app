import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { hexWithAlpha } from './CategoryIcon';
import { useTheme } from '../theme/ThemeContext';
import { Text } from '../theme/typography';

type Props = {
  visible: boolean;
  title: string;
  /** Texto explicando a consequência da ação. */
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` para ações destrutivas (padrão), `primary` para as demais. */
  tone?: 'danger' | 'primary';
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /**
   * Conteúdo no lugar do ícone padrão — usado quando a coisa sendo excluída
   * já tem uma representação visual própria (ex.: o ícone da categoria).
   */
  preview?: React.ReactNode;
  /** Trava os botões enquanto a ação roda. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Confirmação em componente do app, no lugar do `Alert.alert` do sistema.
 * Mesma linguagem visual da versão web (`ConfirmDialog`).
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  icon = 'trash-can-outline',
  preview,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const accent = tone === 'danger' ? colors.danger : colors.primary;
  const accentSoft = tone === 'danger' ? colors.dangerSoft : colors.primarySoft;

  // Anel que expande e some atrás do ícone, marcando a gravidade da ação.
  const ringProgress = useSharedValue(0);
  const iconScale = useSharedValue(0.6);

  useEffect(() => {
    if (!visible) {
      ringProgress.value = 0;
      iconScale.value = 0.6;
      return;
    }
    ringProgress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) });
    iconScale.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.back(1.6)) });
  }, [visible]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - ringProgress.value),
    transform: [{ scale: 0.6 + ringProgress.value * 1.6 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => !busy && onCancel()}
    >
      <Pressable
        style={styles.backdrop}
        onPress={() => !busy && onCancel()}
      >
        {/* Toque dentro do card não fecha. */}
        <Pressable
          onPress={() => {}}
          style={[styles.card, { backgroundColor: colors.card }]}
        >
          <View style={styles.previewWrap}>
            {preview ?? (
              <View style={styles.iconStack}>
                <Animated.View
                  style={[
                    styles.ring,
                    { backgroundColor: hexWithAlpha(accent, 0.35) },
                    ringStyle,
                  ]}
                />
                <Animated.View
                  style={[styles.iconCircle, { backgroundColor: accentSoft }, iconStyle]}
                >
                  <MaterialCommunityIcons name={icon} size={32} color={accent} />
                </Animated.View>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text>

          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              style={[styles.button, { backgroundColor: colors.surface, opacity: busy ? 0.5 : 1 }]}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              style={[styles.button, { backgroundColor: accent, opacity: busy ? 0.7 : 1 }]}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
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
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  previewWrap: { marginBottom: 16 },
  iconStack: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 64, height: 64, borderRadius: 32 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 22 },
  actions: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
