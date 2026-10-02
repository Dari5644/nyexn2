import net from 'net';
import * as repo from '../db/securityRepo.js';
import { reloadBans } from '../middleware/ipBan.js';
import { str } from '../utils/sanitize.js';
import { HttpError } from '../utils/httpError.js';
export function visitors(q) {
  const now = Date.now();
  const limit = Math.min(200, Number(q.limit) || 50), offset = Math.max(0, Number(q.offset) || 0);
  return repo.list({ q: str(q.q, 80), limit, offset }).map(v => {
    const online = v.left_at == null && now - v.last_seen < 70000;
    const exitAt = v.left_at ?? (online ? null : v.last_seen);
    return { id: v.id, ip: v.ip, device: v.device, os: v.os, browser: v.browser, ua: v.ua, path: v.path, lang: v.lang, referrer: v.referrer, enteredAt: v.entered_at, exitAt, online, visits: v.visits, banned: !!v.banned, durationSec: Math.round(((exitAt ?? now) - v.entered_at) / 1000) };
  });
}
export const stats = () => repo.stats(Date.now());
export const bans = () => repo.bans();
export function ban(ip, reason, requesterIp) {
  if (!net.isIP(String(ip || ''))) throw new HttpError(400, 'Invalid IP address');
  if (ip === requesterIp) throw new HttpError(400, 'You cannot ban your own IP');
  repo.ban(ip, str(reason, 200)); reloadBans();
  return { ok: true };
}
export function unban(ip) { repo.unban(String(ip || '')); reloadBans(); return { ok: true }; }
export const pruneOld = () => repo.prune(Date.now() - 90 * 86400000);
