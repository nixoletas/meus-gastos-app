import React from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { tapLight } from '../utils/haptics';

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
        scale.value = withSpring(scaleTo, { damping: 15, stiffness: 400 });
        if (haptic) tapLight();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 12, stiffness: 300 });
        onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedPressable>
  );
}
