import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useFonts, Nunito_600SemiBold, Nunito_800ExtraBold } from '@expo-google-fonts/nunito';
import { AppProvider, useApp } from './src/store';
import { Glass, Loader, T } from './src/ui';
import { brand } from './src/theme';
import Auth from './src/screens/Auth';
import Home from './src/screens/Home';
import Profile from './src/screens/Profile';
import TaskSheet from './src/components/TaskSheet';
import TaskForm from './src/components/TaskForm';

SplashScreen.preventAutoHideAsync();

try {
  SplashScreen.setOptions({ duration: 400, fade: true });
} catch (e) {
  console.error(e);
}

const TABS = [
  { key: 'home', label: 'Tarefas', icon: 'checkmark-circle' },
  { key: 'profile', label: 'Perfil', icon: 'person-circle' }
];

function TabBar({ tab, onTab }) {
  const { c, glass, dark } = useApp();
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const itemW = w ? w / TABS.length : 0;
  const idx = TABS.findIndex((t) => t.key === tab);
  const x = useSharedValue(0);
  const s = useSharedValue(1);

  useEffect(() => {
    if (itemW) x.value = withTiming(idx * itemW, { duration: 280, easing: Easing.out(Easing.cubic) });
  }, [idx, itemW]);

  const clamp = (v) => Math.min(Math.max(v, 0), itemW * (TABS.length - 1));

  const pan = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((e) => {
      s.value = withTiming(1.16, { duration: 150 });
      x.value = withTiming(clamp(e.x - itemW / 2), { duration: 120 });
    })
    .onUpdate((e) => {
      x.value = clamp(e.x - itemW / 2);
    })
    .onEnd((e) => {
      const i = Math.round(clamp(e.x - itemW / 2) / itemW);
      x.value = withTiming(i * itemW, { duration: 240, easing: Easing.out(Easing.cubic) });
      onTab(TABS[i].key);
    })
    .onFinalize(() => {
      s.value = withTiming(1, { duration: 220 });
    });

  const lens = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { scale: s.value }] }));

  const body = (
    <GestureDetector gesture={pan}>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row', height: 62 }}>
        {itemW ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: itemW,
                borderRadius: 31,
                backgroundColor: glass ? (dark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.75)') : brand.accent + '33',
                borderWidth: 1,
                borderColor: glass ? (dark ? 'rgba(255,255,255,0.3)' : '#FFFFFF') : 'transparent'
              },
              lens
            ]}
          />
        ) : null}
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <View key={t.key} pointerEvents="none" style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={t.icon} size={27} color={active ? brand.accent : c.sub} />
              <T style={{ fontSize: 11, color: active ? brand.accent : c.sub }}>{t.label}</T>
            </View>
          );
        })}
      </View>
    </GestureDetector>
  );

  const pos = { position: 'absolute', left: 56, right: 56, bottom: insets.bottom + 10 };

  if (glass) {
    return (
      <Glass radius={36} strong style={[pos, { padding: 6 }]}>
        {body}
      </Glass>
    );
  }
  return <View style={[pos, { padding: 6, borderRadius: 36, backgroundColor: c.surface }]}>{body}</View>;
}

function Root() {
  const { ready, user, c, dark } = useApp();
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold, Nunito_800ExtraBold });
  const [tab, setTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [sheetTask, setSheetTask] = useState(null);
  const [form, setForm] = useState({ open: false, task: null, folder: null });
  const visits = useRef({});

  useEffect(() => {
    if (fontsLoaded && ready) {
      SplashScreen.hideAsync();
      const b = setTimeout(() => setLoading(false), 700);
      visits.current.home = Date.now();
      return () => clearTimeout(b);
    }
    return undefined;
  }, [fontsLoaded, ready]);

  const changeTab = (next) => {
    if (next === tab) return;
    const now = Date.now();
    visits.current[tab] = now;
    const last = visits.current[next];
    if (!last || now - last > 300000) {
      setLoading(true);
      setTimeout(() => setLoading(false), 700);
    }
    setTab(next);
  };

  if (!fontsLoaded || !ready) return null;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      {user ? (
        <>
          <Animated.View key={tab} entering={FadeIn.duration(220)} style={{ flex: 1 }}>
            {tab === 'home' ? <Home onOpenTask={setSheetTask} onNewTask={(folder) => setForm({ open: true, task: null, folder })} /> : null}
            {tab === 'profile' ? <Profile /> : null}
          </Animated.View>
          <TabBar tab={tab} onTab={changeTab} />
          <TaskSheet
            task={sheetTask}
            onClose={() => setSheetTask(null)}
            onEdit={(t) => {
              setSheetTask(null);
              setForm({ open: true, task: t, folder: null });
            }}
          />
          <TaskForm visible={form.open} task={form.task} defaultFolder={form.folder} onClose={() => setForm({ open: false, task: null, folder: null })} />
        </>
      ) : (
        <Auth />
      )}
      {loading && user ? <Loader /> : null}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <BottomSheetModalProvider>
            <Root />
          </BottomSheetModalProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
