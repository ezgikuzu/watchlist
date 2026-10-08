import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const COLUMNS = ['id', 'type', 'title', 'creator', 'status', 'date', 'rating', 'note', 'poster', 'created', 'updated'];

export function openDatabase(file) {
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS items (
      id       TEXT PRIMARY KEY,
      type     TEXT NOT NULL CHECK (type IN ('kitap', 'dizi', 'film')),
      title    TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
      creator  TEXT NOT NULL DEFAULT '',
      status   TEXT NOT NULL CHECK (status IN ('bitti', 'devam', 'liste')),
      date     TEXT NOT NULL DEFAULT '',
      rating   INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
      note     TEXT NOT NULL DEFAULT '',
      poster   TEXT NOT NULL DEFAULT '',
      created  INTEGER NOT NULL,
      updated  INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS items_type_status ON items (type, status);
    CREATE INDEX IF NOT EXISTS items_date ON items (date);
  `);

  const q = {
    all: db.prepare('SELECT * FROM items ORDER BY date DESC, updated DESC'),
    get: db.prepare('SELECT * FROM items WHERE id = ?'),
    upsert: db.prepare(`
      INSERT INTO items (${COLUMNS.join(', ')}) VALUES (${COLUMNS.map((c) => ':' + c).join(', ')})
      ON CONFLICT(id) DO UPDATE SET ${COLUMNS.filter((c) => c !== 'id' && c !== 'created').map((c) => `${c} = excluded.${c}`).join(', ')}
    `),
    del: db.prepare('DELETE FROM items WHERE id = ?'),
    clear: db.prepare('DELETE FROM items'),
    count: db.prepare('SELECT COUNT(*) AS n FROM items'),
  };

  const tx = (fn) => {
    db.exec('BEGIN');
    try { const r = fn(); db.exec('COMMIT'); return r; }
    catch (e) { db.exec('ROLLBACK'); throw e; }
  };

  return {
    list: () => q.all.all().map((r) => ({ ...r })),
    get: (id) => { const r = q.get.get(id); return r ? { ...r } : null; },
    save: (item) => { q.upsert.run(item); return { ...q.get.get(item.id) }; },
    remove: (id) => q.del.run(id).changes > 0,
    count: () => q.count.get().n,
    importItems: (items, mode) => tx(() => {
      if (mode === 'replace') q.clear.run();
      for (const it of items) q.upsert.run(it);
      return q.count.get().n;
    }),
    close: () => db.close(),
  };
}
