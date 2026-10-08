import { useEffect } from 'react';
import Poster from './Poster.jsx';
import { STATUS, TYPES, yearOf } from '../store.js';

// Kartın üzerinde beklenince açılan büyütülmüş önizleme (Netflix "mini modal").
export default function HoverPreview({ item, rect, onClose, onOpen, onEdit, onFinish }) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('scroll', close, { passive: true, capture: true });
    window.addEventListener('resize', close);
    return () => { window.removeEventListener('scroll', close, { capture: true }); window.removeEventListener('resize', close); };
  }, [onClose]);

  if (!item || !rect) return null;
  const T = TYPES[item.type] || TYPES.kitap;
  const year = yearOf(item);
  const w = Math.max(300, rect.width * 1.5);
  const imgH = (w * 9) / 16;
  const left = Math.min(Math.max(rect.left + rect.width / 2 - w / 2, 12), window.innerWidth - w - 12);
  const top = Math.max(rect.top + rect.height / 2 - imgH / 2 - 10, 72);
  const origin = rect.left + rect.width / 2 - left;

  return (
    <div className="preview" style={{ left, top, width: w, transformOrigin: `${origin}px ${imgH / 2}px` }} onMouseLeave={onClose}>
      <button className="preview-art" onClick={() => onOpen(item.id)} aria-label={`${item.title} detayları`}>
        <Poster item={item} shape="land" />
      </button>
      <div className="preview-body">
        <div className="preview-btns">
          <button className="circle white" title="Detaylar" onClick={() => onOpen(item.id)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 4v16l14-8z" /></svg>
          </button>
          {item.status === 'bitti' ? (
            <span className="circle on" title="Bitirdim">✓</span>
          ) : (
            <button className="circle" title="Bitirdim olarak işaretle" onClick={() => onFinish(item.id)}>✓</button>
          )}
          <button className="circle" title="Düzenle" onClick={() => onEdit(item.id)}>✎</button>
          <button className="circle push" title="Daha fazla bilgi" onClick={() => onOpen(item.id)}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m6 9 6 6 6-6" /></svg>
          </button>
        </div>
        <div className="preview-meta">
          {item.rating > 0 && <span className="match">{item.rating * 20}% beğeni</span>}
          <span className="maturity">{STATUS[item.status]}</span>
          {year && <span>{year}</span>}
          <span className="hd">{T.label.toLocaleUpperCase('tr')}</span>
        </div>
        <div className="preview-tags">
          {item.creator && <span>{item.creator}</span>}
          {item.rating > 0 && <span>{'★'.repeat(item.rating)}</span>}
          {item.note && <span className="note">{item.note}</span>}
        </div>
      </div>
    </div>
  );
}
