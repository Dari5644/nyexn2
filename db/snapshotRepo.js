import { db } from './index.js';
export const add = (label, cfg) => db.prepare('INSERT INTO snapshots (label, data) VALUES (?, ?)').run(label, JSON.stringify(cfg)).lastInsertRowid;
export const list = () => db.prepare('SELECT id, created_at, label FROM snapshots ORDER BY id DESC LIMIT 100').all();
export const get = id => { const r = db.prepare('SELECT data FROM snapshots WHERE id = ?').get(id); return r ? JSON.parse(r.data) : null; };
export const prune = keep => db.prepare('DELETE FROM snapshots WHERE id NOT IN (SELECT id FROM snapshots ORDER BY id DESC LIMIT ?)').run(keep);
