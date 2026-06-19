import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SvgXml } from 'react-native-svg';
import { coinSvg, PiggyColors, PIGGY_WHITE, piggySvg } from './mascotSvg';

type Props = {
  size?: number;
  colors?: PiggyColors;
};

/**
 * Pim, o porquinho-cofrinho. Anima sutilmente: respira, pisca de vez em
 * quando e "engole" uma moedinha de R$ que cai no cofre, em loop.
 */
export function Mascot({ size = 150, colors = PIGGY_WHITE }: Props) {
  const [blink, setBlink] = useState(false);

  // Loop principal (queda da moeda + "gulp"): 0 → 1 continuamente.
  const progress = useSharedValue(0);
  // Respiração suave.
  const breathe = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2400, easing: Easing.linear }),
      -1,
      false
    );
    breathe.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );

    // Piscadela ocasional.
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3600);
    return () => clearInterval(id);
  }, []);

  const breatheStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(breathe.value, [0, 1], [0, -5]) },
      { scale: interpolate(breathe.value, [0, 1], [1, 1.02]) },
    ],
  }));

  const gulpStyle = useAnimatedStyle(() => {
    const scaleY = interpolate(
      progress.value,
      [0, 0.4, 0.46, 0.54, 1],
      [1, 1, 1.06, 0.97, 1]
    );
    return { transform: [{ scaleY }] };
  });

  const coinStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      progress.value,
      [0, 0.06, 0.34, 0.44, 0.5, 1],
      [0, 1, 1, 0, 0, 0]
    ),
    transform: [
      {
        translateY: interpolate(
          progress.value,
          [0, 0.42, 1],
          [-size * 0.34, -size * 0.04, -size * 0.04]
        ),
      },
    ],
  }));

  const coin = size * 0.26;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Moeda que cai no cofrinho */}
      <Animated.View style={[{ position: 'absolute', top: 0, zIndex: 2 }, coinStyle]}>
        <SvgXml xml={coinSvg()} width={coin} height={coin} />
      </Animated.View>

      {/* Porquinho */}
      <Animated.View style={breatheStyle}>
        <Animated.View style={gulpStyle}>
          <SvgXml xml={piggySvg(colors, blink)} width={size} height={size} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}
