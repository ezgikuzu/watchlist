import { useEffect, useRef, useState } from 'react';

const LINKS = [
  { href: '#', key: 'home', label: 'Ana Sayfa' },
  { href: '#kitaplar', key: 'kitaplar', label: 'Kitaplar' },
  { href: '#diziler', key: 'diziler', label: 'Diziler' },
  { href: '#filmler', key: 'filmler', label: 'Filmler' },
  { href: '#tumu', key: 'tumu', label: 'Listem' },
  { href: '#istatistikler', key: 'istatistikler', label: 'İstatistikler' },
];

export default function Nav({ active, query, onQuery, onAdd, onExport, onImport }) {
  const [solid, setSolid] = useState(false);
  const [searchOpen, setSearchOpen] = useState(!!query);
  const [menuOpen, setMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menuOpen]);

  const toggleSearch = () => {
    if (searchOpen && !query) setSearchOpen(false);
    else { setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }
  };

  return (
    <header className={`nav${solid ? ' solid' : ''}`}>
      <a className="logo" href="#" aria-label="Takip Listem ana sayfa">TAKİP<b>LİSTEM</b></a>
      <nav className="links" aria-label="Bölümler">
        {LINKS.map((l) => (
          <a key={l.key} href={l.href} className={active === l.key ? 'active' : ''}>{l.label}</a>
        ))}
      </nav>
      <div className="nav-right">
        <div className={`search${searchOpen ? ' open' : ''}`}>
          <button className="icon-btn" onClick={toggleSearch} aria-label="Ara">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          </button>
          <input
            ref={inputRef}
            type="search"
            placeholder="Ad, yazar, yönetmen"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { onQuery(''); setSearchOpen(false); } }}
            onBlur={() => { if (!query) setSearchOpen(false); }}
            tabIndex={searchOpen ? 0 : -1}
          />
        </div>
        <button className="add-btn" onClick={onAdd} title="Yeni kayıt ekle">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 5v14M5 12h14" /></svg>
          <span className="lbl">Ekle</span>
        </button>
        <div className={`menu${menuOpen ? ' open' : ''}`} ref={menuRef}>
          <button className="profile" aria-label="Profil menüsü" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)}>
            <span className="avatar" aria-hidden="true">
              <svg viewBox="0 0 32 32" width="32" height="32"><rect width="32" height="32" rx="4" fill="#2f7ae5" /><circle cx="11" cy="13" r="2" fill="#fff" /><circle cx="21" cy="13" r="2" fill="#fff" /><path d="M9 20c2 3 12 3 14 0" stroke="#fff" strokeWidth="2.2" fill="none" strokeLinecap="round" /></svg>
            </span>
            <span className="caret" aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className="menu-pop" role="menu">
              <span className="menu-arrow" />
              <button role="menuitem" onClick={() => { setMenuOpen(false); onAdd(); }}>＋ Yeni kayıt ekle</button>
              <a role="menuitem" href="#istatistikler" onClick={() => setMenuOpen(false)}>📊 İstatistiklerim</a>
              <hr />
              <button role="menuitem" onClick={() => { setMenuOpen(false); onExport(); }}>⬇ Yedeği dışa aktar</button>
              <button role="menuitem" onClick={() => { setMenuOpen(false); fileRef.current.click(); }}>⬆ Yedekten içe aktar</button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) onImport(f); }}
          />
        </div>
      </div>
    </header>
  );
}
