import React from 'react';
import { GestureResponderEvent, Pressable } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

export type PieSlice = {
  value: number;
  color: string;
  key: string;
};

type Props = {
  data: PieSlice[];
  size?: number;
  /** Espessura do anel (donut). */
  thickness?: number;
  /** Fatia selecionada (destaca e escurece as demais). */
  selectedKey?: string | null;
  onSelectSlice?: (key: string | null) => void;
  /** Conteúdo central (ex.: total ou detalhe da fatia). */
  children?: React.ReactNode;
};

/** Ponto na circunferência. */
function pt(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/** Caminho de um setor anular (fatia do donut). */
function annularSector(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  start: number,
  end: number
) {
  const largeArc = end - start > Math.PI ? 1 : 0;
  const o1 = pt(cx, cy, rOuter, start);
  const o2 = pt(cx, cy, rOuter, end);
  const i2 = pt(cx, cy, rInner, end);
  const i1 = pt(cx, cy, rInner, start);
  return [
    `M ${o1.x} ${o1.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
    `L ${i2.x} ${i2.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${i1.x} ${i1.y}`,
    'Z',
  ].join(' ');
}

/**
 * Gráfico donut com fatias clicáveis.
 * O toque é detectado por um Pressable em volta do SVG (calculamos a fatia
 * pelo ângulo), evitando onPress nas formas — que quebra no web.
 */
export function PieChart({
  data,
  size = 230,
  thickness = 36,
  selectedKey,
  onSelectSlice,
  children,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2;
  const rInner = size / 2 - thickness;
  const total = data.reduce((s, d) => s + d.value, 0);
  const startAngle = -Math.PI / 2; // começa no topo

  const positive = data.filter((d) => d.value > 0);
  const onlyOne = positive.length === 1;

  // Geometria das fatias (para desenhar e para detectar o toque).
  const segments: { key: string; color: string; a0: number; a1: number }[] = [];
  let angle = startAngle;
  for (const slice of data) {
    if (slice.value <= 0) continue;
    const sweep = (slice.value / total) * Math.PI * 2;
    segments.push({ key: slice.key, color: slice.color, a0: angle, a1: angle + sweep });
    angle += sweep;
  }

  function handleTap(e: GestureResponderEvent) {
    if (!onSelectSlice || total === 0) return;
    const ne = e.nativeEvent as any;
    const x = ne.locationX ?? ne.offsetX;
    const y = ne.locationY ?? ne.offsetY;
    if (x == null || y == null) return;

    const dx = x - cx;
    const dy = y - cy;
    const r = Math.sqrt(dx * dx + dy * dy);
    // Toque no buraco do donut ou fora: limpa a seleção.
    if (r < rInner - 4 || r > rOuter + 6) {
      onSelectSlice(null);
      return;
    }
    // Ângulo do toque normalizado a partir do topo.
    let a = Math.atan2(dy, dx);
    let norm = a - startAngle;
    while (norm < 0) norm += Math.PI * 2;
    while (norm >= Math.PI * 2) norm -= Math.PI * 2;

    const target = segments.find((s) => {
      const s0 = s.a0 - startAngle;
      const s1 = s.a1 - startAngle;
      return norm >= s0 && norm < s1;
    });
    if (target) onSelectSlice(selectedKey === target.key ? null : target.key);
  }

  return (
    <Pressable
      onPress={handleTap}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} pointerEvents="none">
        {total === 0 ? (
          <Circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} stroke="#E2E8F0" strokeWidth={thickness} fill="none" />
        ) : onlyOne ? (
          <Circle
            cx={cx}
            cy={cy}
            r={(rOuter + rInner) / 2}
            stroke={positive[0].color}
            strokeWidth={thickness}
            fill="none"
          />
        ) : (
          segments.map((s) => (
            <Path
              key={s.key}
              d={annularSector(cx, cy, rOuter, rInner, s.a0, s.a1)}
              fill={s.color}
              opacity={selectedKey != null && selectedKey !== s.key ? 0.3 : 1}
            />
          ))
        )}
      </Svg>
      {children && (
        <Pressable
          onPress={handleTap}
          style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
        >
          {children}
        </Pressable>
      )}
    </Pressable>
  );
}
