// Tarayıcı ve sunucunun ortak kullandığı veri kuralları. Tarayıcıya özgü API kullanmaz.

export const TYPE_IDS = ['kitap', 'dizi', 'film'];
export const STATUS_IDS = ['bitti', 'devam', 'liste'];

const POSTER_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_POSTER_LENGTH = 1_500_000;

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

const str = (v, max) => String(v ?? '').trim().slice(0, max);

// Tek bir kaydı doğrulayıp temizler. Adı olmayan kayıtlar için null döner.
export function sanitizeItem(x, { keepId = true } = {}) {
  if (!x || typeof x !== 'object') return null;
  const title = str(x.title, 200);
  if (!title) return null;
  const now = Date.now();
  const poster = typeof x.poster === 'string' && x.poster.length <= MAX_POSTER_LENGTH && POSTER_RE.test(x.poster) ? x.poster : '';
  return {
    id: keepId && typeof x.id === 'string' && /^[\w-]{1,64}$/.test(x.id) ? x.id : newId(),
    type: TYPE_IDS.includes(x.type) ? x.type : 'kitap',
    title,
    creator: str(x.creator, 200),
    status: STATUS_IDS.includes(x.status) ? x.status : 'liste',
    date: DATE_RE.test(x.date) ? x.date : '',
    rating: Math.max(0, Math.min(5, Math.round(Number(x.rating) || 0))),
    note: str(x.note, 1000),
    poster,
    created: Number(x.created) || now,
    updated: Number(x.updated) || now,
  };
}

// Yedek dosyasından (dizi ya da { items: [...] }) kayıt listesi çıkarır.
export function sanitizeList(parsed) {
  const arr = Array.isArray(parsed) ? parsed : parsed?.items;
  if (!Array.isArray(arr)) return null;
  const clean = arr.map((x) => sanitizeItem(x)).filter(Boolean);
  return clean.length ? clean : null;
}
