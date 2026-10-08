import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useApp } from '../store';
import { PageHeader, Surface, T } from '../ui';
import { brand } from '../theme';
import Radar from '../components/Radar';

function pad(labels, values) {
  const l = [...labels];
  const v = [...values];
  while (l.length < 3) {
    l.push('');
    v.push(0);
  }
  return [l, v];
}

export default function Stats({ onBack }) {
  const { c, dark, tasks, folders } = useApp();

  const s = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const done = tasks.filter((t) => t.completed_at && t.completed_at >= start);
    const onTime = done.filter((t) => t.due_at && t.completed_at <= t.due_at).length;
    const late = done.filter((t) => t.due_at && t.completed_at > t.due_at).length;
    const noDue = done.filter((t) => !t.due_at).length;
    const counts = {};
    done.forEach((t) => {
      const k = t.folder_id || 0;
      counts[k] = (counts[k] || 0) + 1;
    });
    const byFolder = Object.keys(counts)
      .map((k) => ({ name: Number(k) ? (folders.find((f) => f.id === Number(k)) || { name: '?' }).name : 'Sem pasta', n: counts[k] }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 6);
    const perf = [
      ['No prazo', onTime],
      ['Atrasadas', late],
      ['Sem prazo', noDue],
      ['Prioridade alta', done.filter((t) => t.priority === 3).length],
      ['Anexos', done.filter((t) => t.att > 0).length],
      ['Etiquetadas', done.filter((t) => t.label).length]
    ];
    return { total: done.length, onTime, late, byFolder, perf };
  }, [tasks, folders]);

  const [fl, fv] = pad(s.byFolder.map((x) => x.name), s.byFolder.map((x) => x.n));
  const top = s.byFolder[0];
  const rate = s.onTime + s.late > 0 ? Math.round((s.onTime / (s.onTime + s.late)) * 100) : 0;

  const stat = (label, value, color) => (
    <Surface radius={28} tint={color + (dark ? '30' : '26')} style={{ flex: 1, padding: 16, alignItems: 'center' }}>
      <T style={{ fontSize: 28, color }}>{value}</T>
      <T bold={false} style={{ color: c.sub, fontSize: 12, marginTop: 2, textAlign: 'center' }}>{label}</T>
    </Surface>
  );

  return (
    <View style={{ flex: 1 }}>
      <PageHeader title="Estatísticas" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 160 }}>
        <Animated.View entering={FadeIn.duration(250)} style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          {stat('concluídas no mês', s.total, brand.accent)}
          {stat('no prazo', rate + '%', brand.sage)}
          {stat('atrasadas', s.late, brand.red)}
        </Animated.View>
        <Surface radius={32} style={{ padding: 18, marginBottom: 20 }}>
          <T style={{ fontSize: 18 }}>Tarefas por pasta</T>
          <T bold={false} style={{ color: c.sub, marginBottom: 6 }}>{top ? 'Mais realizadas em ' + top.name : 'Sem dados neste mês'}</T>
          <Radar labels={fl} values={fv} color={brand.accent} />
        </Surface>
        <Surface radius={32} style={{ padding: 18 }}>
          <T style={{ fontSize: 18 }}>Seu desempenho no mês</T>
          <T bold={false} style={{ color: c.sub, marginBottom: 6 }}>{rate >= 70 ? 'Você está mandando bem no prazo' : 'Dá pra melhorar os prazos'}</T>
          <Radar labels={s.perf.map((x) => x[0])} values={s.perf.map((x) => x[1])} color={brand.sage} />
        </Surface>
      </ScrollView>
    </View>
  );
}
