import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useApp } from '../store';
import { GPressy as Pressy, T, fmt } from '../ui';
import { brand, priorities } from '../theme';

function Info({ icon, color, text }) {
  const { c } = useApp();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: (color || c.sub) + '25', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={20} color={color || c.sub} />
      </View>
      <T bold={false} style={{ flex: 1 }}>
        {text}
      </T>
    </View>
  );
}

export default function TaskSheet({ task, onClose, onEdit }) {
  const { c, folders, deleteTask, completeTask, getAttachments } = useApp();
  const ref = useRef(null);
  const last = useRef(null);
  const [atts, setAtts] = useState([]);
  if (task) last.current = task;
  const t = last.current;
  const snaps = useMemo(() => ['48%', '92%'], []);

  useEffect(() => {
    if (task) {
      ref.current?.present();
      getAttachments(task.id).then(setAtts);
    } else {
      ref.current?.dismiss();
    }
  }, [task]);

  if (!t) return null;
  const folder = folders.find((f) => f.id === t.folder_id);

  const confirmDelete = () =>
    Alert.alert('Excluir tarefa', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            onClose();
            await deleteTask(t.id);
          } catch (e) {
            Alert.alert('Erro ao excluir', String(e && e.message ? e.message : e));
          }
        }
      }
    ]);

  const finish = async () => {
    try {
      onClose();
      await completeTask(t);
    } catch (e) {
      Alert.alert('Erro ao concluir', String(e && e.message ? e.message : e));
    }
  };

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snaps}
      enableDynamicSizing={false}
      onDismiss={onClose}
      enablePanDownToClose
      backdropComponent={(p) => <BottomSheetBackdrop {...p} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />}
      backgroundStyle={{ backgroundColor: c.bg, borderRadius: 36 }}
      handleIndicatorStyle={{ backgroundColor: c.sub, width: 46, height: 5 }}
    >
      <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <View style={{ width: 18, height: 18, borderRadius: 6, backgroundColor: t.color }} />
          <T style={{ fontSize: 26, flex: 1 }}>{t.title}</T>
        </View>
        {t.description ? (
          <T bold={false} style={{ color: c.sub, marginBottom: 20, lineHeight: 22 }}>
            {t.description}
          </T>
        ) : null}
        {t.due_at ? <Info icon="calendar" color={brand.accent} text={fmt(t.due_at)} /> : null}
        {t.repeat === 'daily' ? <Info icon="repeat" color={brand.sage} text="Repete todos os dias" /> : null}
        <Info icon="flag" color={priorities[t.priority].color} text={'Prioridade: ' + priorities[t.priority].label} />
        {t.label ? <Info icon="pricetag" color={t.color} text={t.label} /> : null}
        <Info icon="folder" color={folder ? folder.color : c.sub} text={folder ? folder.name : 'Sem pasta'} />
        {atts.map((a) => (
          <Pressy key={a.id} onPress={() => Sharing.shareAsync(a.uri)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: brand.gold + '35', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="attach" size={20} color={brand.gold} />
            </View>
            <T bold={false} numberOfLines={1} style={{ flex: 1 }}>
              {a.name}
            </T>
          </Pressy>
        ))}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
          <Pressy outer={{ flex: 1 }} onPress={finish} style={{ height: 60, borderRadius: 30, backgroundColor: brand.accent, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <Ionicons name="checkmark-circle" size={22} color={brand.onAccent} />
            <T style={{ color: brand.onAccent }}>Concluir</T>
          </Pressy>
          <Pressy onPress={() => onEdit(t)} style={{ width: 60, height: 60, borderRadius: 22, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="create" size={24} color={c.text} />
          </Pressy>
          <Pressy onPress={confirmDelete} style={{ width: 60, height: 60, borderRadius: 22, backgroundColor: brand.red, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="trash" size={24} color="#FFFFFF" />
          </Pressy>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
