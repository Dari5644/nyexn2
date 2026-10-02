import { db } from './index.js';
export const create = s => db.prepare('INSERT INTO staff (username, pass_hash, perms, created_at, created_by) VALUES (?,?,?,?,?)').run(s.username, s.passHash, JSON.stringify(s.perms || {}), Date.now(), s.createdBy || '').lastInsertRowid;
export const byUsername = u => db.prepare('SELECT * FROM staff WHERE username = ?').get(u);
export const byId = id => db.prepare('SELECT * FROM staff WHERE id = ?').get(id);
export const list = () => db.prepare('SELECT id, username, perms, disabled, waive_kick, kick_user_id, kick_name, created_at, created_by, last_login FROM staff ORDER BY id').all();
export const update = (id, f) => db.prepare('UPDATE staff SET perms = ?, disabled = ?, waive_kick = ? WHERE id = ?').run(JSON.stringify(f.perms || {}), f.disabled ? 1 : 0, f.waive ? 1 : 0, id);
export const setPassword = (id, hash) => db.prepare('UPDATE staff SET pass_hash = ? WHERE id = ?').run(hash, id);
export const setKick = (id, kid, name) => db.prepare('UPDATE staff SET kick_user_id = ?, kick_name = ? WHERE id = ?').run(String(kid), name, id);
export const touchLogin = id => db.prepare('UPDATE staff SET last_login = ? WHERE id = ?').run(Date.now(), id);
export const remove = id => { db.prepare('DELETE FROM staff_devices WHERE staff_id = ?').run(id); db.prepare('DELETE FROM staff WHERE id = ?').run(id); };
export function touchDevice(staffId, dhash, ua, ip) {
  const now = Date.now(), cur = db.prepare('SELECT * FROM staff_devices WHERE staff_id = ? AND dhash = ?').get(staffId, dhash);
  if (!cur) { db.prepare('INSERT INTO staff_devices (staff_id, dhash, ua, ip, first_seen, last_seen) VALUES (?,?,?,?,?,?)').run(staffId, dhash, ua, ip, now, now); return { known: false, trusted: false, revoked: false }; }
  db.prepare('UPDATE staff_devices SET last_seen = ?, ip = ?, ua = ?, logins = logins + 1 WHERE id = ?').run(now, ip, ua, cur.id);
  return { known: true, trusted: !!cur.trusted, revoked: !!cur.revoked };
}
export const device = (staffId, dhash) => db.prepare('SELECT * FROM staff_devices WHERE staff_id = ? AND dhash = ?').get(staffId, dhash);
export const devices = staffId => db.prepare('SELECT id, ua, ip, first_seen, last_seen, trusted, revoked, logins FROM staff_devices WHERE staff_id = ? ORDER BY last_seen DESC').all(staffId);
export const setDevice = (id, f) => db.prepare('UPDATE staff_devices SET trusted = ?, revoked = ? WHERE id = ?').run(f.trusted ? 1 : 0, f.revoked ? 1 : 0, id);
