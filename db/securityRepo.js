import { db } from './index.js';
export const upsertVisit = v => db.prepare(`INSERT INTO visitors (sid, ip, ua, device, os, browser, path, lang, referrer, entered_at, last_seen)
  VALUES (@sid, @ip, @ua, @device, @os, @browser, @path, @lang, @referrer, @now, @now)
  ON CONFLICT(sid) DO UPDATE SET last_seen = @now, left_at = NULL, path = @path`).run(v);
export const touch = (sid, now) => db.prepare('UPDATE visitors SET last_seen = ? WHERE sid = ?').run(now, sid);
export const leave = (sid, now) => db.prepare('UPDATE visitors SET last_seen = ?, left_at = ? WHERE sid = ?').run(now, now, sid);
export function list({ q = '', limit = 50, offset = 0 }) {
  const like = `%${q}%`;
  return db.prepare(`SELECT v.*, (SELECT COUNT(*) FROM visitors x WHERE x.ip = v.ip) AS visits, EXISTS(SELECT 1 FROM ip_bans b WHERE b.ip = v.ip) AS banned
    FROM visitors v WHERE v.ip LIKE ? OR v.ua LIKE ? OR v.device LIKE ? OR v.os LIKE ? OR v.browser LIKE ? ORDER BY v.entered_at DESC LIMIT ? OFFSET ?`).all(like, like, like, like, like, limit, offset);
}
export function stats(now) {
  const day = new Date(); day.setHours(0, 0, 0, 0);
  const one = (sql, ...p) => db.prepare(sql).get(...p).n;
  return { total: one('SELECT COUNT(*) n FROM visitors'), uniqueIps: one('SELECT COUNT(DISTINCT ip) n FROM visitors'),
    onlineNow: one('SELECT COUNT(*) n FROM visitors WHERE left_at IS NULL AND last_seen > ?', now - 70000), today: one('SELECT COUNT(*) n FROM visitors WHERE entered_at >= ?', day.getTime()) };
}
export const bans = () => db.prepare('SELECT * FROM ip_bans ORDER BY banned_at DESC').all();
export const ban = (ip, reason) => db.prepare('INSERT INTO ip_bans (ip, reason, banned_at) VALUES (?, ?, ?) ON CONFLICT(ip) DO UPDATE SET reason = excluded.reason').run(ip, reason, Date.now());
export const unban = ip => db.prepare('DELETE FROM ip_bans WHERE ip = ?').run(ip);
export const prune = before => db.prepare('DELETE FROM visitors WHERE entered_at < ?').run(before);
