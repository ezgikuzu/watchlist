// Veri katmanı: sunucu üzerinden açıldıysa SQLite veritabanını (REST API),
// dosya olarak açıldıysa tarayıcı deposunu (localStorage) kullanır.
import { newId, sanitizeItem } from './shared/model.js';

export const STORAGE_KEY = 'takipListem.v1';

async function request(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Sunucu hatası (${res.status})`);
  return data;
}

const serverRepo = {
  mode: 'server',
  list: () => request('GET', '/api/items'),
  create: (data) => request('POST', '/api/items', data),
  update: (id, data) => request('PUT', `/api/items/${encodeURIComponent(id)}`, data),
  remove: (id) => request('DELETE', `/api/items/${encodeURIComponent(id)}`),
  importItems: async (items, mode) => { await request('POST', '/api/import', { items, mode }); return serverRepo.list(); },
};

function readLocal() {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function writeLocal(items) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    throw new Error('Tarayıcı depolama alanı dolmuş olabilir. Bazı kapak görsellerini kaldırmayı dene.');
  }
}

const localRepo = {
  mode: 'local',
  list: async () => readLocal(),
  create: async (data) => {
    const now = Date.now();
    const item = { ...sanitizeItem(data, { keepId: false }), id: newId(), created: now, updated: now };
    writeLocal([...readLocal(), item]);
    return item;
  },
  update: async (id, data) => {
    const items = readLocal();
    const old = items.find((i) => i.id === id);
    if (!old) throw new Error('Kayıt bulunamadı');
    const item = { ...sanitizeItem({ ...data, id }), created: old.created, updated: Date.now() };
    writeLocal(items.map((i) => (i.id === id ? item : i)));
    return item;
  },
  remove: async (id) => { writeLocal(readLocal().filter((i) => i.id !== id)); return null; },
  importItems: async (items, mode) => {
    let next = items;
    if (mode === 'merge') {
      const map = new Map(readLocal().map((i) => [i.id, i]));
      items.forEach((i) => map.set(i.id, i));
      next = [...map.values()];
    }
    writeLocal(next);
    return next;
  },
};

export async function connect() {
  if (location.protocol.startsWith('http')) {
    try {
      const res = await fetch('/api/health');
      if (res.ok) return serverRepo;
    } catch { /* sunucu yok, tarayıcı deposuna düş */ }
  }
  return localRepo;
}
