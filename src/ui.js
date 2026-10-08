import React from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Pressable as GesturePressable } from 'react-native-gesture-handler';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useApp } from './store';
import { brand } from './theme';

export const fmt = (t) => {
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return p(d.getDate()) + '/' + p(d.getMonth() + 1) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
};

export function T({ style, bold = true, ...p }) {
  const { c } = useApp();
  return (
    <Text
      {...p}
      style={[{ color: c.text, fontFamily: bold ? 'Nunito_800ExtraBold' : 'Nunito_600SemiBold', fontSize: 16 }, style]}
    />
  );
}

function makePressy(Comp) {
  return function PressyBase({ style, outer, children, scale = 0.97, ...p }) {
    const s = useSharedValue(1);
    const st = useAnimatedStyle(() => ({ transform: [{ scale: s.value }], opacity: 1 - (1 - s.value) * 2 }));
    return (
      <Comp
        {...p}
        style={outer}
        onPressIn={() => {
          s.value = withTiming(scale, { duration: 90 });
        }}
        onPressOut={() => {
          s.value = withTiming(1, { duration: 140 });
        }}
      >
        <Animated.View style={[style, st]}>{children}</Animated.View>
      </Comp>
    );
  };
}

export const Pressy = makePressy(Pressable);
export const GPressy = makePressy(GesturePressable);

export function Glass({ radius = 28, style, children, strong, ...rest }) {
  const { c, dark } = useApp();
  return (
    <View
      {...rest}
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.85)',
          borderTopColor: dark ? 'rgba(255,255,255,0.34)' : '#FFFFFF'
        },
        style
      ]}
    >
      <BlurView
        intensity={strong ? 90 : 65}
        tint={dark ? 'dark' : 'light'}
        experimentalBlurMethod="dimezisBlurView"
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.glass }]} />
      <LinearGradient
        pointerEvents="none"
        colors={
          dark
            ? ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.06)']
            : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.4)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

export function Surface({ style, children, radius = 28, tint, ...p }) {
  const { c, glass } = useApp();
  const overlay = tint ? <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: tint }]} /> : null;
  if (glass) {
    return (
      <Glass {...p} radius={radius} style={style}>
        {overlay}
        {children}
      </Glass>
    );
  }
  return (
    <View {...p} style={[{ borderRadius: radius, backgroundColor: c.surface, overflow: 'hidden' }, style]}>
      {overlay}
      {children}
    </View>
  );
}

export function Logo({ size = 96 }) {
  return <Image source={require('../assets/logo.png')} style={{ width: size, height: size, borderRadius: size * 0.24 }} />;
}

export function Loader() {
  const { c } = useApp();
  return (
    <Animated.View
      entering={FadeIn.duration(120)}
      exiting={FadeOut.duration(250)}
      style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', zIndex: 50 }]}
    >
      <ActivityIndicator size="large" color={brand.accent} />
    </Animated.View>
  );
}

export function PageHeader({ title, onBack }) {
  const { c } = useApp();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: insets.top + 10, paddingBottom: 14 }}>
      <Pressy onPress={onBack} style={{ width: 48, height: 48, borderRadius: 18, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={24} color={c.text} />
      </Pressy>
      <T style={{ fontSize: 28 }}>{title}</T>
    </View>
  );
}
