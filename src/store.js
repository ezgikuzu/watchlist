// Arayüz sabitleri ve yardımcılar.

export const TYPES = {
  kitap: { label: 'Kitap', plural: 'Kitaplar', route: 'kitaplar', icon: '📖', creator: 'Yazar', color: 'var(--kitap)' },
  dizi: { label: 'Dizi', plural: 'Diziler', route: 'diziler', icon: '📺', creator: 'Yönetmen / Yapımcı', color: 'var(--dizi)' },
  film: { label: 'Film', plural: 'Filmler', route: 'filmler', icon: '🎬', creator: 'Yönetmen', color: 'var(--film)' },
};
export const TYPE_KEYS = Object.keys(TYPES);

export const STATUS = { bitti: 'Bitirdim', devam: 'Devam ediyorum', liste: 'Listemde' };

export const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
export const MONTHS_LONG = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export const lower = (s) => String(s || '').toLocaleLowerCase('tr');

export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtDate(s) {
  if (!s) return '';
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS_LONG[m - 1]} ${y}`;
}

export const yearOf = (it) => (it.date ? Number(it.date.slice(0, 4)) : null);
export const fmtAvg = (n) => n.toFixed(1).replace('.', ',');

export function exportItems(items) {
  const payload = { app: 'takip-listem', version: 3, exported: new Date().toISOString(), items };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `takip-listem-${today()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Kapak görselini 2:3 oranında kırpıp küçültür, JPEG data URL döner.
export async function processPoster(file) {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const W = 360, H = 540;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const scale = Math.max(W / img.width, H / img.height);
    const dw = img.width * scale, dh = img.height * scale;
    canvas.getContext('2d').drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
    return canvas.toDataURL('image/jpeg', 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

// Kapak görseli olmayan kayıtlar için isimden türetilen sabit renkler.
const GRADS = [
  ['#2b4f96', '#0b1630'], ['#8a2337', '#1f0910'], ['#1f6e58', '#08201a'], ['#6342a0', '#170f29'],
  ['#9a5a12', '#26160a'], ['#2d6680', '#0a1a22'], ['#86306f', '#220a1c'], ['#4f6623', '#131a09'],
];
export function gradientFor(it) {
  let h = 0;
  for (const c of it.title + it.type) h = (h * 31 + c.codePointAt(0)) | 0;
  return GRADS[Math.abs(h) % GRADS.length];
}

// Vitrinde dönecek kayıtlar: önce devam edilenler, sonra en yüksek puanlı bitirilenler.
export function pickFeatured(items, limit = 5) {
  const byUpdated = (a, b) => (b.updated || 0) - (a.updated || 0);
  const devam = items.filter((i) => i.status === 'devam').sort(byUpdated);
  const bitti = items
    .filter((i) => i.status === 'bitti' && i.rating >= 4)
    .sort((a, b) => b.rating - a.rating || (b.date || '').localeCompare(a.date || ''));
  const picked = [...devam, ...bitti].slice(0, limit);
  return picked.length ? picked : [...items].sort(byUpdated).slice(0, 1);
}
