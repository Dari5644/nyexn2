import { db } from './index.js';
export const add = a => db.prepare('INSERT OR IGNORE INTO assets (filename, original, mime, size, kind) VALUES (?,?,?,?,?)').run(a.filename, a.original, a.mime, a.size, a.kind);
export const list = () => db.prepare('SELECT * FROM assets ORDER BY id DESC').all();
export const get = id => db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
export const remove = id => db.prepare('DELETE FROM assets WHERE id = ?').run(id);
