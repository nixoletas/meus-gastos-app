import React from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { tapLight } from '../utils/sound';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  style?: ViewStyle | ViewStyle[];
  /** Quanto encolhe ao pressionar (0.96 = 4%). */
  scaleTo?: number;
  /** Dispara um leve haptic ao pressionar. */
  haptic?: boolean;
  children: React.ReactNode;
};

/** Botão que "afunda" suavemente ao toque — base do feedback tátil/visual. */
export function PressableScale({
  style,
  scaleTo = 0.96,
  haptic = true,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withTiming(scaleTo, { duration: 90, easing: Easing.out(Easing.quad) });
        if (haptic) tapLight();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 110, easing: Easing.out(Easing.quad) });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
