import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, ScrollView, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useApp } from '../store';
import { Pressy, Surface, T } from '../ui';
import { brand, taskColors } from '../theme';
import TaskRow from '../components/TaskRow';

function Chevron({ open, color }) {
  const r = useSharedValue(open ? 0 : -90);
  useEffect(() => {
    r.value = withTiming(open ? 0 : -90, { duration: 220 });
  }, [open]);
  const st = useAnimatedStyle(() => ({ transform: [{ rotate: r.value + 'deg' }] }));
  return (
    <Animated.View style={st}>
      <Ionicons name="chevron-down" size={22} color={color} />
    </Animated.View>
  );
}

export default function Home({ onOpenTask, onNewTask }) {
  const { c, dark, glass, user, tasks, folders, addFolder, deleteFolder, exportTasks } = useApp();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState(null);
  const [closed, setClosed] = useState([]);
  const [fm, setFm] = useState(false);
  const [fname, setFname] = useState('');
  const [fcolor, setFcolor] = useState(brand.accent);

  useEffect(() => {
    AsyncStorage.getItem('closed').then((v) => {
      if (v) setClosed(JSON.parse(v));
    });
  }, []);

  const toggle = (key) => {
    const next = closed.includes(key) ? closed.filter((x) => x !== key) : [...closed, key];
    setClosed(next);
    AsyncStorage.setItem('closed', JSON.stringify(next));
  };

  const open = useMemo(() => tasks.filter((t) => !t.completed_at), [tasks]);

  const sections = useMemo(() => {
    let l = open;
    if (q) {
      const s = q.toLowerCase();
      l = l.filter((t) => (t.title + ' ' + (t.description || '') + ' ' + (t.label || '')).toLowerCase().includes(s));
    }
    const base = [
      { key: 'none', id: null, name: 'Sem pasta', icon: 'file-tray', color: '#9A8576' },
      ...folders.map((f) => ({ key: 'f' + f.id, id: f.id, name: f.name, icon: 'folder', color: f.color, folder: true }))
    ];
    return base
      .map((s) => ({ ...s, items: l.filter((t) => (t.folder_id || null) === s.id) }))
      .filter((s) => (q ? s.items.length > 0 : s.key !== 'none' || s.items.length > 0 || folders.length === 0));
  }, [open, folders, q]);

  const saveFolder = async () => {
    if (!fname.trim()) return;
    try {
      await addFolder(fname, fcolor);
      setFname('');
      setFm(false);
    } catch (e) {
      Alert.alert('Erro ao criar pasta', String(e && e.message ? e.message : e));
    }
  };

  const askDelete = (s) => {
    if (!s.folder) return;
    Alert.alert('Excluir pasta', 'As tarefas dessa pasta ficarão sem pasta.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteFolder(s.id) }
    ]);
  };

  const pill = { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' };

  return (
    <View style={{ flex: 1, paddingTop: insets.top + 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 14 }}>
        <View>
          <T bold={false} style={{ color: c.sub, fontSize: 14 }}>Olá,</T>
          <T style={{ fontSize: 20 }}>{user.name.split(' ')[0]}</T>
        </View>
        <Surface radius={28} style={{ flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 4 }}>
          <Pressy onPress={() => setFm(true)} style={pill}><Ionicons name="folder-open" size={24} color={c.text} /></Pressy>
          <Pressy onPress={exportTasks} style={pill}><Ionicons name="share-social" size={23} color={c.text} /></Pressy>
          <Pressy onPress={() => setQ(q === null ? '' : null)} style={pill}><Ionicons name="search" size={24} color={c.text} /></Pressy>
        </Surface>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 210 }} keyboardShouldPersistTaps="handled">
        <T style={{ fontSize: 32, marginBottom: 14 }}>Minhas tarefas</T>

        {q !== null ? (
          <Animated.View entering={FadeIn.duration(200)}>
            <TextInput
              value={q}
              onChangeText={setQ}
              autoFocus
              placeholder="Pesquisar tarefas"
              placeholderTextColor={c.sub}
              style={{ height: 54, backgroundColor: c.surface, borderRadius: 20, paddingHorizontal: 22, color: c.text, fontFamily: 'Nunito_600SemiBold', fontSize: 16, marginBottom: 16 }}
            />
          </Animated.View>
        ) : null}

        {sections.map((s) => {
          const isOpen = q ? true : !closed.includes(s.key);
          return (
            <Animated.View key={s.key} layout={LinearTransition.duration(220)} entering={FadeIn.duration(220)} style={{ marginBottom: 14 }}>
              <Surface radius={32} tint={s.color + (dark ? '30' : '26')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}>
                  <Pressy outer={{ flex: 1 }} onPress={() => toggle(s.key)} onLongPress={() => askDelete(s)} scale={0.985} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                    <View style={{ width: 46, height: 46, borderRadius: 16, backgroundColor: s.color, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={s.icon} size={22} color="#FFFFFF" />
                    </View>
                    <T style={{ flex: 1 }} numberOfLines={1}>{s.name}</T>
                    <T bold={false} style={{ color: c.sub }}>{s.items.length}</T>
                  </Pressy>
                  <Pressy onPress={() => onNewTask(s.id)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="add" size={26} color={brand.accent} />
                  </Pressy>
                  <Pressy onPress={() => toggle(s.key)} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
                    <Chevron open={isOpen} color={c.sub} />
                  </Pressy>
                </View>
                {isOpen ? (
                  <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)}>
                    <View style={{ height: 1, backgroundColor: c.line, marginHorizontal: 16 }} />
                    {s.items.length ? (
                      s.items.map((t, i) => <TaskRow key={t.id} task={t} last={i === s.items.length - 1} onPress={() => onOpenTask(t)} />)
                    ) : (
                      <T bold={false} style={{ color: c.sub, padding: 18, textAlign: 'center' }}>Nenhuma tarefa</T>
                    )}
                  </Animated.View>
                ) : null}
              </Surface>
            </Animated.View>
          );
        })}
      </ScrollView>

      <Pressy
        onPress={() => onNewTask(null)}
        outer={{ position: 'absolute', right: 20, bottom: insets.bottom + 100 }}
        style={{ height: 62, paddingHorizontal: 22, borderRadius: 22, overflow: 'hidden', backgroundColor: brand.accent, flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: brand.accent, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}
      >
        {glass ? (
          <LinearGradient pointerEvents="none" colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0)']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        ) : null}
        <Ionicons name="add" size={28} color={brand.onAccent} />
        <T style={{ color: brand.onAccent }}>Nova tarefa</T>
      </Pressy>

      <Modal visible={fm} transparent animationType="fade" onRequestClose={() => setFm(false)}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 24 }}>
            <View style={{ backgroundColor: c.bg, borderRadius: 36, padding: 22 }}>
              <T style={{ fontSize: 22, marginBottom: 14 }}>Nova pasta</T>
              <TextInput
                value={fname}
                onChangeText={setFname}
                placeholder="Ex: Programação"
                placeholderTextColor={c.sub}
                style={{ height: 56, backgroundColor: c.surface, borderRadius: 20, paddingHorizontal: 20, color: c.text, fontFamily: 'Nunito_600SemiBold', fontSize: 16 }}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginVertical: 18 }}>
                {taskColors.map((col) => (
                  <Pressy key={col} onPress={() => setFcolor(col)} style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: col, alignItems: 'center', justifyContent: 'center' }}>
                    {fcolor === col ? <Ionicons name="checkmark" size={22} color="#FFFFFF" /> : null}
                  </Pressy>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressy outer={{ flex: 1 }} onPress={() => setFm(false)} style={{ height: 56, borderRadius: 28, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
                  <T>Cancelar</T>
                </Pressy>
                <Pressy outer={{ flex: 1 }} onPress={saveFolder} style={{ height: 56, borderRadius: 28, backgroundColor: brand.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <T style={{ color: brand.onAccent }}>Criar</T>
                </Pressy>
              </View>
            </View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}
