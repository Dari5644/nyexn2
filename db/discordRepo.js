import { db } from './index.js';
export const addLog = l => db.prepare('INSERT INTO discord_logs (at, type, user_id, user_name, channel_id, content) VALUES (?,?,?,?,?,?)').run(Date.now(), l.type, l.userId, l.userName, l.channelId, l.content);
export function listLogs({ type = '', q = '', limit = 100, offset = 0 }) {
  let sql = 'SELECT * FROM discord_logs WHERE 1=1'; const p = [];
  if (type) { sql += ' AND type = ?'; p.push(type); }
  if (q) { sql += ' AND (content LIKE ? OR user_name LIKE ? OR user_id LIKE ?)'; p.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  return db.prepare(sql + ' ORDER BY id DESC LIMIT ? OFFSET ?').all(...p, limit, offset);
}
export const clearLogs = () => db.prepare('DELETE FROM discord_logs').run();
export const pruneLogs = before => db.prepare('DELETE FROM discord_logs WHERE at < ?').run(before);
export const addTicket = t => db.prepare('INSERT INTO tickets (channel_id, user_id, user_name, opened_at) VALUES (?,?,?,?)').run(t.channelId, t.userId, t.userName, Date.now());
export const openTicketByUser = uid => db.prepare("SELECT * FROM tickets WHERE user_id = ? AND status = 'open'").get(uid);
export const ticketByChannel = cid => db.prepare('SELECT * FROM tickets WHERE channel_id = ?').get(cid);
export const ticketById = id => db.prepare('SELECT * FROM tickets WHERE id = ?').get(id);
export const closeTicket = (cid, by) => db.prepare("UPDATE tickets SET status = 'closed', closed_at = ?, closed_by = ? WHERE channel_id = ? AND status = 'open'").run(Date.now(), by, cid);
export const listTickets = () => db.prepare('SELECT * FROM tickets ORDER BY id DESC LIMIT 200').all();
