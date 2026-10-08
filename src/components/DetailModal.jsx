import { useEffect, useRef } from 'react';
import Modal from './Modal.jsx';
import Poster from './Poster.jsx';
import { STATUS, TYPES, fmtDate, yearOf } from '../store.js';

export default function DetailModal({ item, items, onClose, onEdit, onDelete, onFinish, onOpen }) {
  const scroller = useRef(null);
  useEffect(() => { scroller.current?.scrollTo(0, 0); }, [item?.id]);
  if (!item) return <Modal open={false} onClose={onClose} />;

  const T = TYPES[item.type] || TYPES.kitap;
  const year = yearOf(item);
  const similar = items
    .filter((i) => i.id !== item.id && (i.type === item.type || (item.creator && i.creator === item.creator)))
    .sort((a, b) => (b.creator === item.creator) - (a.creator === item.creator) || (b.rating || 0) - (a.rating || 0))
    .slice(0, 9);

  return (
    <Modal open onClose={onClose} className="detail">
      <div className="det" ref={scroller}>
        <button className="det-close" onClick={onClose} aria-label="Kapat">✕</button>
        <div className="det-hero">
          <Poster item={item} shape="fill" showTitle={false} />
          <div className="det-hero-fade" />
          <div className="det-hero-info">
            <h2>{item.title}</h2>
            <div className="det-btns">
              <button className="btn btn-white btn-lg" onClick={() => onEdit(item.id)}>✎ Düzenle</button>
              {item.status !== 'bitti' && (
                <button className="circle lg" title="Bitirdim olarak işaretle" onClick={() => onFinish(item.id)}>✓</button>
              )}
              <button className="circle lg" title="Sil" onClick={() => onDelete(item.id)}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="det-body">
          <div className="det-main">
            <div className="preview-meta">
              {item.rating > 0 && <span className="match">{item.rating * 20}% beğeni</span>}
              {year && <span>{year}</span>}
              <span className="maturity">{STATUS[item.status]}</span>
              <span className="hd">{T.label.toLocaleUpperCase('tr')}</span>
            </div>
            {item.rating > 0 && <div className="det-stars" aria-label={`${item.rating} yıldız`}>{'★'.repeat(item.rating)}<span>{'★'.repeat(5 - item.rating)}</span></div>}
            {item.note ? <p className="det-note">{item.note}</p> : <p className="det-note muted">Henüz not eklemedin.</p>}
          </div>
          <div className="det-side">
            {item.creator && <p><span>{T.creator}:</span> {item.creator}</p>}
            <p><span>Tür:</span> {T.label}</p>
            <p><span>Durum:</span> {STATUS[item.status]}</p>
            {item.date && <p><span>Tarih:</span> {fmtDate(item.date)}</p>}
          </div>
        </div>

        {similar.length > 0 && (
          <div className="det-similar">
            <h3>Benzerleri</h3>
            <div className="sim-grid">
              {similar.map((s) => (
                <button className="sim" key={s.id} onClick={() => onOpen(s.id)}>
                  <Poster item={s} shape="land" />
                  <div className="sim-body">
                    <div className="sim-top">
                      <span>
                        {s.rating > 0 && <span className="match">{s.rating * 20}% beğeni</span>}
                        <span className="maturity">{STATUS[s.status]}</span>
                      </span>
                      <span className="muted">{yearOf(s) || ''}</span>
                    </div>
                    <div className="sim-title">{s.title}</div>
                    <p>{s.note || s.creator || TYPES[s.type].label}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
