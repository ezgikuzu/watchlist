import { useRef } from 'react';
import Poster from './Poster.jsx';

const HOVER_DELAY = 420;
const canHover = () => window.matchMedia('(hover: hover)').matches;
const isNew = (it) => Date.now() - (it.created || 0) < 7 * 864e5;

// Raflardaki ve ızgaradaki kart. Fareyle bekleyince büyüyen önizlemeyi açar.
export default function Card({ item, onOpen, onPreview, shape = 'land' }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const enter = () => {
    if (!onPreview || !canHover()) return;
    timer.current = setTimeout(() => onPreview(item.id, ref.current.getBoundingClientRect()), HOVER_DELAY);
  };
  const leave = () => clearTimeout(timer.current);
  return (
    <button ref={ref} className={`card card-${shape}`} onClick={() => { leave(); onOpen(item.id); }}
      onMouseEnter={enter} onMouseLeave={leave} aria-label={item.title}>
      <Poster item={item} shape={shape}>
        {isNew(item) && item.status !== 'devam' && <span className="tag-new">Yeni eklendi</span>}
        {item.status === 'devam' && <span className="progress"><i /></span>}
      </Poster>
    </button>
  );
}
