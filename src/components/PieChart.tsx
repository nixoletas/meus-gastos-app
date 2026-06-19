import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';

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
  /** Conteúdo central (ex.: total). */
  children?: React.ReactNode;
};

/**
 * Gráfico de pizza em formato donut, desenhado com arcos via strokeDasharray.
 * Sem dependências de charting — apenas react-native-svg (funciona em mobile e web).
 */
export function PieChart({ data, size = 220, thickness = 34, children }: Props) {
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((s, d) => s + d.value, 0);

  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Gira -90° para o primeiro arco começar no topo (rotate cross-platform). */}
        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          {total === 0 ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={thickness}
              fill="none"
            />
          ) : (
            data.map((slice) => {
              const fraction = slice.value / total;
              const dash = fraction * circumference;
              const circle = (
                <Circle
                  key={slice.key}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={slice.color}
                  strokeWidth={thickness}
                  fill="none"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              );
              offset += dash;
              return circle;
            })
          )}
        </G>
      </Svg>
      {children && (
        <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
          {children}
        </View>
      )}
    </View>
  );
}
