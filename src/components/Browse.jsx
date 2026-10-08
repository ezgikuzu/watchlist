import Card from './Card.jsx';
import { STATUS, TYPES, TYPE_KEYS, lower } from '../store.js';

const SORTS = {
  recent: { label: 'Tarihe göre (yeni)', fn: (a, b) => (b.date || '').localeCompare(a.date || '') || (b.updated || 0) - (a.updated || 0) },
  added: { label: 'Son eklenen', fn: (a, b) => (b.created || 0) - (a.created || 0) },
  rating: { label: 'Puana göre', fn: (a, b) => (b.rating || 0) - (a.rating || 0) || a.title.localeCompare(b.title, 'tr') },
  title: { label: 'Ada göre (A–Z)', fn: (a, b) => a.title.localeCompare(b.title, 'tr') },
};

function matchRating(it, r) {
  if (r === '') return true;
  const n = Number(r);
  if (n === 0) return !it.rating;
  if (n === 5) return it.rating === 5;
  return (it.rating || 0) >= n;
}

export default function Browse({ items, type, query, filters, setFilters, onOpen, onAdd, onPreview }) {
  const q = lower(query.trim());
  const list = items
    .filter((it) =>
      (!type || it.type === type) &&
      (!filters.status || it.status === filters.status) &&
      matchRating(it, filters.rating) &&
      (!q || lower(it.title).includes(q) || lower(it.creator).includes(q)))
    .sort(SORTS[filters.sort]?.fn || SORTS.recent.fn);

  const title = q ? `“${query.trim()}” için sonuçlar` : type ? TYPES[type].plural : 'Listem';
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const filtered = filters.status || filters.rating !== '';

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>{title}</h1>
          <p className="muted">{list.length} kayıt{items.length !== list.length ? ` · toplam ${items.length}` : ''}</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="chips" role="tablist" aria-label="Tür">
          <a href="#tumu" className={!type ? 'chip active' : 'chip'}>Tümü</a>
          {TYPE_KEYS.map((k) => (
            <a key={k} href={`#${TYPES[k].route}`} className={type === k ? 'chip active' : 'chip'}>
              <i style={{ background: TYPES[k].color }} />{TYPES[k].label}
            </a>
          ))}
        </div>
        <div className="selects">
          <select value={filters.status} onChange={set('status')} aria-label="Durum">
            <option value="">Tüm durumlar</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.rating} onChange={set('rating')} aria-label="Puan">
            <option value="">Tüm puanlar</option>
            <option value="5">5 yıldız</option>
            <option value="4">4+ yıldız</option>
            <option value="3">3+ yıldız</option>
            <option value="2">2+ yıldız</option>
            <option value="1">1+ yıldız</option>
            <option value="0">Puansız</option>
          </select>
          <select value={filters.sort} onChange={set('sort')} aria-label="Sıralama">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
      </div>

      {list.length ? (
        <div className="grid">
          {list.map((it) => <Card key={it.id} item={it} onOpen={onOpen} onPreview={onPreview} />)}
        </div>
      ) : (
        <div className="empty">
          <strong>{items.length ? 'Sonuç bulunamadı' : 'Henüz kayıt yok'}</strong>
          <p>{items.length ? 'Aramayı ya da filtreleri değiştirmeyi dene.' : 'İlk kitabını, dizini ya da filmini ekleyerek başla.'}</p>
          {filtered && <button className="btn btn-ghost" onClick={() => setFilters((f) => ({ ...f, status: '', rating: '' }))}>Filtreleri temizle</button>}
          {!items.length && <button className="btn btn-red" onClick={onAdd}>＋ Yeni kayıt</button>}
        </div>
      )}
    </main>
  );
}
