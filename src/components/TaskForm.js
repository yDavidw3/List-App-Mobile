import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import { persistFile, useApp } from '../store';
import { Pressy, T, fmt } from '../ui';
import { brand, priorities, taskColors } from '../theme';

const blank = { title: '', description: '', folder_id: null, label: '', priority: 0, color: brand.accent, due_at: null, repeat: 'none', attachments: [] };

const endOfDay = (add) => {
  const d = new Date();
  d.setDate(d.getDate() + add);
  d.setHours(23, 59, 0, 0);
  return d.getTime();
};

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

function Chip({ active, color = brand.accent, onPress, children, small }) {
  const { c } = useApp();
  return (
    <Pressy
      onPress={onPress}
      style={{ paddingHorizontal: 16, height: small ? 40 : 44, borderRadius: 16, backgroundColor: active ? color : c.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
    >
      <T style={{ color: active ? brand.onAccent : c.text, fontSize: 14 }}>{children}</T>
    </Pressy>
  );
}

function Label({ children }) {
  const { c } = useApp();
  return <T style={{ color: c.sub, fontSize: 13, marginTop: 22, marginBottom: 10 }}>{children}</T>;
}

export default function TaskForm({ visible, task, defaultFolder, onClose }) {
  const { c, folders, saveTask, getAttachments } = useApp();
  const insets = useSafeAreaInsets();
  const saving = useRef(false);
  const [f, setF] = useState(blank);
  const [more, setMore] = useState(false);
  const [picker, setPicker] = useState(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    if (!visible) return;
    saving.current = false;
    setPicker(null);
    setMore(!!task);
    if (task) {
      setF({
        title: task.title, description: task.description || '', folder_id: task.folder_id, label: task.label || '',
        priority: task.priority, color: task.color, due_at: task.due_at, repeat: task.repeat, attachments: []
      });
      getAttachments(task.id).then((a) => setF((s) => ({ ...s, attachments: a })));
    } else {
      setF({ ...blank, folder_id: defaultFolder ?? null });
    }
  }, [visible, task]);

  const addFiles = async () => {
    try {
      const r = await DocumentPicker.getDocumentAsync({ multiple: true, copyToCacheDirectory: true });
      if (r.canceled) return;
      const added = [];
      for (const a of r.assets) added.push({ uri: await persistFile(a.uri, a.name), name: a.name });
      setF((s) => ({ ...s, attachments: [...s.attachments, ...added] }));
    } catch (e) {
      Alert.alert('Erro ao anexar', String(e && e.message ? e.message : e));
    }
  };

  const onDate = (e, d) => {
    const mode = picker;
    setPicker(null);
    if (e.type === 'dismissed' || !d) return;
    const base = new Date(f.due_at || Date.now());
    if (mode === 'date') base.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
    else base.setHours(d.getHours(), d.getMinutes(), 0, 0);
    set('due_at', base.getTime());
  };

  const quickDue = (add) => {
    const target = endOfDay(add);
    set('due_at', f.due_at && sameDay(f.due_at, target) ? null : target);
  };

  const save = async () => {
    if (saving.current) return;
    if (!f.title.trim()) {
      Alert.alert('Ops', 'Digite um título para a tarefa.');
      return;
    }
    saving.current = true;
    try {
      await saveTask({ ...f, id: task ? task.id : null });
      onClose();
    } catch (e) {
      saving.current = false;
      Alert.alert('Erro ao salvar', String(e && e.message ? e.message : e));
    }
  };

  const isToday = f.due_at && sameDay(f.due_at, Date.now());
  const isTomorrow = f.due_at && sameDay(f.due_at, endOfDay(1));
  const custom = f.due_at && !isToday && !isTomorrow;

  const input = { backgroundColor: c.surface, borderRadius: 20, paddingHorizontal: 18, color: c.text, fontFamily: 'Nunito_600SemiBold', fontSize: 16 };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose} />
          <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: '92%', paddingBottom: insets.bottom + 12 }}>
            <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
              <View style={{ width: 46, height: 5, borderRadius: 3, backgroundColor: c.sub, opacity: 0.6 }} />
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 }}>
                <TextInput
                  value={f.title}
                  onChangeText={(v) => set('title', v)}
                  placeholder="Nome da tarefa"
                  placeholderTextColor={c.sub}
                  autoFocus={!task}
                  returnKeyType="done"
                  onSubmitEditing={save}
                  style={[input, { flex: 1, height: 58, fontSize: 17 }]}
                />
                <Pressy onPress={save} style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: brand.accent, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="arrow-up" size={26} color={brand.onAccent} />
                </Pressy>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
                <Chip small active={!!isToday} onPress={() => quickDue(0)}>Hoje</Chip>
                <Chip small active={!!isTomorrow} onPress={() => quickDue(1)}>Amanhã</Chip>
                {custom ? <Chip small active onPress={() => set('due_at', null)}>{fmt(f.due_at)}</Chip> : null}
                <TextInput
                  value={f.label}
                  onChangeText={(v) => set('label', v)}
                  placeholder="# etiqueta"
                  placeholderTextColor={c.sub}
                  style={[input, { height: 40, minWidth: 130, paddingHorizontal: 14, fontSize: 14, borderRadius: 16 }]}
                />
              </ScrollView>

              {!more ? (
                <View style={{ flexDirection: 'row', marginTop: 14 }}>
                  <Chip small active={false} onPress={() => setMore(true)}>
                    <Ionicons name="chevron-up" size={16} color={c.text} /> Mais opções
                  </Chip>
                </View>
              ) : (
                <View>
                  <TextInput
                    value={f.description}
                    onChangeText={(v) => set('description', v)}
                    placeholder="Descrição (opcional)"
                    placeholderTextColor={c.sub}
                    multiline
                    style={[input, { minHeight: 96, paddingTop: 16, marginTop: 22, textAlignVertical: 'top' }]}
                  />

                  <Label>PASTA (OPCIONAL)</Label>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
                    <Chip active={f.folder_id === null} onPress={() => set('folder_id', null)}>Sem pasta</Chip>
                    {folders.map((x) => (
                      <Chip key={x.id} active={f.folder_id === x.id} color={x.color} onPress={() => set('folder_id', x.id)}>{x.name}</Chip>
                    ))}
                  </ScrollView>

                  <Label>PRIORIDADE</Label>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {priorities.map((p, i) => (
                      <Chip key={p.label} active={f.priority === i} color={p.color} onPress={() => set('priority', i)}>{p.label}</Chip>
                    ))}
                  </View>

                  <Label>COR</Label>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {taskColors.map((col) => (
                      <Pressy key={col} onPress={() => set('color', col)} style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: col, alignItems: 'center', justifyContent: 'center' }}>
                        {f.color === col ? <Ionicons name="checkmark" size={22} color="#FFFFFF" /> : null}
                      </Pressy>
                    ))}
                  </View>

                  <Label>PRAZO COM HORÁRIO</Label>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {f.due_at ? (
                      Platform.OS === 'ios' ? (
                        <DateTimePicker value={new Date(f.due_at)} mode="datetime" display="compact" onChange={(e, d) => d && set('due_at', d.getTime())} />
                      ) : (
                        <>
                          <Chip active onPress={() => setPicker('date')}>{fmt(f.due_at).split(' ')[0]}</Chip>
                          <Chip active onPress={() => setPicker('time')}>{fmt(f.due_at).split(' ')[1]}</Chip>
                        </>
                      )
                    ) : (
                      <Chip active={false} onPress={() => set('due_at', Date.now() + 3600000)}>Definir prazo</Chip>
                    )}
                    {f.due_at ? (
                      <Pressy onPress={() => set('due_at', null)} style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="close" size={20} color={c.sub} />
                      </Pressy>
                    ) : null}
                  </View>
                  {picker ? <DateTimePicker value={new Date(f.due_at || Date.now())} mode={picker} is24Hour onChange={onDate} /> : null}

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                    <T>Repetir todos os dias</T>
                    <Switch value={f.repeat === 'daily'} onValueChange={(v) => set('repeat', v ? 'daily' : 'none')} trackColor={{ false: c.high, true: brand.accent }} thumbColor="#FFFFFF" />
                  </View>

                  <Label>ANEXOS</Label>
                  {f.attachments.map((a, i) => (
                    <View key={a.uri + i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <Ionicons name="attach" size={20} color={brand.gold} />
                      <T bold={false} numberOfLines={1} style={{ flex: 1 }}>{a.name}</T>
                      <Pressy onPress={() => setF((s) => ({ ...s, attachments: s.attachments.filter((_, j) => j !== i) }))}>
                        <Ionicons name="close-circle" size={24} color={c.sub} />
                      </Pressy>
                    </View>
                  ))}
                  <View style={{ flexDirection: 'row' }}>
                    <Chip active={false} onPress={addFiles}>+ Adicionar anexo</Chip>
                  </View>

                  <Pressy onPress={save} style={{ height: 60, borderRadius: 30, backgroundColor: brand.accent, alignItems: 'center', justifyContent: 'center', marginTop: 30 }}>
                    <T style={{ color: brand.onAccent, fontSize: 17 }}>{task ? 'Salvar alterações' : 'Criar tarefa'}</T>
                  </Pressy>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
