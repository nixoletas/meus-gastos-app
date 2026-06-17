import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';

const { width } = Dimensions.get('window');

const PARTICLE_COLORS = [
  '#0EA5A4',
  '#F59E0B',
  '#EC4899',
  '#6366F1',
  '#10B981',
  '#F97316',
  '#3B82F6',
];

const PARTICLE_COUNT = 16;

type Props = {
  visible: boolean;
  amountLabel: string;
  onDone: () => void;
};

/** Partícula individual que sai voando do centro. */
function Particle({ index, play }: { index: number; play: boolean }) {
  const progress = useSharedValue(0);
  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;
  const distance = 96 + (index % 3) * 30;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];

  useEffect(() => {
    if (play) {
      progress.value = 0;
      progress.value = withDelay(
        120,
        withTiming(1, { duration: 720, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [play]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - progress.value * 0.5 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color, borderRadius: index % 2 ? 3 : 7 },
        style,
      ]}
    />
  );
}

/** Overlay que comemora cada lançamento de gasto (feedback de dopamina). */
export function SuccessOverlay({ visible, amountLabel, onDone }: Props) {
  const { colors } = useTheme();
  const overlayOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(0);
  const circleScale = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const contentScale = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;

    // Cobre a tela rapidamente (fundo sólido).
    overlayOpacity.value = withTiming(1, { duration: 90 });

    // Onda/anel que "explode" atrás do círculo.
    ringScale.value = 0;
    ringOpacity.value = 0.45;
    ringScale.value = withTiming(2.4, { duration: 620, easing: Easing.out(Easing.cubic) });
    ringOpacity.value = withTiming(0, { duration: 620 });

    // Círculo + check entram com mola.
    circleScale.value = withSpring(1, { damping: 9, stiffness: 150 });
    checkScale.value = withDelay(100, withSpring(1, { damping: 7, stiffness: 190 }));
    labelOpacity.value = withDelay(180, withTiming(1, { duration: 220 }));

    // Ao final, dá um leve "respiro" e fecha — mantendo o overlay OPACO,
    // de modo que o modal desça já coberto (sem flash do formulário).
    contentScale.value = withDelay(
      980,
      withSpring(1.06, { damping: 10, stiffness: 200 }, (finished) => {
        if (finished) runOnJS(onDone)();
      })
    );
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: contentScale.value }],
  }));
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: (1 - labelOpacity.value) * 12 }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.overlay, overlayStyle, { backgroundColor: colors.background }]}
    >
      <Animated.View style={[styles.center, contentStyle]}>
        {/* Partículas */}
        <View style={styles.particleWrap}>
          {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
            <Particle key={i} index={i} play={visible} />
          ))}
        </View>

        {/* Anel de explosão */}
        <Animated.View
          style={[styles.ring, { borderColor: colors.success }, ringStyle]}
        />

        {/* Círculo com check */}
        <Animated.View
          style={[styles.circle, { backgroundColor: colors.success }, circleStyle]}
        >
          <Animated.View style={checkStyle}>
            <MaterialCommunityIcons name="check-bold" size={56} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.labelWrap, labelStyle]}>
          <Text style={[styles.added, { color: colors.textMuted }]}>
            Gasto registrado 🎉
          </Text>
          <Text style={[styles.amount, { color: colors.text }]}>{amountLabel}</Text>
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  center: { alignItems: 'center', justifyContent: 'center', width },
  particleWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: { position: 'absolute', width: 13, height: 13 },
  ring: {
    position: 'absolute',
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 4,
  },
  circle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: { marginTop: 24, alignItems: 'center' },
  added: { fontSize: 15, fontWeight: '600' },
  amount: { fontSize: 32, fontWeight: '800', marginTop: 4 },
});
