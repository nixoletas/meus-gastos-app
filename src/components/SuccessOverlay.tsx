import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
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

type Props = {
  visible: boolean;
  amountLabel: string;
  onDone: () => void;
};

/** Partícula individual que sai voando do centro. */
function Particle({ index, play }: { index: number; play: boolean }) {
  const progress = useSharedValue(0);
  const angle = (index / 14) * Math.PI * 2;
  const distance = 90 + (index % 3) * 28;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];

  useEffect(() => {
    if (play) {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 650,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [play]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * distance * progress.value },
      { translateY: Math.sin(angle) * distance * progress.value },
      { scale: 1 - progress.value * 0.4 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { backgroundColor: color, borderRadius: index % 2 ? 3 : 6 },
        style,
      ]}
    />
  );
}

/** Overlay que comemora cada lançamento de gasto (feedback de dopamina). */
export function SuccessOverlay({ visible, amountLabel, onDone }: Props) {
  const { colors } = useTheme();
  const circleScale = useSharedValue(0);
  const checkScale = useSharedValue(0);
  const labelOpacity = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    overlayOpacity.value = withTiming(1, { duration: 120 });
    circleScale.value = withSpring(1, { damping: 9, stiffness: 140 });
    checkScale.value = withDelay(
      90,
      withSpring(1, { damping: 8, stiffness: 180 })
    );
    labelOpacity.value = withDelay(160, withTiming(1, { duration: 200 }));

    // Fecha sozinho após a comemoração.
    overlayOpacity.value = withDelay(
      1050,
      withTiming(0, { duration: 220 }, (finished) => {
        if (finished) {
          runOnJS(onDone)();
        }
      })
    );
    circleScale.value = withDelay(
      1050,
      withSequence(withTiming(circleScale.value, { duration: 0 }))
    );
  }, [visible]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: (1 - labelOpacity.value) * 10 }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, overlayStyle, { backgroundColor: colors.background + 'F2' }]}
    >
      <View style={styles.center}>
        <View style={styles.particleWrap}>
          {Array.from({ length: 14 }).map((_, i) => (
            <Particle key={i} index={i} play={visible} />
          ))}
        </View>

        <Animated.View
          style={[styles.circle, { backgroundColor: colors.success }, circleStyle]}
        >
          <Animated.View style={checkStyle}>
            <MaterialCommunityIcons name="check-bold" size={54} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>

        <Animated.View style={[styles.labelWrap, labelStyle]}>
          <Text style={[styles.added, { color: colors.textMuted }]}>
            Gasto registrado
          </Text>
          <Text style={[styles.amount, { color: colors.text }]}>{amountLabel}</Text>
        </Animated.View>
      </View>
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
    top: 30,
  },
  particle: { position: 'absolute', width: 12, height: 12 },
  circle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: { marginTop: 22, alignItems: 'center' },
  added: { fontSize: 15, fontWeight: '500' },
  amount: { fontSize: 30, fontWeight: '800', marginTop: 2 },
});
