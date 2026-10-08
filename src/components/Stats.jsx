import { useEffect, useMemo, useRef, useState } from 'react';
import { MONTHS, MONTHS_LONG, TYPES, TYPE_KEYS, fmtAvg, yearOf } from '../store.js';

const avg = (arr) => (arr.length ? arr.reduce((s, i) => s + i.rating, 0) / arr.length : 0);

function MonthlyChart({ months, year }) {
  const wrap = useRef(null);
  const [W, setW] = useState(600);
  const [tip, setTip] = useState(null);
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(wrap.current);
    return () => ro.disconnect();
  }, []);

  const H = 280, pad = { l: 28, r: 8, t: 24, b: 26 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const totals = months.map((m) => TYPE_KEYS.reduce((s, k) => s + m[k], 0));
  const maxV = Math.max(...totals, 0);
  const step = maxV <= 5 ? 1 : maxV <= 10 ? 2 : Math.ceil(maxV / 5);
  const top = Math.max(step * Math.ceil(maxV / step), step * 2);
  const y = (v) => pad.t + ih - (v / top) * ih;
  const slot = iw / 12, bw = Math.min(30, slot * 0.6);
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);

  return (
    <div className="chart-wrap" ref={wrap}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${year} yılında aylara göre bitirilen kayıtlar`}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid-line" x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} />
            <text x={pad.l - 8} y={y(v) + 4} textAnchor="end">{v}</text>
          </g>
        ))}
        {months.map((m, i) => {
          const cx = pad.l + slot * i + slot / 2, x = cx - bw / 2;
          const present = TYPE_KEYS.filter((k) => m[k]);
          let acc = 0;
          return (
            <g key={i}>
              <rect className={`hit${tip?.i === i ? ' on' : ''}`} x={pad.l + slot * i + 1} y={pad.t - 8} width={slot - 2} height={ih + 8} rx={6}
                onMouseEnter={() => setTip({ i, x: cx })} onMouseLeave={() => setTip(null)}
                onClick={() => setTip((t) => (t?.i === i ? null : { i, x: cx }))} />
              {present.map((k, idx) => {
                const y0 = y(acc), y1 = y(acc + m[k]);
                acc += m[k];
                const isTop = idx === present.length - 1;
                const gap = isTop ? 0 : 2; // segmentler arası 2px boşluk
                const yt = y1 + gap, h = Math.max(0, y0 - yt);
                const r = isTop ? Math.min(4, h, bw / 2) : 0;
                return (
                  <path key={k} pointerEvents="none" fill={TYPES[k].color}
                    d={`M${x},${y0} V${yt + r} Q${x},${yt} ${x + r},${yt} H${x + bw - r} Q${x + bw},${yt} ${x + bw},${yt + r} V${y0} Z`} />
                );
              })}
              {totals[i] > 0 && <text className="total" x={cx} y={y(totals[i]) - 6} textAnchor="middle">{totals[i]}</text>}
              {(slot >= 34 || i % 2 === 0) && <text x={cx} y={H - 8} textAnchor="middle">{MONTHS[i]}</text>}
            </g>
          );
        })}
      </svg>
      {tip && (
        <div className="tooltip" style={{ left: Math.min(Math.max(tip.x - 75, 0), W - 150) }}>
          <b>{MONTHS_LONG[tip.i]} {year}</b>
          {TYPE_KEYS.map((k) => (
            <div key={k}><span><i style={{ background: TYPES[k].color }} />{TYPES[k].label}</span><em>{months[tip.i][k]}</em></div>
          ))}
          <div className="sum"><span>Toplam</span><em>{totals[tip.i]}</em></div>
        </div>
      )}
    </div>
  );
}

export default function Stats({ items }) {
  const cur = new Date().getFullYear();
  const years = useMemo(() => {
    const s = new Set([cur, ...items.filter((i) => i.status === 'bitti').map(yearOf).filter(Boolean)]);
    return [...s].sort((a, b) => b - a);
  }, [items, cur]);
  const [year, setYear] = useState(cur);

  const done = items.filter((i) => i.status === 'bitti' && yearOf(i) === year);
  const rated = done.filter((i) => i.rating);
  const months = MONTHS.map(() => ({ kitap: 0, dizi: 0, film: 0 }));
  done.forEach((i) => { const m = Number(i.date.slice(5, 7)) - 1; if (months[m] && months[m][i.type] !== undefined) months[m][i.type]++; });

  return (
    <main className="page">
      <div className="page-head">
        <div>
          <h1>İstatistikler</h1>
          <p className="muted">{year === cur ? `Bu yıl (${year})` : `${year} yılı`} bitirdiklerin</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Yıl" className="year-sel">
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="tiles">
        {TYPE_KEYS.map((k) => (
          <div className="tile" key={k}>
            <div className="lbl"><i style={{ background: TYPES[k].color }} />{TYPES[k].plural}</div>
            <div className="val">{done.filter((i) => i.type === k).length}</div>
            <div className="sub">bitirildi</div>
          </div>
        ))}
        <div className="tile">
          <div className="lbl">Ortalama puan</div>
          <div className="val">{rated.length ? fmtAvg(avg(rated)) : '–'}</div>
          <div className="sub">{rated.length} puanlı kayıt</div>
        </div>
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>Aylara göre bitirilenler</h2>
          <div className="legend">
            {TYPE_KEYS.map((k) => <span key={k}><i style={{ background: TYPES[k].color }} />{TYPES[k].label}</span>)}
          </div>
        </div>
        <MonthlyChart months={months} year={year} />
        <details className="table-view">
          <summary>Tablo olarak göster</summary>
          <table>
            <thead><tr><th>Ay</th>{TYPE_KEYS.map((k) => <th key={k}>{TYPES[k].label}</th>)}<th>Toplam</th></tr></thead>
            <tbody>
              {months.map((m, i) => (
                <tr key={i}><td>{MONTHS_LONG[i]}</td>{TYPE_KEYS.map((k) => <td key={k}>{m[k]}</td>)}<td>{m.kitap + m.dizi + m.film}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>Ortalama puanların</h2><span className="muted">tüm zamanlar</span></div>
        <div className="avg-row">
          {TYPE_KEYS.map((k) => {
            const r = items.filter((i) => i.type === k && i.rating);
            const a = avg(r);
            return (
              <div className="avg" key={k}>
                <div className="avg-top"><span>{TYPES[k].icon} {TYPES[k].label}</span><b>{r.length ? `${fmtAvg(a)} / 5` : '–'}</b></div>
                <div className="bar"><i style={{ width: `${(a / 5) * 100}%`, background: TYPES[k].color }} /></div>
                <div className="sub">{r.length} puanlı kayıt</div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
