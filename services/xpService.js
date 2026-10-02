import * as repo from '../db/xpRepo.js';
import { getFull } from './configService.js';
const last = new Map();
const weekKey = () => { const d = new Date(); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
export const levelOf = xp => Math.floor(Math.sqrt(xp / 100));
export function award(sender) {
  const c = getFull().xp;
  if (!c.enabled || !sender?.user_id) return;
  const id = String(sender.user_id), now = Date.now();
  if (now - (last.get(id) || 0) < c.cooldown * 1000) return;
  last.set(id, now);
  const lo = Math.max(1, Number(c.min) || 5), hi = Math.max(lo, Number(c.max) || 15);
  repo.award({ id, name: sender.username || id, avatar: sender.profile_picture || '', color: sender.identity?.username_color || '', xp: lo + Math.floor(Math.random() * (hi - lo + 1)), week: weekKey() });
}
export function leaderboard(period, limit) {
  const n = Math.min(100, Math.max(1, Number(limit) || 25));
  const rows = period === 'week' ? repo.topWeek(weekKey(), n) : repo.top(n);
  return rows.map((r, i) => { const xp = period === 'week' ? r.week_xp : r.xp, lv = levelOf(r.xp); return { rank: i + 1, name: r.username, avatar: r.avatar, color: r.color, xp, totalXp: r.xp, level: lv, levelFloor: lv * lv * 100, next: (lv + 1) ** 2 * 100, messages: r.messages }; });
}
export const reset = () => { repo.clear(); return { ok: true }; };
