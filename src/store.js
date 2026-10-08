import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Platform, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { getDb } from './db';
import { palettes } from './theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

const Ctx = createContext(null);

export const useApp = () => useContext(Ctx);

const defaults = { theme: 'system', glass: true, notify: true };

const hash = (s) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, s);

export async function persistFile(uri, name) {
  const safe = (name || 'arquivo').replace(/[^\w.\-]/g, '_');
  const dest = FileSystem.documentDirectory + Date.now() + '_' + safe;
  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest;
}

async function readMap() {
  try {
    return JSON.parse((await AsyncStorage.getItem('notifs')) || '{}');
  } catch (e) {
    return {};
  }
}

async function cancelNotif(id) {
  const m = await readMap();
  if (m[id]) {
    try {
      await Notifications.cancelScheduledNotificationAsync(m[id]);
    } catch (e) {
      console.error(e);
    }
    delete m[id];
    await AsyncStorage.setItem('notifs', JSON.stringify(m));
  }
}

async function scheduleNotif(id, title, due, enabled) {
  await cancelNotif(id);
  if (!enabled || !due) return;
  const now = Date.now();
  if (due <= now + 10000) return;
  const when = Math.max(due - 30 * 60000, now + 10000);
  try {
    const nid = await Notifications.scheduleNotificationAsync({
      content: { title: 'Tarefa perto de vencer', body: title, sound: true },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(when), channelId: 'tasks' }
    });
    const m = await readMap();
    m[id] = nid;
    await AsyncStorage.setItem('notifs', JSON.stringify(m));
  } catch (e) {
    console.error(e);
  }
}

async function clearNotifs() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.error(e);
  }
  await AsyncStorage.removeItem('notifs');
}

async function ensureNotifs() {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('tasks', {
        name: 'Tarefas',
        importance: Notifications.AndroidImportance.HIGH
      });
    }
    const cur = await Notifications.getPermissionsAsync();
    if (cur.status !== 'granted') await Notifications.requestPermissionsAsync();
  } catch (e) {
    console.error(e);
  }
}

export function AppProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [folders, setFolders] = useState([]);
  const [settings, setSettings] = useState(defaults);
  const [scheme, setScheme] = useState(Appearance.getColorScheme());
  const player = useAudioPlayer(require('../assets/plop.wav'));

  const dark = settings.theme === 'system' ? scheme === 'dark' : settings.theme === 'dark';
  const c = palettes[dark ? 'dark' : 'light'];

  const load = useCallback(async (uid) => {
    const db = await getDb();
    const now = Date.now();
    const late = await db.getAllAsync(
      'SELECT id FROM tasks WHERE user_id = ? AND completed_at IS NULL AND due_at IS NOT NULL AND due_at < ? AND penalized = 0',
      [uid, now]
    );
    if (late.length) {
      await db.runAsync(
        'UPDATE tasks SET penalized = 1 WHERE user_id = ? AND completed_at IS NULL AND due_at IS NOT NULL AND due_at < ? AND penalized = 0',
        [uid, now]
      );
      await db.runAsync('UPDATE users SET xp = MAX(0, xp - ?) WHERE id = ?', [late.length * 10, uid]);
    }
    const u = await db.getFirstAsync('SELECT * FROM users WHERE id = ?', [uid]);
    if (!u) {
      setUser(null);
      return;
    }
    setUser(u);
    setFolders(await db.getAllAsync('SELECT * FROM folders WHERE user_id = ? ORDER BY id', [uid]));
    setTasks(
      await db.getAllAsync(
        'SELECT t.*, (SELECT COUNT(*) FROM attachments a WHERE a.task_id = t.id) AS att FROM tasks t WHERE t.user_id = ? ORDER BY t.due_at IS NULL, t.due_at, t.id DESC',
        [uid]
      )
    );
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setScheme(colorScheme));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await setAudioModeAsync({ playsInSilentMode: true });
        const s = await AsyncStorage.getItem('settings');
        if (s) setSettings({ ...defaults, ...JSON.parse(s) });
        const id = await AsyncStorage.getItem('session');
        if (id) await load(Number(id));
      } catch (e) {
        console.error(e);
      }
      setReady(true);
    })();
  }, [load]);

  useEffect(() => {
    if (user?.id && settings.notify) ensureNotifs();
  }, [user?.id, settings.notify]);

  useEffect(() => {
    if (!user?.id) return undefined;
    const timer = setInterval(() => load(user.id), 60000);
    return () => clearInterval(timer);
  }, [user?.id, load]);

  const startSession = async (id) => {
    await AsyncStorage.setItem('session', String(id));
    await load(id);
  };

  const register = async (name, email, pw) => {
    const db = await getDb();
    const e = email.trim().toLowerCase();
    const ex = await db.getFirstAsync('SELECT id FROM users WHERE email = ?', [e]);
    if (ex) return 'E-mail já cadastrado';
    const r = await db.runAsync(
      'INSERT INTO users (name, email, password, created_at) VALUES (?, ?, ?, ?)',
      [name.trim(), e, await hash(pw), Date.now()]
    );
    await startSession(r.lastInsertRowId);
    return null;
  };

  const login = async (email, pw) => {
    const db = await getDb();
    const u = await db.getFirstAsync('SELECT id FROM users WHERE email = ? AND password = ?', [
      email.trim().toLowerCase(),
      await hash(pw)
    ]);
    if (!u) return 'E-mail ou senha incorretos';
    await startSession(u.id);
    return null;
  };

  const logout = async () => {
    await AsyncStorage.removeItem('session');
    setUser(null);
    setTasks([]);
    setFolders([]);
  };

  const deleteAccount = async () => {
    const db = await getDb();
    await db.runAsync('DELETE FROM users WHERE id = ?', [user.id]);
    await clearNotifs();
    await logout();
  };

  const updateAccount = async ({ name, email, currentPw, newPw }) => {
    const db = await getDb();
    const e = email.trim().toLowerCase();
    if (!name.trim()) return 'Digite seu nome';
    if (!e.includes('@')) return 'E-mail inválido';
    const ex = await db.getFirstAsync('SELECT id FROM users WHERE email = ? AND id <> ?', [e, user.id]);
    if (ex) return 'E-mail já cadastrado';
    if (newPw) {
      if (newPw.length < 4) return 'A nova senha precisa ter ao menos 4 caracteres';
      const ok = await db.getFirstAsync('SELECT id FROM users WHERE id = ? AND password = ?', [
        user.id,
        await hash(currentPw || '')
      ]);
      if (!ok) return 'Senha atual incorreta';
      await db.runAsync('UPDATE users SET password = ? WHERE id = ?', [await hash(newPw), user.id]);
    }
    await db.runAsync('UPDATE users SET name = ?, email = ? WHERE id = ?', [name.trim(), e, user.id]);
    await load(user.id);
    return null;
  };

  const setPhoto = async (uri) => {
    const db = await getDb();
    await db.runAsync('UPDATE users SET photo = ? WHERE id = ?', [uri, user.id]);
    await load(user.id);
  };

  const setPref = async (key, value) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    await AsyncStorage.setItem('settings', JSON.stringify(next));
    if (key === 'notify') {
      if (!value) {
        await clearNotifs();
      } else {
        await ensureNotifs();
        for (const t of tasks.filter((x) => !x.completed_at)) await scheduleNotif(t.id, t.title, t.due_at, true);
      }
    }
  };

  const addFolder = async (name, color) => {
    const db = await getDb();
    await db.runAsync('INSERT INTO folders (user_id, name, color) VALUES (?, ?, ?)', [user.id, name.trim(), color]);
    await load(user.id);
  };

  const deleteFolder = async (id) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM folders WHERE id = ?', [id]);
    await load(user.id);
  };

  const saveTask = async (d) => {
    const db = await getDb();
    let id = d.id;
    if (id) {
      await db.runAsync(
        'UPDATE tasks SET folder_id = ?, title = ?, description = ?, label = ?, priority = ?, color = ?, due_at = ?, repeat = ?, penalized = 0 WHERE id = ?',
        [d.folder_id, d.title.trim(), d.description.trim() || null, d.label.trim() || null, d.priority, d.color, d.due_at, d.repeat, id]
      );
      await db.runAsync('DELETE FROM attachments WHERE task_id = ?', [id]);
    } else {
      const r = await db.runAsync(
        'INSERT INTO tasks (user_id, folder_id, title, description, label, priority, color, due_at, repeat, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [user.id, d.folder_id, d.title.trim(), d.description.trim() || null, d.label.trim() || null, d.priority, d.color, d.due_at, d.repeat, Date.now()]
      );
      id = r.lastInsertRowId;
    }
    for (const a of d.attachments) {
      await db.runAsync('INSERT INTO attachments (task_id, uri, name) VALUES (?, ?, ?)', [id, a.uri, a.name]);
    }
    await scheduleNotif(id, d.title.trim(), d.due_at, settings.notify);
    await load(user.id);
  };

  const deleteTask = async (id) => {
    const db = await getDb();
    await db.runAsync('DELETE FROM tasks WHERE id = ?', [id]);
    await cancelNotif(id);
    await load(user.id);
  };

  const getAttachments = async (taskId) => {
    const db = await getDb();
    return db.getAllAsync('SELECT * FROM attachments WHERE task_id = ?', [taskId]);
  };

  const completeTask = async (t) => {
    const db = await getDb();
    const now = Date.now();
    if (t.repeat === 'daily') {
      await db.runAsync(
        'INSERT INTO tasks (user_id, folder_id, title, description, label, priority, color, due_at, repeat, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [t.user_id, t.folder_id, t.title, t.description, t.label, t.priority, t.color, t.due_at, 'none', now, t.created_at]
      );
      let next = (t.due_at || now) + 86400000;
      while (next <= now) next += 86400000;
      await db.runAsync('UPDATE tasks SET due_at = ?, penalized = 0 WHERE id = ?', [next, t.id]);
      await scheduleNotif(t.id, t.title, next, settings.notify);
    } else {
      await db.runAsync('UPDATE tasks SET completed_at = ? WHERE id = ?', [now, t.id]);
      await cancelNotif(t.id);
    }
    await db.runAsync('UPDATE users SET xp = xp + ? WHERE id = ?', [10 + t.priority * 5, user.id]);
    try {
      player.seekTo(0);
      player.play();
    } catch (e) {
      console.error(e);
    }
    await load(user.id);
  };

  const exportTasks = async () => {
    const open = tasks.filter((t) => !t.completed_at);
    const lines = open.map((t) => {
      const f = folders.find((x) => x.id === t.folder_id);
      const d = t.due_at ? ' (' + new Date(t.due_at).toLocaleString('pt-BR') + ')' : '';
      return '• ' + t.title + d + (f ? ' [' + f.name + ']' : '');
    });
    await Share.share({ message: 'Minhas tarefas - List App\n\n' + (lines.join('\n') || 'Nenhuma tarefa pendente.') });
  };

  const value = useMemo(
    () => ({
      ready, user, tasks, folders, settings, c, dark, glass: settings.glass,
      register, login, logout, deleteAccount, updateAccount, setPhoto, setPref, addFolder, deleteFolder,
      saveTask, deleteTask, getAttachments, completeTask, exportTasks
    }),
    [ready, user, tasks, folders, settings, scheme] // eslint-disable-line
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
