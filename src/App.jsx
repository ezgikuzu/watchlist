import { useCallback, useEffect, useRef, useState } from 'react';
import Nav from './components/Nav.jsx';
import Home from './components/Home.jsx';
import Browse from './components/Browse.jsx';
import Stats from './components/Stats.jsx';
import DetailModal from './components/DetailModal.jsx';
import EntryForm from './components/EntryForm.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import HoverPreview from './components/HoverPreview.jsx';
import { TYPES, TYPE_KEYS, exportItems, today } from './store.js';
import { STORAGE_KEY, connect } from './api.js';
import { sanitizeList } from './shared/model.js';

const ROUTE_TYPE = Object.fromEntries(TYPE_KEYS.map((k) => [TYPES[k].route, k]));
const EMPTY_FILTERS = { status: '', rating: '', sort: 'recent' };

// "#kitaplar", "#tumu?durum=devam", "#istatistikler" gibi adresleri çözer.
function parseHash() {
  const [path, qs] = location.hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(qs || '');
  if (path === 'istatistikler') return { view: 'stats', key: path };
  if (path === 'tumu' || ROUTE_TYPE[path]) return { view: 'browse', key: path, type: ROUTE_TYPE[path] || '', params };
  return { view: 'home', key: 'home' };
}

export default function App() {
  const [items, setItems] = useState([]);
  const [repo, setRepo] = useState(null);
  const [route, setRoute] = useState(parseHash);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [detailId, setDetailId] = useState(null);
  const [form, setForm] = useState({ open: false, id: null });
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);
  const [preview, setPreview] = useState(null);
  const toastTimer = useRef(null);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const ask = (title, message, buttons) =>
    new Promise((resolve) => setConfirm({ title, message, buttons, resolve: (v) => { setConfirm(null); resolve(v); } }));

  // Bir veri işlemini çalıştırır; hata olursa kullanıcıya gösterir ve false döner.
  const run = async (fn) => {
    try { await fn(); return true; }
    catch (e) { notify(`Kaydedilemedi: ${e.message}`); return false; }
  };

  useEffect(() => {
    let alive = true;
    connect().then(async (r) => {
      const list = await r.list().catch((e) => { notify(e.message); return []; });
      if (alive) { setRepo(r); setItems(list); }
    });
    return () => { alive = false; };
  }, [notify]);

  // Sunucu modunda başka sekmede yapılan değişiklikleri sekmeye dönünce al.
  useEffect(() => {
    if (repo?.mode !== 'server') return;
    const refresh = () => { if (!document.hidden) repo.list().then(setItems).catch(() => {}); };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, [repo]);

  useEffect(() => {
    const onHash = () => {
      const r = parseHash();
      setRoute(r);
      if (r.view === 'browse') {
        setFilters((f) => ({ ...f, status: r.params.get('durum') || '', rating: r.params.get('puan') || '' }));
      }
      window.scrollTo(0, 0);
    };
    const onStorage = (e) => { if (e.key === STORAGE_KEY) connect().then((r) => r.mode === 'local' && r.list().then(setItems)); };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('hashchange', onHash); window.removeEventListener('storage', onStorage); };
  }, []);

  // İlk açılışta adresteki filtreleri uygula.
  useEffect(() => {
    if (route.view === 'browse') {
      setFilters((f) => ({ ...f, status: route.params.get('durum') || '', rating: route.params.get('puan') || '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onQuery = (q) => {
    setQuery(q);
    if (q && route.view !== 'browse') location.hash = '#tumu';
  };

  const closePreview = useCallback(() => setPreview(null), []);
  const showPreview = (id, rect) => setPreview({ id, rect });
  const openDetail = (id) => { setPreview(null); setDetailId(id); };
  const openEdit = (id) => { setPreview(null); setDetailId(null); setForm({ open: true, id }); };

  const finishEntry = async (id) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const ok = await run(async () => {
      const saved = await repo.update(id, { ...it, status: 'bitti', date: it.status === 'bitti' && it.date ? it.date : today() });
      setItems((list) => list.map((i) => (i.id === saved.id ? saved : i)));
    });
    if (ok) notify(`“${it.title}” bitirdiklerine eklendi`);
  };

  const saveEntry = async (data) => {
    const ok = await run(async () => {
      if (form.id) {
        const saved = await repo.update(form.id, data);
        setItems((list) => list.map((i) => (i.id === saved.id ? saved : i)));
      } else {
        const saved = await repo.create(data);
        setItems((list) => [...list, saved]);
      }
    });
    if (ok) {
      setForm({ open: false, id: null });
      notify(form.id ? 'Kayıt güncellendi' : 'Kayıt eklendi');
    }
  };

  const deleteEntry = async (id) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const ok = await ask('Kayıt silinsin mi?', `“${it.title}” kalıcı olarak silinecek.`, [
      { label: 'Vazgeç', value: false, kind: 'ghost' },
      { label: 'Sil', value: true, kind: 'danger-solid' },
    ]);
    if (ok && await run(async () => { await repo.remove(id); setItems((list) => list.filter((i) => i.id !== id)); })) {
      setDetailId(null);
      notify('Kayıt silindi');
    }
  };

  const doExport = () => {
    exportItems(items);
    notify(`${items.length} kayıt dışa aktarıldı`);
  };

  const doImport = async (file) => {
    let clean = null;
    try { clean = sanitizeList(JSON.parse(await file.text())); } catch { /* geçersiz JSON */ }
    if (!clean) {
      await ask('Dosya okunamadı', 'Lütfen bu uygulamadan dışa aktarılmış bir JSON dosyası seç.', [{ label: 'Tamam', value: true, kind: 'white' }]);
      return;
    }
    let mode = 'replace';
    if (items.length) {
      mode = await ask('İçe aktar', `${clean.length} kayıt bulundu. Mevcut ${items.length} kaydınla ne yapalım?`, [
        { label: 'Vazgeç', value: null, kind: 'ghost' },
        { label: 'Yerine koy', value: 'replace', kind: 'danger' },
        { label: 'Birleştir', value: 'merge', kind: 'white' },
      ]);
      if (!mode) return;
    }
    if (await run(async () => setItems(await repo.importItems(clean, mode)))) notify(`${clean.length} kayıt içe aktarıldı`);
  };

  const detailItem = items.find((i) => i.id === detailId) || null;
  const formItem = form.id ? items.find((i) => i.id === form.id) : null;
  const openNew = () => { setPreview(null); setForm({ open: true, id: null }); };

  return (
    <>
      <Nav active={route.key} query={query} onQuery={onQuery} onAdd={openNew} onExport={doExport} onImport={doImport} />

      {!repo ? (
        <div className="loading" aria-label="Yükleniyor"><span /></div>
      ) : (
        <>
          {route.view === 'home' && <Home items={items} onOpen={openDetail} onEdit={openEdit} onAdd={openNew} onPreview={showPreview} />}
          {route.view === 'browse' && (
            <Browse items={items} type={route.type} query={query} filters={filters} setFilters={setFilters} onOpen={openDetail} onAdd={openNew} onPreview={showPreview} />
          )}
        </>
      )}
      {repo && route.view === 'stats' && <Stats items={items} />}


      <HoverPreview item={items.find((i) => i.id === preview?.id)} rect={preview?.rect} onClose={closePreview}
        onOpen={openDetail} onEdit={openEdit} onFinish={finishEntry} />
      <DetailModal item={detailItem} items={items} onClose={() => setDetailId(null)} onEdit={openEdit} onDelete={deleteEntry} onFinish={finishEntry} onOpen={openDetail} />
      <EntryForm open={form.open} item={formItem} onClose={() => setForm({ open: false, id: null })} onSave={saveEntry} onError={notify} />
      <ConfirmDialog request={confirm} />
      <div className={`toast${toast ? ' show' : ''}`} role="status">{toast}</div>
    </>
  );
}
