import React, { useState } from 'react';
import { Alert, ScrollView, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../store';
import { PageHeader, Pressy, Surface, T } from '../ui';
import { brand } from '../theme';

export default function Settings({ onBack }) {
  const { c, dark, user, settings, setPref, updateAccount, logout, deleteAccount } = useApp();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [cur, setCur] = useState('');
  const [nw, setNw] = useState('');
  const [msg, setMsg] = useState(null);

  const save = async () => {
    try {
      const e = await updateAccount({ name, email, currentPw: cur, newPw: nw });
      if (e) {
        setMsg({ ok: false, text: e });
      } else {
        setMsg({ ok: true, text: 'Conta atualizada' });
        setCur('');
        setNw('');
      }
    } catch (e) {
      setMsg({ ok: false, text: String(e && e.message ? e.message : e) });
    }
  };

  const confirmDelete = () =>
    Alert.alert('Excluir conta', 'Todas as suas tarefas, pastas e XP serão apagados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: deleteAccount }
    ]);

  const input = { height: 54, backgroundColor: c.high, borderRadius: 18, paddingHorizontal: 20, color: c.text, fontFamily: 'Nunito_600SemiBold', fontSize: 16, marginBottom: 10 };

  const row = (icon, label, value, onChange) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: brand.accent + '25', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={icon} size={21} color={brand.accent} />
        </View>
        <T>{label}</T>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: c.high, true: brand.accent }} thumbColor="#FFFFFF" />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <PageHeader title="Configurações" onBack={onBack} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 4, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
        <T style={{ color: c.sub, fontSize: 13, marginBottom: 10 }}>CONTA</T>
        <Surface radius={32} style={{ padding: 18, marginBottom: 22 }}>
          <TextInput value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor={c.sub} style={input} />
          <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={c.sub} autoCapitalize="none" keyboardType="email-address" style={input} />
          <TextInput value={cur} onChangeText={setCur} placeholder="Senha atual (para trocar a senha)" placeholderTextColor={c.sub} secureTextEntry style={input} />
          <TextInput value={nw} onChangeText={setNw} placeholder="Nova senha" placeholderTextColor={c.sub} secureTextEntry style={input} />
          {msg ? <T style={{ color: msg.ok ? brand.sage : brand.red, textAlign: 'center', marginBottom: 10, fontSize: 14 }}>{msg.text}</T> : null}
          <Pressy onPress={save} style={{ height: 56, borderRadius: 28, backgroundColor: brand.accent, alignItems: 'center', justifyContent: 'center' }}>
            <T style={{ color: brand.onAccent }}>Salvar conta</T>
          </Pressy>
        </Surface>

        <T style={{ color: c.sub, fontSize: 13, marginBottom: 10 }}>PREFERÊNCIAS</T>
        <Surface radius={32} style={{ padding: 16, marginBottom: 22 }}>
          {row('moon', 'Modo escuro', dark, (v) => setPref('theme', v ? 'dark' : 'light'))}
          {row('water', 'Liquid glass', settings.glass, (v) => setPref('glass', v))}
          {row('notifications', 'Notificações de prazo', settings.notify, (v) => setPref('notify', v))}
        </Surface>

        <View style={{ gap: 12 }}>
          <Pressy onPress={logout} style={{ height: 58, borderRadius: 29, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <Ionicons name="log-out" size={22} color={c.text} />
            <T>Sair</T>
          </Pressy>
          <Pressy onPress={confirmDelete} style={{ height: 58, borderRadius: 29, backgroundColor: brand.red, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <Ionicons name="trash" size={22} color="#FFFFFF" />
            <T style={{ color: '#FFFFFF' }}>Excluir conta</T>
          </Pressy>
        </View>
      </ScrollView>
    </View>
  );
}
