import { db } from './index.js';
export function get() {
  const r = db.prepare('SELECT value FROM kv WHERE key = ?').get('config');
  return r ? JSON.parse(r.value) : null;
}
export function set(cfg) {
  db.prepare('INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value').run('config', JSON.stringify(cfg));
}
