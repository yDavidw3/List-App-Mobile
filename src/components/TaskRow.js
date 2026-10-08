import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useApp } from '../store';
import { Pressy, T, fmt } from '../ui';
import { brand, priorities } from '../theme';

export default function TaskRow({ task, last, onPress }) {
  const { c, completeTask } = useApp();
  const [done, setDone] = useState(false);
  const fill = useSharedValue(0);
  const fillSt = useAnimatedStyle(() => ({ opacity: fill.value, transform: [{ scale: 0.4 + fill.value * 0.6 }] }));
  const checkSt = useAnimatedStyle(() => ({ opacity: fill.value }));
  const late = task.due_at && task.due_at < Date.now();

  const finish = () => {
    if (done) return;
    setDone(true);
    fill.value = withTiming(1, { duration: 200 });
    setTimeout(async () => {
      try {
        await completeTask(task);
        if (task.repeat === 'daily') {
          setDone(false);
          fill.value = withTiming(0, { duration: 150 });
        }
      } catch (e) {
        setDone(false);
        fill.value = withTiming(0, { duration: 150 });
        Alert.alert('Erro ao concluir', String(e && e.message ? e.message : e));
      }
    }, 420);
  };

  return (
    <Animated.View layout={LinearTransition.duration(220)} exiting={FadeOut.duration(200)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 16 }}>
        <Pressable onPress={finish} hitSlop={14} style={{ paddingVertical: 13 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2.5, borderColor: task.color, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Animated.View style={[{ position: 'absolute', width: 28, height: 28, borderRadius: 14, backgroundColor: task.color }, fillSt]} />
            <Animated.View style={checkSt}>
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </Animated.View>
          </View>
        </Pressable>
        <Pressy outer={{ flex: 1 }} onPress={onPress} scale={0.985} style={{ paddingVertical: 13, paddingHorizontal: 14 }}>
          <T style={{ textDecorationLine: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1 }} numberOfLines={1}>
            {task.title}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {task.priority > 0 ? <Ionicons name="flag" size={14} color={priorities[task.priority].color} /> : null}
            {task.due_at ? (
              <T bold={false} style={{ fontSize: 13, color: late ? brand.red : c.sub }}>
                {fmt(task.due_at)}
              </T>
            ) : null}
            {task.repeat === 'daily' ? <Ionicons name="repeat" size={15} color={c.sub} /> : null}
            {task.att > 0 ? <Ionicons name="attach" size={15} color={c.sub} /> : null}
            {task.label ? (
              <View style={{ backgroundColor: task.color + '30', paddingHorizontal: 9, paddingVertical: 2, borderRadius: 8 }}>
                <T style={{ fontSize: 12, color: task.color }}>{task.label}</T>
              </View>
            ) : null}
          </View>
        </Pressy>
      </View>
      {!last ? <View style={{ height: 1, backgroundColor: c.line, marginLeft: 58, marginRight: 16 }} /> : null}
    </Animated.View>
  );
}
