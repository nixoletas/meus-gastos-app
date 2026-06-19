import React from 'react';
import { View } from 'react-native';
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
 * Gráfico donut com fatias clicáveis (react-native-svg, mobile e web).
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
  const start = -Math.PI / 2; // começa no topo

  let angle = start;
  const onlyOne = data.filter((d) => d.value > 0).length === 1;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {total === 0 ? (
          <Circle cx={cx} cy={cy} r={(rOuter + rInner) / 2} stroke="#E2E8F0" strokeWidth={thickness} fill="none" />
        ) : (
          data.map((slice) => {
            if (slice.value <= 0) return null;
            const fraction = slice.value / total;
            const sweep = fraction * Math.PI * 2;
            const a0 = angle;
            const a1 = angle + sweep;
            angle = a1;

            const dimmed = selectedKey != null && selectedKey !== slice.key;
            const handlePress = () =>
              onSelectSlice?.(selectedKey === slice.key ? null : slice.key);

            // Fatia única = anel completo.
            if (onlyOne) {
              return (
                <Circle
                  key={slice.key}
                  cx={cx}
                  cy={cy}
                  r={(rOuter + rInner) / 2}
                  stroke={slice.color}
                  strokeWidth={thickness}
                  fill="none"
                  onPress={handlePress}
                />
              );
            }

            return (
              <Path
                key={slice.key}
                d={annularSector(cx, cy, rOuter, rInner, a0, a1)}
                fill={slice.color}
                opacity={dimmed ? 0.3 : 1}
                onPress={handlePress}
              />
            );
          })
        )}
      </Svg>
      {children && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}
        >
          {children}
        </View>
      )}
    </View>
  );
}
