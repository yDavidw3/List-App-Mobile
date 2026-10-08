import React from 'react';
import Svg, { Circle, Line, Polygon, Text as SText } from 'react-native-svg';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useApp } from '../store';

export default function Radar({ labels, values, color, size = 320 }) {
  const { c } = useApp();
  const n = labels.length;
  const cx = size / 2;
  const r = size * 0.3;
  const max = Math.max(...values, 1);
  const pt = (i, k) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + Math.cos(a) * r * k, cx + Math.sin(a) * r * k];
  };
  const ring = (k) => labels.map((_, i) => pt(i, k).join(',')).join(' ');
  const data = values.map((v, i) => pt(i, v / max).join(',')).join(' ');

  return (
    <Animated.View entering={FadeIn.duration(400)} style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <Polygon key={k} points={ring(k)} fill="none" stroke={c.line} strokeWidth={1.5} />
        ))}
        {labels.map((_, i) => {
          const [x, y] = pt(i, 1);
          return <Line key={i} x1={cx} y1={cx} x2={x} y2={y} stroke={c.line} strokeWidth={1.5} />;
        })}
        <Polygon points={data} fill={color} fillOpacity={0.28} stroke={color} strokeWidth={3} strokeLinejoin="round" />
        {values.map((v, i) => {
          const [x, y] = pt(i, v / max);
          return <Circle key={i} cx={x} cy={y} r={5} fill={color} />;
        })}
        {labels.map((l, i) => {
          const [x, y] = pt(i, 1.32);
          const text = l ? (l.length > 11 ? l.slice(0, 10) + '…' : l) + ' (' + values[i] + ')' : '';
          return (
            <SText key={i} x={x} y={y} fill={c.text} fontSize={12} fontFamily="Nunito_800ExtraBold" textAnchor="middle" alignmentBaseline="middle">
              {text}
            </SText>
          );
        })}
      </Svg>
    </Animated.View>
  );
}
