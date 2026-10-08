// Takip Listem sunucusu: derlenmiş uygulamayı sunar ve kayıtları SQLite'ta saklar.
// Yalnızca bu bilgisayardan (127.0.0.1) erişilebilir.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDatabase } from './db.js';
import { sanitizeItem, sanitizeList } from '../src/shared/model.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5178;
const HOST = '127.0.0.1';
const DB_FILE = process.env.DB_FILE || join(ROOT, 'data', 'takip.db');
const APP_FILE = join(ROOT, 'dist', 'index.html');
const MAX_BODY = 25 * 1024 * 1024;
const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);

const db = openDatabase(DB_FILE);

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

function send(res, status, body) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(data);
}

async function readJson(req) {
  // JSON zorunluluğu, başka sitelerden gönderilen basit form isteklerini engeller.
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) {
    throw new HttpError(415, 'İstek JSON olmalı');
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > MAX_BODY) throw new HttpError(413, 'İstek çok büyük');
    chunks.push(c);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new HttpError(400, 'Geçersiz JSON'); }
}

async function handleApi(req, res, path) {
  const [, , resource, id] = path.split('/'); // /api/items/:id
  const method = req.method;

  if (resource === 'health' && method === 'GET') return send(res, 200, { ok: true, count: db.count() });

  if (resource === 'items' && !id) {
    if (method === 'GET') return send(res, 200, db.list());
    if (method === 'POST') {
      const item = sanitizeItem(await readJson(req), { keepId: false });
      if (!item) throw new HttpError(400, 'Ad alanı zorunlu');
      const now = Date.now();
      return send(res, 201, db.save({ ...item, created: now, updated: now }));
    }
  }

  if (resource === 'items' && id) {
    const existing = db.get(decodeURIComponent(id));
    if (!existing) throw new HttpError(404, 'Kayıt bulunamadı');
    if (method === 'PUT') {
      const item = sanitizeItem({ ...(await readJson(req)), id: existing.id });
      if (!item) throw new HttpError(400, 'Ad alanı zorunlu');
      return send(res, 200, db.save({ ...item, created: existing.created, updated: Date.now() }));
    }
    if (method === 'DELETE') { db.remove(existing.id); return send(res, 204); }
  }

  if (resource === 'import' && method === 'POST') {
    const body = await readJson(req);
    const items = sanitizeList(body);
    if (!items) throw new HttpError(400, 'Dosyada geçerli kayıt bulunamadı');
    const mode = body.mode === 'replace' ? 'replace' : 'merge';
    return send(res, 200, { imported: items.length, total: db.importItems(items, mode) });
  }

  throw new HttpError(404, 'Bulunamadı');
}

const server = createServer(async (req, res) => {
  try {
    // DNS rebinding'e karşı: yalnızca localhost adresleriyle gelen istekler.
    if (!ALLOWED_HOSTS.has(req.headers.host)) throw new HttpError(403, 'İzin verilmeyen adres');
    const path = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (path.startsWith('/api/')) return await handleApi(req, res, path);

    if (req.method === 'GET' && (path === '/' || path === '/index.html')) {
      const html = await readFile(APP_FILE).catch(() => null);
      if (!html) throw new HttpError(500, 'Uygulama derlenmemiş. Önce "npm run build" çalıştırın.');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
      return res.end(html);
    }
    if (path === '/favicon.ico') { res.writeHead(204); return res.end(); }
    throw new HttpError(404, 'Bulunamadı');
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) send(res, status, { error: e instanceof HttpError ? e.message : 'Sunucu hatası' });
    else res.end();
  }
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log(`Takip Listem zaten çalışıyor olabilir: http://localhost:${PORT}`);
    process.exit(0);
  }
  throw e;
});

server.listen(PORT, HOST, () => {
  console.log(`\n  Takip Listem çalışıyor → http://localhost:${PORT}`);
  console.log(`  Veritabanı: ${DB_FILE}`);
  console.log('  Kapatmak için bu pencerede Ctrl+C\n');
});

const shutdown = () => { server.close(); db.close(); process.exit(0); };
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
