import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { persistFile, useApp } from '../store';
import { Pressy, Surface, T } from '../ui';
import { brand } from '../theme';
import Stats from './Stats';
import History from './History';
import Settings from './Settings';

export default function Profile() {
  const { c, dark, user, setPhoto } = useApp();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(null);
  const level = Math.floor(user.xp / 100) + 1;
  const prog = useSharedValue(0);
  const bar = useAnimatedStyle(() => ({ width: prog.value * 100 + '%' }));

  useEffect(() => {
    prog.value = withTiming((user.xp % 100) / 100, { duration: 500 });
  }, [user.xp, page]);

  const pickPhoto = async () => {
    try {
      const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
      if (r.canceled) return;
      setPhoto(await persistFile(r.assets[0].uri, 'perfil.jpg'));
    } catch (e) {
      Alert.alert('Erro ao trocar a foto', String(e && e.message ? e.message : e));
    }
  };

  const back = () => setPage(null);

  if (page === 'stats') return <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1 }}><Stats onBack={back} /></Animated.View>;
  if (page === 'history') return <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1 }}><History onBack={back} /></Animated.View>;
  if (page === 'settings') return <Animated.View entering={FadeIn.duration(220)} style={{ flex: 1 }}><Settings onBack={back} /></Animated.View>;

  const rows = [
    { key: 'stats', name: 'Estatísticas', icon: 'analytics', color: brand.accent },
    { key: 'history', name: 'Histórico', icon: 'time', color: brand.sage },
    { key: 'settings', name: 'Configurações', icon: 'settings', color: '#8C5A3C' }
  ];

  return (
    <ScrollView contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16, paddingBottom: 170 }}>
      <View style={{ alignItems: 'center', marginBottom: 22 }}>
        <Pressy onPress={pickPhoto} style={{ width: 116, height: 116 }}>
          <View style={{ width: 112, height: 112, borderRadius: 40, backgroundColor: brand.accent, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {user.photo ? <Image source={{ uri: user.photo }} style={{ width: 112, height: 112 }} /> : <Ionicons name="person" size={56} color={brand.onAccent} />}
          </View>
          <View style={{ position: 'absolute', right: 0, bottom: 0, width: 38, height: 38, borderRadius: 14, backgroundColor: c.text, borderWidth: 3, borderColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="pencil" size={16} color={c.bg} />
          </View>
        </Pressy>
        <T style={{ fontSize: 24, marginTop: 12 }}>{user.name}</T>
        <T bold={false} style={{ color: c.sub }}>{user.email}</T>
      </View>

      <Surface radius={32} tint={brand.gold + (dark ? '30' : '26')} style={{ padding: 20, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <T style={{ fontSize: 20 }}>Nível {level}</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="flash" size={20} color={brand.gold} />
            <T style={{ color: brand.gold }}>{user.xp} XP</T>
          </View>
        </View>
        <View style={{ height: 16, borderRadius: 8, backgroundColor: c.high, marginTop: 14, overflow: 'hidden' }}>
          <Animated.View style={[{ height: 16, borderRadius: 8, backgroundColor: brand.accent }, bar]} />
        </View>
        <T bold={false} style={{ color: c.sub, fontSize: 13, marginTop: 8 }}>{100 - (user.xp % 100)} XP para o próximo nível</T>
      </Surface>

      {rows.map((r) => (
        <Surface key={r.key} radius={32} tint={r.color + (dark ? '30' : '26')} style={{ marginBottom: 12 }}>
          <Pressy onPress={() => setPage(r.key)} scale={0.985} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
            <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: r.color, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={r.icon} size={24} color="#FFFFFF" />
            </View>
            <T style={{ flex: 1 }}>{r.name}</T>
            <Ionicons name="chevron-forward" size={20} color={c.sub} />
          </Pressy>
        </Surface>
      ))}
    </ScrollView>
  );
}
