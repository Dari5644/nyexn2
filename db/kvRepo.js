import { db } from './index.js';
export const get = k => { const r = db.prepare('SELECT value FROM kv WHERE key = ?').get(k); return r ? JSON.parse(r.value) : null; };
export const set = (k, v) => db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run(k, JSON.stringify(v));
export const del = k => db.prepare('DELETE FROM kv WHERE key = ?').run(k);
