import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useApp } from '../store';
import { Logo, Pressy, T } from '../ui';
import { brand } from '../theme';

export default function Auth() {
  const { c, login, register } = useApp();
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy) return;
    if (mode === 'register' && !name.trim()) return setErr('Digite seu nome');
    if (!email.includes('@')) return setErr('E-mail inválido');
    if (pw.length < 4) return setErr('A senha precisa ter ao menos 4 caracteres');
    setBusy(true);
    try {
      const e = mode === 'login' ? await login(email, pw) : await register(name, email, pw);
      if (e) setErr(e);
    } catch (e) {
      setErr(String(e && e.message ? e.message : e));
    }
    setBusy(false);
  };

  const input = { height: 58, backgroundColor: c.surface, borderRadius: 20, paddingHorizontal: 22, color: c.text, fontFamily: 'Nunito_600SemiBold', fontSize: 16, marginBottom: 12 };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 28 }} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeIn.duration(350)} style={{ alignItems: 'center', marginBottom: 32 }}>
          <Logo size={112} />
          <T style={{ fontSize: 34, marginTop: 18 }}>List App</T>
          <T bold={false} style={{ color: c.sub, marginTop: 4 }}>{mode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}</T>
        </Animated.View>
        <Animated.View entering={FadeIn.duration(350).delay(80)}>
          {mode === 'register' ? <TextInput value={name} onChangeText={setName} placeholder="Nome" placeholderTextColor={c.sub} style={input} /> : null}
          <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" placeholderTextColor={c.sub} autoCapitalize="none" keyboardType="email-address" style={input} />
          <TextInput value={pw} onChangeText={setPw} placeholder="Senha" placeholderTextColor={c.sub} secureTextEntry style={input} />
          {err ? <T style={{ color: brand.red, textAlign: 'center', marginBottom: 10, fontSize: 14 }}>{err}</T> : null}
          <Pressy onPress={submit} style={{ height: 62, borderRadius: 31, backgroundColor: brand.accent, alignItems: 'center', justifyContent: 'center', marginTop: 6 }}>
            <T style={{ color: brand.onAccent, fontSize: 18 }}>{mode === 'login' ? 'Entrar' : 'Criar conta'}</T>
          </Pressy>
          <Pressy
            onPress={() => {
              setErr('');
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            style={{ alignItems: 'center', padding: 18 }}
          >
            <T style={{ color: brand.accent }}>{mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}</T>
          </Pressy>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
