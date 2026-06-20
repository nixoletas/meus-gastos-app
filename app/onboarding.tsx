import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { hexWithAlpha } from '../src/components/CategoryIcon';
import { Mascot } from '../src/components/Mascot';
import { PIGGY_BRAND } from '../src/components/mascotSvg';
import { PressableScale } from '../src/components/PressableScale';
import { useOnboarding } from '../src/context/OnboardingContext';
import { useTheme } from '../src/theme/ThemeContext';
import { Text } from '../src/theme/typography';

const { width } = Dimensions.get('window');

type Slide = {
  icon?: any;
  mascot?: boolean;
  title: string;
  text: string;
};

const SLIDES: Slide[] = [
  {
    mascot: true,
    title: 'Cadê o dinheiro? 🤨',
    text: 'Todo fim de mês some uma grana e você nem sabe onde foi parar. Bora descobrir juntos?',
  },
  {
    icon: 'lightning-bolt',
    title: 'Lançar é num piscar',
    text: 'Anotar um gasto leva uns 5 segundos: valor, categoria com ícone bonito e pronto. Sem preguiça.',
  },
  {
    icon: 'chart-donut',
    title: 'Veja onde dá pra cortar',
    text: 'Gráficos e limites mostram pra onde sua grana está indo — e onde dá pra economizar sem sofrer.',
  },
  {
    mascot: true,
    title: 'Pra onde vai cada centavo.',
    text: 'Quem controla os gastos sobra mais no fim do mês. Esse é o primeiro passo pra poupar de verdade.',
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { complete } = useOnboarding();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [accepted, setAccepted] = useState(false);

  const isLast = page === SLIDES.length - 1;

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const p = Math.round(e.nativeEvent.contentOffset.x / width);
    if (p !== page) setPage(p);
  }

  function finish() {
    complete();
    router.replace('/login');
  }

  function next() {
    if (isLast) {
      if (accepted) finish();
    } else {
      scrollRef.current?.scrollTo({ x: (page + 1) * width, animated: true });
    }
  }

  // "Pular" leva ao último slide (onde está o aceite), não direto pro login.
  function skip() {
    scrollRef.current?.scrollTo({ x: (SLIDES.length - 1) * width, animated: true });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Pular */}
      <View style={styles.topBar}>
        {!isLast && (
          <Pressable onPress={skip} hitSlop={10} style={styles.skip}>
            <Text style={[styles.skipText, { color: colors.textMuted }]}>Pular</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={styles.art}>
              {slide.mascot ? (
                <Mascot size={170} colors={PIGGY_BRAND} />
              ) : (
                <View style={[styles.iconCircle, { backgroundColor: hexWithAlpha(colors.primary, 0.14) }]}>
                  <MaterialCommunityIcons name={slide.icon} size={76} color={colors.primary} />
                </View>
              )}
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
            <Text style={[styles.text, { color: colors.textMuted }]}>{slide.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Indicadores */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === page ? colors.primary : colors.border,
                width: i === page ? 22 : 8,
              },
            ]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {isLast && (
          <Pressable
            onPress={() => setAccepted((v) => !v)}
            style={styles.acceptRow}
          >
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: accepted ? colors.primary : 'transparent',
                  borderColor: accepted ? colors.primary : colors.border,
                },
              ]}
            >
              {accepted && (
                <MaterialCommunityIcons name="check" size={16} color={colors.onPrimary} />
              )}
            </View>
            <Text style={[styles.acceptText, { color: colors.textMuted }]}>
              Li e aceito os{' '}
              <Text
                style={{ color: colors.primary, fontWeight: '700' }}
                onPress={() => router.push({ pathname: '/legal', params: { doc: 'terms' } })}
              >
                Termos de Uso
              </Text>{' '}
              e a{' '}
              <Text
                style={{ color: colors.primary, fontWeight: '700' }}
                onPress={() => router.push({ pathname: '/legal', params: { doc: 'privacy' } })}
              >
                Política de Privacidade
              </Text>
              .
            </Text>
          </Pressable>
        )}

        <PressableScale
          onPress={next}
          scaleTo={0.97}
          disabled={isLast && !accepted}
          style={[
            styles.button,
            { backgroundColor: isLast && !accepted ? colors.surface : colors.primary },
          ]}
        >
          <Text
            style={[
              styles.buttonText,
              { color: isLast && !accepted ? colors.textMuted : colors.onPrimary },
            ]}
          >
            {isLast ? 'Começar' : 'Próximo'}
          </Text>
          <MaterialCommunityIcons
            name={isLast ? 'rocket-launch' : 'arrow-right'}
            size={20}
            color={isLast && !accepted ? colors.textMuted : colors.onPrimary}
          />
        </PressableScale>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { height: 44, justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 20 },
  skip: { padding: 8 },
  skipText: { fontSize: 15, fontWeight: '700' },
  slide: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36 },
  art: { height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconCircle: {
    width: 150,
    height: 150,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 27, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  text: { fontSize: 17, lineHeight: 25, textAlign: 'center', marginTop: 14, maxWidth: 360 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 16 },
  dot: { height: 8, borderRadius: 4 },
  footer: { paddingHorizontal: 24, paddingBottom: 16 },
  acceptRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  acceptText: { flex: 1, fontSize: 14, lineHeight: 20 },
  button: {
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    maxWidth: 460,
    width: '100%',
    alignSelf: 'center',
  },
  buttonText: { fontSize: 18, fontWeight: '700' },
});
