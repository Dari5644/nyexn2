import { db } from './index.js';
export const addSub = s => db.prepare('INSERT INTO push_subs (endpoint, p256dh, auth, created_at) VALUES (?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth').run(s.endpoint, s.keys.p256dh, s.keys.auth, Date.now());
export const removeSub = e => db.prepare('DELETE FROM push_subs WHERE endpoint = ?').run(e);
export const subs = () => db.prepare('SELECT * FROM push_subs').all().map(r => ({ endpoint: r.endpoint, keys: { p256dh: r.p256dh, auth: r.auth } }));
export const subCount = () => db.prepare('SELECT COUNT(*) n FROM push_subs').get().n;
export const addAnnouncement = a => { const at = Date.now(); const id = db.prepare('INSERT INTO announcements (at, title, body, url, actor) VALUES (?,?,?,?,?)').run(at, a.title, a.body, a.url, a.actor).lastInsertRowid; return { id, at, title: a.title, body: a.body, url: a.url }; };
export const announcements = n => db.prepare('SELECT id, at, title, body, url FROM announcements ORDER BY id DESC LIMIT ?').all(n);
