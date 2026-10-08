import Hero, { WelcomeHero } from './Hero.jsx';
import Row from './Row.jsx';
import { TYPES, TYPE_KEYS, pickFeatured, yearOf } from '../store.js';

const ROW_LIMIT = 24;
const byDate = (a, b) => (b.date || '').localeCompare(a.date || '') || (b.updated || 0) - (a.updated || 0);

export default function Home({ items, onOpen, onEdit, onAdd, onPreview }) {
  if (!items.length) return <WelcomeHero onAdd={onAdd} />;

  const year = new Date().getFullYear();
  const top10 = items
    .filter((i) => i.status === 'bitti' && i.rating > 0 && yearOf(i) === year)
    .sort((a, b) => b.rating - a.rating || byDate(a, b))
    .slice(0, 10);

  const rows = [
    { title: 'İzlemeye ve okumaya devam et', list: items.filter((i) => i.status === 'devam').sort((a, b) => (b.updated || 0) - (a.updated || 0)), seeAll: '#tumu?durum=devam' },
    { title: 'Listem', list: items.filter((i) => i.status === 'liste').sort((a, b) => (b.created || 0) - (a.created || 0)), seeAll: '#tumu?durum=liste' },
    { title: 'Yeni eklenenler', list: [...items].sort((a, b) => (b.created || 0) - (a.created || 0)).slice(0, 12) },
    { top10: true, title: `${year} yılında en sevdiğin ${top10.length} eser`, list: top10 },
    { title: 'Tekrar izlemeye değer', list: items.filter((i) => i.status === 'bitti' && i.rating >= 4).sort(byDate), seeAll: '#tumu?puan=4' },
    { title: 'Son bitirdiklerin', list: items.filter((i) => i.status === 'bitti').sort(byDate), seeAll: '#tumu?durum=bitti' },
    ...TYPE_KEYS.map((k) => ({ title: TYPES[k].plural, list: items.filter((i) => i.type === k).sort(byDate), seeAll: `#${TYPES[k].route}` })),
  ];

  return (
    <>
      <Hero items={pickFeatured(items)} onOpen={onOpen} onEdit={onEdit} />
      <div className="rows">
        {rows.filter((r) => (r.top10 ? r.list.length >= 3 : r.list.length)).map((r) => (
          <Row key={r.title} title={r.title} items={r.list.slice(0, ROW_LIMIT)} seeAll={r.seeAll} top10={r.top10} onOpen={onOpen} onPreview={onPreview} />
        ))}
      </div>
    </>
  );
}
