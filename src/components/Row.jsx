import { useEffect, useRef, useState } from 'react';
import Card from './Card.jsx';

// Netflix tarzı raf: sayfa sayfa kayar, sağ üstte sayfa göstergesi.
export default function Row({ title, items, seeAll, onOpen, onPreview, top10 = false }) {
  const track = useRef(null);
  const [pages, setPages] = useState({ count: 1, index: 0 });

  useEffect(() => {
    const el = track.current;
    const update = () => {
      const count = Math.max(1, Math.ceil((el.scrollWidth - 1) / el.clientWidth));
      const index = Math.min(count - 1, Math.round(el.scrollLeft / el.clientWidth));
      setPages((p) => (p.count === count && p.index === index ? p : { count, index }));
    };
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', update); ro.disconnect(); };
  }, [items.length]);

  const scroll = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth, behavior: 'smooth' });
  const atStart = pages.index === 0, atEnd = pages.index >= pages.count - 1;

  return (
    <section className={`row${top10 ? ' row-top10' : ''}`}>
      <div className="row-head">
        <h2>{seeAll ? <a href={seeAll}>{title}<span className="explore">Tümünü keşfet <b>›</b></span></a> : title}</h2>
        {pages.count > 1 && (
          <ul className="pager" aria-hidden="true">
            {Array.from({ length: pages.count }, (_, i) => <li key={i} className={i === pages.index ? 'on' : ''} />)}
          </ul>
        )}
      </div>
      <div className="row-wrap">
        {!atStart && <button className="arrow l" aria-label="Geri kaydır" onClick={() => scroll(-1)}><span>‹</span></button>}
        <div className="track" ref={track}>
          {items.map((it, i) => top10 ? (
            <div className="top10-item" key={it.id}>
              <span className="rank" aria-hidden="true">{i + 1}</span>
              <Card item={it} shape="port" onOpen={onOpen} onPreview={onPreview} />
            </div>
          ) : (
            <Card key={it.id} item={it} onOpen={onOpen} onPreview={onPreview} />
          ))}
        </div>
        {!atEnd && <button className="arrow r" aria-label="İleri kaydır" onClick={() => scroll(1)}><span>›</span></button>}
      </div>
    </section>
  );
}
