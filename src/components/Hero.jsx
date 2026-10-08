import { useEffect, useState } from 'react';
import Poster from './Poster.jsx';
import { STATUS, TYPES, yearOf } from '../store.js';

const KICKER = { devam: 'Devam ediyorsun', bitti: 'Favorilerinden', liste: 'Sırada bekliyor' };
const ROTATE_MS = 9000;

export function WelcomeHero({ onAdd }) {
  return (
    <section className="billboard welcome">
      <div className="bb-art welcome-art" aria-hidden="true">
        {['📖', '🎬', '📺', '🎬', '📖', '📺', '📖', '🎬', '📺', '🎬', '📖', '📺'].map((e, i) => <span key={i}>{e}</span>)}
      </div>
      <div className="bb-vignette" />
      <div className="bb-info">
        <h1 className="bb-title">Okuduğun her kitap. İzlediğin her dizi ve film.</h1>
        <p className="bb-desc">Hepsini tek yerde topla, puanla, notlarını sakla. Yıl sonunda ne kadar yol aldığını gör.</p>
        <div className="bb-btns">
          <button className="btn btn-red btn-xl" onClick={onAdd}>Başla ›</button>
        </div>
      </div>
    </section>
  );
}

// Ekranı kaplayan vitrin; birden fazla öne çıkan kayıt varsa sırayla döner.
export default function Hero({ items, onOpen, onEdit }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const item = items[index % items.length];

  useEffect(() => {
    if (items.length < 2 || paused) return;
    const t = setInterval(() => { if (!document.hidden) setIndex((i) => (i + 1) % items.length); }, ROTATE_MS);
    return () => clearInterval(t);
  }, [items.length, paused]);

  const T = TYPES[item.type] || TYPES.kitap;
  const year = yearOf(item);
  return (
    <section className="billboard" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="bb-art" key={item.id}>
        <Poster item={item} shape="fill" showTitle={false} />
      </div>
      <div className="bb-vignette" />
      <div className="bb-info" key={'i' + item.id}>
        <div className="bb-kicker"><span className="kicker-mark">{T.label.toLocaleUpperCase('tr')}</span>{KICKER[item.status]}</div>
        <h1 className="bb-title">{item.title}</h1>
        <div className="bb-meta">
          {item.rating > 0 && <span className="match">{item.rating * 20}% beğeni</span>}
          {year && <span>{year}</span>}
          {item.creator && <span>{item.creator}</span>}
        </div>
        {item.note && <p className="bb-desc">{item.note}</p>}
        <div className="bb-btns">
          <button className="btn btn-white btn-xl" onClick={() => onOpen(item.id)}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M6 4v16l14-8z" /></svg>Detaylar
          </button>
          <button className="btn btn-grey btn-xl" onClick={() => onEdit(item.id)}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>Düzenle
          </button>
        </div>
      </div>
      <div className="bb-side">
        <span className="bb-rating">{STATUS[item.status]}</span>
      </div>
      {items.length > 1 && (
        <div className="bb-dots">
          {items.map((it, i) => (
            <button key={it.id} className={i === index % items.length ? 'on' : ''} aria-label={`${i + 1}. öne çıkan`} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </section>
  );
}
