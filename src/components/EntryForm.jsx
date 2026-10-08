import { useRef, useState } from 'react';
import Modal from './Modal.jsx';
import Poster from './Poster.jsx';
import { STATUS, TYPES, TYPE_KEYS, processPoster, today } from '../store.js';

function FormBody({ item, onClose, onSave, onError }) {
  const [f, setF] = useState(() => ({
    type: item?.type || 'kitap',
    title: item?.title || '',
    creator: item?.creator || '',
    status: item?.status || 'bitti',
    date: item ? item.date || '' : today(),
    rating: item?.rating || 0,
    note: item?.note || '',
    poster: item?.poster || '',
  }));
  const [hover, setHover] = useState(0);
  const fileRef = useRef(null);
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const pickPoster = async (file) => {
    if (!file?.type.startsWith('image/')) return onError('Lütfen bir görsel dosyası seç.');
    try { set('poster', await processPoster(file)); }
    catch { onError('Görsel okunamadı.'); }
  };

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    onSave({ ...f, title: f.title.trim(), creator: f.creator.trim(), note: f.note.trim() });
  };

  return (
    <form className="entry" onSubmit={submit}>
      <div className="entry-head">
        <h2>{item ? 'Kaydı düzenle' : 'Yeni kayıt'}</h2>
        <button type="button" className="close" onClick={onClose} aria-label="Kapat">✕</button>
      </div>
      <div className="entry-grid">
        <div className="entry-poster">
          <Poster item={f} shape="port" />
          <div className="entry-poster-btns">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
              {f.poster ? 'Kapağı değiştir' : 'Kapak ekle'}
            </button>
            {f.poster && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('poster', '')}>Kaldır</button>}
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pickPoster(e.target.files[0]); e.target.value = ''; }} />
        </div>

        <div className="entry-fields">
          <div className="seg" role="radiogroup" aria-label="Tür">
            {TYPE_KEYS.map((k) => (
              <button type="button" key={k} role="radio" aria-checked={f.type === k} className={f.type === k ? 'on' : ''} onClick={() => set('type', k)}>
                {TYPES[k].icon} {TYPES[k].label}
              </button>
            ))}
          </div>
          <label>Ad
            <input value={f.title} onChange={(e) => set('title', e.target.value)} required maxLength={200} autoFocus autoComplete="off" />
          </label>
          <label>{TYPES[f.type].creator}
            <input value={f.creator} onChange={(e) => set('creator', e.target.value)} maxLength={200} autoComplete="off" />
          </label>
          <div className="row2">
            <label>Durum
              <select value={f.status} onChange={(e) => set('status', e.target.value)}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label>Tarih
              <input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} />
            </label>
          </div>
          <div className="field">
            <span className="field-label">Puan</span>
            <div className="star-input" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} aria-label={`${n} yıldız`}
                  className={n <= (hover || f.rating) ? 'on' : ''}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => set('rating', f.rating === n ? 0 : n)}>★</button>
              ))}
              {f.rating > 0 && <button type="button" className="clear" onClick={() => set('rating', 0)}>temizle</button>}
            </div>
          </div>
          <label>Kısa not
            <textarea rows={3} value={f.note} onChange={(e) => set('note', e.target.value)} maxLength={1000} />
          </label>
        </div>
      </div>
      <div className="entry-foot">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Vazgeç</button>
        <button type="submit" className="btn btn-white">Kaydet</button>
      </div>
    </form>
  );
}

export default function EntryForm({ open, item, onClose, onSave, onError }) {
  return (
    <Modal open={open} onClose={onClose} className="entry-dlg" closeOnBackdrop={false}>
      <FormBody item={item} onClose={onClose} onSave={onSave} onError={onError} />
    </Modal>
  );
}
