import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { Text } from '../theme/typography';

/** Quanto tempo o aviso fica na tela antes de sumir sozinho. */
const HOLD = 1200;

type Props = {
  /** Ex.: "R$ 42,90 lançado". */
  message: string;
  onDone: () => void;
};

/**
 * Confirmação rápida de que a ação deu certo, sem tirar o foco do formulário —
 * ao contrário do `SuccessOverlay`, que cobre a tela e encerra o fluxo.
 * Remonte com `key` diferente para reexibir.
 */
export function SuccessFlash({ message, onDone }: Props) {
  const { colors } = useTheme();
  const progress = useSharedValue(0);
  const iconScale = useSharedValue(0.4);

  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) }),
      withDelay(
        HOLD,
        withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
          if (finished) runOnJS(onDone)();
        })
      )
    );
    iconScale.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.back(2)) });
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      pointerEvents="none"
      style={[
        styles.flash,
        { backgroundColor: colors.card, borderColor: colors.border, shadowColor: colors.shadow },
        style,
      ]}
    >
      <Animated.View style={[styles.check, { backgroundColor: colors.success }, iconStyle]}>
        <MaterialCommunityIcons name="check-bold" size={18} color="#FFFFFF" />
      </Animated.View>
      <Text style={[styles.text, { color: colors.text }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flash: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 900,
  },
  check: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 15, fontWeight: '700' },
});
