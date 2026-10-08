import { TYPES, gradientFor } from '../store.js';

// Kayıt görseli. shape: 'land' (16:9 kart), 'port' (2:3 afiş), 'fill' (kapsayıcıyı doldurur).
// Kapak yoksa isimden türetilen renklerle bir görsel çizilir.
export default function Poster({ item, shape = 'land', showTitle = true, className = '', children }) {
  const T = TYPES[item.type] || TYPES.kitap;
  const [g1, g2] = gradientFor(item);
  const title = item.title || 'Başlıksız';
  const long = Math.max(...title.split(/\s+/).map((w) => w.length));
  return (
    <div className={`art art-${shape} ${className}`} style={{ '--g1': g1, '--g2': g2 }}>
      {item.poster ? (
        <img src={item.poster} alt="" loading="lazy" draggable="false" />
      ) : (
        <div className="art-gen" aria-hidden="true"><span className="art-icon">{T.icon}</span></div>
      )}
      <span className="art-badge">{T.label}</span>
      {showTitle && (
        <span className={`art-title${title.length > 22 || long > 12 ? ' sm' : ''}`}>{title}</span>
      )}
      {children}
    </div>
  );
}
