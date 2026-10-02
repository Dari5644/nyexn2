import { db } from './index.js';
export const addAudit = a => db.prepare('INSERT INTO audit_log (at, actor, role, action, target, detail, ip) VALUES (?,?,?,?,?,?,?)').run(Date.now(), a.actor || '', a.role || '', a.action, a.target || '', a.detail || '', a.ip || '');
export function listAudit({ q = '', limit = 100, offset = 0 }) {
  const like = `%${q}%`;
  return db.prepare('SELECT * FROM audit_log WHERE actor LIKE ? OR action LIKE ? OR target LIKE ? OR detail LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?').all(like, like, like, like, limit, offset);
}
const j = v => (v === undefined ? null : JSON.stringify(v));
export const addHistory = h => db.prepare('INSERT INTO field_history (at, actor, role, label, path, old_json, new_json) VALUES (?,?,?,?,?,?,?)').run(Date.now(), h.actor, h.role, h.label, h.path, j(h.old), j(h.new));
export function listHistory({ q = '', limit = 100, offset = 0 }) {
  const like = `%${q}%`;
  return db.prepare('SELECT * FROM field_history WHERE path LIKE ? OR actor LIKE ? OR label LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?').all(like, like, like, limit, offset);
}
export const getHistory = id => db.prepare('SELECT * FROM field_history WHERE id = ?').get(id);
export const pruneHistory = keep => db.prepare('DELETE FROM field_history WHERE id NOT IN (SELECT id FROM field_history ORDER BY id DESC LIMIT ?)').run(keep);
export const pruneAudit = keep => db.prepare('DELETE FROM audit_log WHERE id NOT IN (SELECT id FROM audit_log ORDER BY id DESC LIMIT ?)').run(keep);
