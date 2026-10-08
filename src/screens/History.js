import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useApp } from '../store';
import { PageHeader, Surface, T, fmt } from '../ui';
import { brand } from '../theme';

export default function History({ onBack }) {
  const { c, tasks, folders } = useApp();
  const done = useMemo(() => tasks.filter((t) => t.completed_at).sort((a, b) => b.completed_at - a.completed_at), [tasks]);

  return (
    <View style={{ flex: 1 }}>
      <PageHeader title="Histórico" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 160 }}>
        <T bold={false} style={{ color: c.sub, marginBottom: 18 }}>{done.length} tarefas concluídas</T>
        {done.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="time" size={64} color={brand.gold} />
            <T style={{ color: c.sub, marginTop: 12 }}>Conclua tarefas para vê-las aqui</T>
          </View>
        ) : null}
        {done.map((t) => {
          const f = folders.find((x) => x.id === t.folder_id);
          const late = t.due_at && t.completed_at > t.due_at;
          return (
            <Animated.View key={t.id} entering={FadeIn.duration(250)} style={{ marginBottom: 10 }}>
              <Surface radius={26} style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 }}>
                <View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: t.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <T numberOfLines={1}>{t.title}</T>
                  <T bold={false} style={{ color: c.sub, fontSize: 13, marginTop: 2 }}>
                    {fmt(t.completed_at)}{f ? '  •  ' + f.name : ''}
                  </T>
                </View>
                {t.due_at ? (
                  <View style={{ backgroundColor: (late ? brand.red : brand.sage) + '25', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
                    <T style={{ fontSize: 12, color: late ? brand.red : brand.sage }}>{late ? 'Atrasada' : 'No prazo'}</T>
                  </View>
                ) : null}
              </Surface>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}
